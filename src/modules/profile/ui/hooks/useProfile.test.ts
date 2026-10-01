import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AI_STORAGE_KEY } from "@/modules/ai/repository/queries";
import { useProfile } from "./useProfile";

const maybeSingleMock = vi.fn();
const upsertMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/modules/profile/repository/profile.repository", async () => {
  const actual = await vi.importActual<typeof import("@/modules/profile/repository/profile.repository")>("@/modules/profile/repository/profile.repository");
  return {
    ...actual,
    fetchProfile: vi.fn(() => maybeSingleMock()),
    saveProfile: vi.fn((_userId: string, _fields: unknown) => upsertMock()),
    bootstrapProfile: vi.fn(() => insertMock()),
    storeAvatar: vi.fn(),
  };
});

function buildProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-a",
    birthdate: "1990-01-01",
    life_expectancy: 80,
    display_name: "Alice Example",
    preferred_name: "Alice",
    phone: "555-0000",
    avatar_url: "https://example.com/avatar.jpg",
    gemini_api_key: "alpha-key",
    avg_heartbeats_per_min: 72,
    avg_breaths_per_min: 15,
    avg_blinks_per_min: 17,
    meals_per_day: 3,
    avg_steps_per_day: 7500,
    avg_sleep_hours: 8,
    avg_screen_hours: 7,
    avg_words_per_day: 16000,
    avg_laughs_per_day: 15,
    ...overrides,
  };
}

describe("useProfile", () => {
  beforeEach(() => {
    localStorage.clear();
    maybeSingleMock.mockReset();
    upsertMock.mockReset();
    insertMock.mockReset();
    upsertMock.mockResolvedValue({ error: null });
    insertMock.mockResolvedValue({ error: null });
  });

  it("clears stale state on sign-out and re-enters loading for a new user", async () => {
    let resolveNextProfile: ((value: { data: ReturnType<typeof buildProfile>; error: null }) => void) | undefined;

    maybeSingleMock
      .mockResolvedValueOnce({ data: buildProfile(), error: null })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNextProfile = resolve;
          }),
      );

    const { result, rerender } = renderHook(
      ({ userId, email }: { userId: string | undefined; email: string | undefined }) => useProfile(userId, email),
      { initialProps: { userId: "user-a" as string | undefined, email: "a@example.com" as string | undefined } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.displayName).toBe("Alice Example");
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe("alpha-key");

    rerender({ userId: undefined, email: undefined });
    expect(result.current.loading).toBe(false);
    expect(result.current.displayName).toBe("");
    expect(result.current.birthdate).toBe("");
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBeNull();

    rerender({ userId: "user-b", email: "b@example.com" });
    expect(result.current.loading).toBe(true);
    expect(result.current.displayName).toBe("");
    expect(result.current.birthdate).toBe("");

    if (resolveNextProfile) {
      resolveNextProfile({ data: buildProfile({ id: "user-b", display_name: "Bob Example", gemini_api_key: null }), error: null });
    }

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.displayName).toBe("Bob Example");
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBeNull();
  });

  it("restores birthdate and Gemini key state when saves fail", async () => {
    maybeSingleMock.mockResolvedValue({ data: buildProfile(), error: null });
    upsertMock.mockResolvedValue({ error: new Error("save failed") });

    const { result } = renderHook(() => useProfile("user-a", "a@example.com"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe("alpha-key");

    await act(async () => {
      await result.current.updateBirthdate("2000-02-02");
    });

    expect(result.current.birthdate).toBe("1990-01-01");

    await act(async () => {
      await result.current.updateApiKey("beta-key");
    });

    expect(localStorage.getItem(AI_STORAGE_KEY)).toBe("alpha-key");
  });
});
