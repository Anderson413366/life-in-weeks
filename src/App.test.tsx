import { render, screen, waitFor } from "@testing-library/react";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import App from "./App";
import { useAuth } from "@/modules/auth/ui/hooks/useAuth";
import { useDiary } from "@/modules/diary/ui/hooks/useDiary";
import { useLifeStats } from "@/modules/life/ui/hooks/useLifeStats";
import { useMood } from "@/modules/mood/ui/hooks/useMood";
import { useAppMode } from "@/modules/preferences/ui/hooks/useAppMode";
import { useProfile } from "@/modules/profile/ui/hooks/useProfile";

vi.mock("@/modules/auth/ui/hooks/useAuth", async () => {
  const actual = await vi.importActual<typeof import("@/modules/auth/ui/hooks/useAuth")>("@/modules/auth/ui/hooks/useAuth");
  return { ...actual, useAuth: vi.fn() };
});
vi.mock("@/modules/profile/ui/hooks/useProfile", async () => {
  const actual = await vi.importActual<typeof import("@/modules/profile/ui/hooks/useProfile")>("@/modules/profile/ui/hooks/useProfile");
  return { ...actual, useProfile: vi.fn() };
});
vi.mock("@/modules/diary/ui/hooks/useDiary", async () => {
  const actual = await vi.importActual<typeof import("@/modules/diary/ui/hooks/useDiary")>("@/modules/diary/ui/hooks/useDiary");
  return { ...actual, useDiary: vi.fn() };
});
vi.mock("@/modules/life/ui/hooks/useLifeStats", async () => {
  const actual = await vi.importActual<typeof import("@/modules/life/ui/hooks/useLifeStats")>("@/modules/life/ui/hooks/useLifeStats");
  return { ...actual, useLifeStats: vi.fn() };
});
vi.mock("@/modules/mood/ui/hooks/useMood", async () => {
  const actual = await vi.importActual<typeof import("@/modules/mood/ui/hooks/useMood")>("@/modules/mood/ui/hooks/useMood");
  return { ...actual, useMood: vi.fn() };
});
vi.mock("@/modules/preferences/ui/hooks/useAppMode", async () => {
  const actual = await vi.importActual<typeof import("@/modules/preferences/ui/hooks/useAppMode")>("@/modules/preferences/ui/hooks/useAppMode");
  return { ...actual, useAppMode: vi.fn() };
});
vi.mock("@/modules/ai/service/ai.service", async () => {
  const actual = await vi.importActual<typeof import("@/modules/ai/service/ai.service")>("@/modules/ai/service/ai.service");
  return { ...actual, getApiKey: vi.fn(() => "") };
});

const useAuthMock = vi.mocked(useAuth);
const useProfileMock = vi.mocked(useProfile);
const useDiaryMock = vi.mocked(useDiary);
const useLifeStatsMock = vi.mocked(useLifeStats);
const useMoodMock = vi.mocked(useMood);
const useAppModeMock = vi.mocked(useAppMode);

const authFns = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  exitRecoveryMode: vi.fn(),
  signOut: vi.fn(),
};

describe("App routing", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      recoveryMode: false,
      error: null,
      ...authFns,
    });
    useProfileMock.mockReturnValue({
      birthdate: "",
      lifeExpectancy: 80,
      displayName: "",
      preferredName: "",
      phone: "",
      avatarUrl: "",
      averages: {
        avg_heartbeats_per_min: 72,
        avg_breaths_per_min: 15,
        avg_blinks_per_min: 17,
        meals_per_day: 3,
        avg_steps_per_day: 7500,
        avg_sleep_hours: 8,
        avg_screen_hours: 7,
        avg_words_per_day: 16000,
        avg_laughs_per_day: 15,
      },
      loading: false,
      greeting: "",
      email: "",
      saveProfileDetails: vi.fn(),
      saveAverages: vi.fn(),
      updateBirthdate: vi.fn(),
      updateLifeExpectancy: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePreferredName: vi.fn(),
      updatePhone: vi.fn(),
      updateAvatar: vi.fn(),
      updateApiKey: vi.fn(),
      updateAverages: vi.fn(),
    });
    useDiaryMock.mockReturnValue({
      entries: {},
      fullEntries: [],
      loading: false,
      saveEntry: vi.fn(),
    });
    useLifeStatsMock.mockReturnValue({
      lifeStats: null,
      dynamicStats: {
        secondsLived: 0,
        minutesLived: 0,
        hoursLived: 0,
        secondsRemaining: 0,
        minutesRemaining: 0,
        hoursRemaining: 0,
        percentDayPassed: 0,
        percentMonthPassed: 0,
        percentYearPassed: 0,
        wakingHoursLived: 0,
        wakingHoursRemaining: 0,
      },
    });
    useMoodMock.mockReturnValue({
      todayMood: null,
      recentMoods: [],
      loading: false,
      saveMood: vi.fn(),
    });
    useAppModeMock.mockReturnValue({
      mode: "zen",
      setMode: vi.fn(),
      toggle: vi.fn(),
    });
  });

  it("keeps legal pages public even when signed out", () => {
    render(
      <MemoryRouter initialEntries={["/terms"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Terms of Service" })).toBeInTheDocument();
  });

  it("keeps legal pages public while auth is still bootstrapping", () => {
    useAuthMock.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      recoveryMode: false,
      error: null,
      ...authFns,
    });

    render(
      <MemoryRouter initialEntries={["/privacy"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
  });

  it("sends signed-out users on protected routes through AuthGate", async () => {
    render(
      <MemoryRouter initialEntries={["/grid"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Life in Weeks" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });
});
