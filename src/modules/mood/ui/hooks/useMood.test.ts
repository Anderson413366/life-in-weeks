import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatLocalDate } from "@/shared/lib";
import { useMood } from "./useMood";

const { orderMock, upsertMock } = vi.hoisted(() => ({
  orderMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("@/modules/mood/repository/mood.repository", () => ({
  fetchMoodEntries: orderMock,
  upsertMoodEntry: upsertMock,
}));

function setOnlineState(isOnline: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: isOnline,
  });
}

describe("useMood", () => {
  beforeEach(() => {
    localStorage.clear();
    orderMock.mockReset();
    upsertMock.mockReset();
    orderMock.mockResolvedValue({ data: [], error: null });
    upsertMock.mockResolvedValue({ data: null, error: null });
    setOnlineState(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps mood queues scoped to the active user and quarantines legacy entries", async () => {
    localStorage.setItem("liw-offline-mood-queue:user-a", JSON.stringify([{
      type: "upsert",
      mood: "calm",
      energy: 4,
      note: null,
      date: "2026-04-01",
      created_at: "2026-04-01T00:00:00.000Z",
    }]));
    localStorage.setItem("liw-offline-mood-queue", JSON.stringify([{
      type: "upsert",
      mood: "legacy",
      energy: 2,
      note: null,
      date: "2026-03-31",
      created_at: "2026-03-31T00:00:00.000Z",
    }]));

    const { result } = renderHook(() => useMood("user-b"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.recentMoods).toEqual([]);
    expect(upsertMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("liw-offline-mood-queue")).toBeNull();
    expect(localStorage.getItem("liw-offline-mood-queue:legacy")).not.toBeNull();

    upsertMock.mockClear();

    renderHook(() => useMood("user-a"));

    await waitFor(() =>
      expect(upsertMock).toHaveBeenCalledWith("user-a", "2026-04-01", "calm", 4, null, "2026-04-01T00:00:00.000Z"),
    );
  });

  it("replaces an existing mood entry during optimistic saves instead of duplicating the current day", async () => {
    const today = formatLocalDate();

    orderMock.mockResolvedValueOnce({
      data: [{
        id: "existing-entry",
        user_id: "user-a",
        date: today,
        mood: "🙂",
        energy: 4,
        note: null,
        created_at: "2026-04-01T00:00:00.000Z",
      }],
      error: null,
    });
    upsertMock.mockResolvedValueOnce({
      data: {
        id: "saved-entry",
        user_id: "user-a",
        date: today,
        mood: "😄",
        energy: 5,
        note: null,
        created_at: "2026-04-01T12:00:00.000Z",
      },
      error: null,
    });

    const { result } = renderHook(() => useMood("user-a"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveMood("😄", 5);
    });

    expect(result.current.recentMoods).toHaveLength(1);
    expect(result.current.recentMoods[0]).toMatchObject({
      id: "saved-entry",
      date: today,
      mood: "😄",
      energy: 5,
    });
    expect(result.current.todayMood?.date).toBe(today);
  });

  it("flushes only the latest queued mood for the same date", async () => {
    localStorage.setItem("liw-offline-mood-queue:user-a", JSON.stringify([
      {
        type: "upsert",
        mood: "sad",
        energy: 1,
        note: "older",
        date: "2026-04-01",
        created_at: "2026-04-01T08:00:00.000Z",
      },
      {
        type: "upsert",
        mood: "calm",
        energy: 4,
        note: "newer",
        date: "2026-04-01",
        created_at: "2026-04-01T09:00:00.000Z",
      },
    ]));

    renderHook(() => useMood("user-a"));

    await waitFor(() =>
      expect(upsertMock).toHaveBeenCalledWith("user-a", "2026-04-01", "calm", 4, "newer", "2026-04-01T09:00:00.000Z"),
    );
    expect(upsertMock).not.toHaveBeenCalledWith("user-a", "2026-04-01", "sad", 1, "older", "2026-04-01T08:00:00.000Z");
    expect(localStorage.getItem("liw-offline-mood-queue:user-a")).toBe("[]");
  });
});
