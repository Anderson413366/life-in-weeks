import { useState, useEffect, useCallback } from "react";
import { clearApiKey } from "@/modules/ai/service/ai.service";

import {
  createInitialAuthState,
  initializeAuthState,
  resetPassword as resetPasswordRequest,
  signIn as signInRequest,
  signInWithGoogle as signInWithGoogleRequest,
  signOut as signOutRequest,
  signUp as signUpRequest,
  subscribeToAuthChanges,
  updatePassword as updatePasswordRequest,
} from "../../service/auth.service";
import type { AuthState } from "../../types/auth.types";

export function useAuth() {
  const [state, setState] = useState<AuthState>(createInitialAuthState);

  useEffect(() => {
    let active = true;
    void initializeAuthState().then((nextState) => {
      if (active) {
        setState(nextState);
      }
    });

    const {
      data: { subscription },
    } = subscribeToAuthChanges((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        clearApiKey();
      }

      setState((prev) => ({
        user: session?.user ?? null,
        session,
        loading: false,
        recoveryMode:
          event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : prev.recoveryMode,
        error: null,
      }));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, error: null }));
    const { error } = await signUpRequest(email, password);
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, error: null }));
    const { error } = await signInRequest(email, password);
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    const { error } = await signInWithGoogleRequest();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, error: null }));
    const { error } = await resetPasswordRequest(email);
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setState((prev) => ({ ...prev, error: null }));
    const { error } = await updatePasswordRequest(password);
    if (error) throw error;
  }, []);

  const exitRecoveryMode = useCallback(() => {
    setState((prev) => ({ ...prev, recoveryMode: false }));
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await signOutRequest();
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
