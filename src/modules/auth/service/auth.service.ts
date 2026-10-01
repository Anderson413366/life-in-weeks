import type { AuthState } from "../types/auth.types";
import {
  exchangeCodeForSession,
  getSession,
  resetPassword,
  setSession,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  subscribeToAuthChanges,
  updatePassword,
  verifyRecoveryOtp,
} from "../repository/auth.repository";
import { AUTH_CALLBACK_QUERY_PARAMS } from "../repository/queries";

export function createInitialAuthState(): AuthState {
  return {
    user: null,
    session: null,
    loading: true,
    recoveryMode: false,
    error: null,
  };
}

export function clearAuthParams(): void {
  const url = new URL(window.location.href);
  let changed = false;

  AUTH_CALLBACK_QUERY_PARAMS.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  });

  if (changed) {
    const search = url.searchParams.toString();
    const nextUrl = `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  if (window.location.hash) {
    const nextUrl = `${url.pathname}${url.search}`;
    window.history.replaceState({}, document.title, nextUrl);
  }
}

export async function initializeAuthState(): Promise<AuthState> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const recoveryHint =
    url.searchParams.get("reset") === "1" || url.searchParams.get("type") === "recovery";

  try {
    if (code) {
      await exchangeCodeForSession(code);
    }

    if (tokenHash && url.searchParams.get("type") === "recovery") {
      await verifyRecoveryOtp(tokenHash);
    }

    if (accessToken && refreshToken) {
      await setSession(accessToken, refreshToken);
    }

    const {
      data: { session },
    } = await getSession();

    return {
      user: session?.user ?? null,
      session,
      loading: false,
      recoveryMode: recoveryHint,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      loading: false,
      recoveryMode: false,
      error: error instanceof Error ? error.message : "We could not finish sign-in. Try again.",
    };
  } finally {
    if (code || tokenHash || recoveryHint || accessToken || refreshToken) {
      clearAuthParams();
    }
  }
}

export {
  resetPassword,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  subscribeToAuthChanges,
  updatePassword,
};
