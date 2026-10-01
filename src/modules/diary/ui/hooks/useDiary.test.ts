import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDiary } from "./useDiary";

const { deletePhotoMock, orderMock, upsertMock, deleteExecMock } = vi.hoisted(() => ({
  deletePhotoMock: vi.fn(),
  orderMock: vi.fn(),
  upsertMock: vi.fn(),
  deleteExecMock: vi.fn(),
}));

vi.mock("@/modules/diary/repository/diary.repository", () => ({
  fetchDiaryEntries: orderMock,
  upsertDiaryEntry: upsertMock,
  deleteDiaryEntry: deleteExecMock,
}));

vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  return {
    ...actual,
  deletePhoto: deletePhotoMock,
  };
});

function setOnlineState(isOnline: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: isOnline,
  });
}

describe("useDiary", () => {
  beforeEach(() => {
    localStorage.clear();
    orderMock.mockReset();
    upsertMock.mockReset();
    deleteExecMock.mockReset();
    deletePhotoMock.mockReset();
    orderMock.mockResolvedValue({ data: [], error: null });
    upsertMock.mockResolvedValue({ error: null });
    deleteExecMock.mockResolvedValue({ error: null });
    setOnlineState(true);
  });

  it("does not load or flush another user's offline queue and quarantines legacy data", async () => {
    const userAItem = {
      type: "upsert" as const,
      weekIndex: 5,
      content: "Entry A",
      updatedAt: "2026-04-01T00:00:00.000Z",
    };

    localStorage.setItem("liw-offline-diary-queue:user-a", JSON.stringify([userAItem]));
    localStorage.setItem("liw-offline-diary-queue", JSON.stringify([{
      type: "upsert",
      weekIndex: 8,
      content: "Legacy entry",
      updatedAt: "2026-04-01T00:00:00.000Z",
    }]));

    const { result } = renderHook(() => useDiary("user-b"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toEqual({});
    expect(upsertMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("liw-offline-diary-queue")).toBeNull();
    expect(localStorage.getItem("liw-offline-diary-queue:legacy")).not.toBeNull();

    upsertMock.mockClear();

    renderHook(() => useDiary("user-a"));

    await waitFor(() =>
      expect(upsertMock).toHaveBeenCalledWith("user-a", 5, "Entry A", undefined),
    );
  });

  it("preserves photos on text-only edits and clears them only when explicitly passed", async () => {
    orderMock.mockResolvedValue({
      data: [{
        id: "entry-1",
        user_id: "user-a",
        week_index: 4,
        content: "Old entry",
        photos: ["photo-1.jpg"],
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      }],
      error: null,
    });

    const { result } = renderHook(() => useDiary("user-a"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveEntry(4, "Updated entry");
    });

    expect(result.current.fullEntries[0]?.photos).toEqual(["photo-1.jpg"]);
    const preserveCall = upsertMock.mock.calls[upsertMock.mock.calls.length - 1];
    expect(preserveCall?.[3]).toBeUndefined();

    await act(async () => {
      await result.current.saveEntry(4, "Updated entry again", []);
    });

    expect(result.current.fullEntries[0]?.photos).toEqual([]);
    const clearCall = upsertMock.mock.calls[upsertMock.mock.calls.length - 1];
    expect(clearCall?.[3]).toEqual([]);
    expect(deletePhotoMock).toHaveBeenCalledWith("photo-1.jpg", "user-a");
  });

  it("removes stored photos when an entry is deleted online", async () => {
    orderMock.mockResolvedValue({
      data: [{
        id: "entry-2",
        user_id: "user-a",
        week_index: 6,
        content: "Delete me",
        photos: ["photo-a.jpg", "photo-b.jpg"],
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      }],
      error: null,
    });

    const { result } = renderHook(() => useDiary("user-a"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveEntry(6, "");
    });

    expect(deleteExecMock).toHaveBeenCalled();
    expect(deletePhotoMock).toHaveBeenCalledTimes(2);
    expect(deletePhotoMock).toHaveBeenNthCalledWith(1, "photo-a.jpg", "user-a");
    expect(deletePhotoMock).toHaveBeenNthCalledWith(2, "photo-b.jpg", "user-a");
  });

  it("flushes only the latest queued operation for the same week", async () => {
    localStorage.setItem("liw-offline-diary-queue:user-a", JSON.stringify([
      {
        type: "upsert",
        weekIndex: 10,
        content: "older offline text",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
      {
        type: "delete",
        weekIndex: 10,
        updatedAt: "2026-04-01T00:05:00.000Z",
      },
      {
        type: "upsert",
        weekIndex: 11,
        content: "another week",
        updatedAt: "2026-04-01T00:10:00.000Z",
      },
    ]));

    renderHook(() => useDiary("user-a"));

    await waitFor(() => expect(deleteExecMock).toHaveBeenCalledWith("user-a", 10));
    expect(upsertMock).not.toHaveBeenCalledWith("user-a", 10, expect.any(String), expect.anything());
    expect(upsertMock).toHaveBeenCalledWith("user-a", 11, "another week", undefined);
    expect(localStorage.getItem("liw-offline-diary-queue:user-a")).toBe("[]");
  });
});
