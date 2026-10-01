import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AI_STORAGE_KEY } from "@/modules/ai/repository/queries";
import { useAuth } from "./useAuth";

const {
  exchangeCodeForSessionMock,
  verifyOtpMock,
  setSessionMock,
  getSessionMock,
  onAuthStateChangeMock,
  signUpMock,
  signInWithPasswordMock,
  signInWithOAuthMock,
  resetPasswordForEmailMock,
  updateUserMock,
  signOutMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  exchangeCodeForSessionMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  setSessionMock: vi.fn(),
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signUpMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signInWithOAuthMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
  updateUserMock: vi.fn(),
  signOutMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

let authListener: ((event: string, session: unknown) => void) | undefined;

vi.mock("@/modules/auth/repository/auth.repository", () => ({
  exchangeCodeForSession: exchangeCodeForSessionMock,
  verifyRecoveryOtp: verifyOtpMock,
  setSession: setSessionMock,
  getSession: getSessionMock,
  subscribeToAuthChanges: onAuthStateChangeMock,
  signUp: signUpMock,
  signIn: signInWithPasswordMock,
  signInWithGoogle: signInWithOAuthMock,
  resetPassword: resetPasswordForEmailMock,
  updatePassword: updateUserMock,
  signOut: signOutMock,
}));

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    authListener = undefined;

    exchangeCodeForSessionMock.mockReset();
    verifyOtpMock.mockReset();
    setSessionMock.mockReset();
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockReset();
    signUpMock.mockReset();
    signInWithPasswordMock.mockReset();
    signInWithOAuthMock.mockReset();
    resetPasswordForEmailMock.mockReset();
    updateUserMock.mockReset();
    signOutMock.mockReset();
    unsubscribeMock.mockReset();

    getSessionMock.mockResolvedValue({ data: { session: null } });
    onAuthStateChangeMock.mockImplementation((callback: (event: string, session: unknown) => void) => {
      authListener = callback;
      return { data: { subscription: { unsubscribe: unsubscribeMock } } };
    });

    window.history.replaceState({}, "", "/");
  });

  it("exits loading and surfaces a recoverable error when auth callback bootstrap fails", async () => {
    exchangeCodeForSessionMock.mockRejectedValue(new Error("Bad auth callback"));
    window.history.replaceState({}, "", "/?code=broken");

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe("Bad auth callback");
    expect(window.location.search).toBe("");
  });

  it("clears the mirrored Gemini key when Supabase reports sign-out", async () => {
    localStorage.setItem(AI_STORAGE_KEY, "secret-key");

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      authListener?.("SIGNED_OUT", null);
    });

    expect(result.current.recoveryMode).toBe(false);
    expect(localStorage.getItem(AI_STORAGE_KEY)).toBeNull();
  });
});
