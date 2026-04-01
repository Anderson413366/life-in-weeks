import { useState, useEffect, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AI_STORAGE_KEY } from "../constants";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  recoveryMode: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    recoveryMode: false,
  });

  useEffect(() => {
    let active = true;

    const clearAuthParams = () => {
      const url = new URL(window.location.href);
      let changed = false;

      ["code", "token_hash", "type", "reset"].forEach((param) => {
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
    };

    const initializeAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const recoveryHint =
        url.searchParams.get("reset") === "1" || url.searchParams.get("type") === "recovery";

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      if (tokenHash && url.searchParams.get("type") === "recovery") {
        await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        recoveryMode: recoveryHint,
      });

      if (code || tokenHash || recoveryHint || accessToken || refreshToken) {
        clearAuthParams();
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        localStorage.removeItem(AI_STORAGE_KEY);
      }

      setState((prev) => ({
        user: session?.user ?? null,
        session,
        loading: false,
        recoveryMode:
          event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : prev.recoveryMode,
      }));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?reset=1`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const exitRecoveryMode = useCallback(() => {
    setState((prev) => ({ ...prev, recoveryMode: false }));
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    exitRecoveryMode,
    signOut,
  };
}
