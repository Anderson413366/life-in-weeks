import { supabase } from "@/shared/integrations/supabase";

export function exchangeCodeForSession(code: string) {
  return supabase.auth.exchangeCodeForSession(code);
}

export function verifyRecoveryOtp(tokenHash: string) {
  return supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
}

export function setSession(accessToken: string, refreshToken: string) {
  return supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

export function getSession() {
  return supabase.auth.getSession();
}

export function subscribeToAuthChanges(
  callback: (event: Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>[0], session: Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>[1]) => void,
) {
  return supabase.auth.onAuthStateChange(callback as Parameters<typeof supabase.auth.onAuthStateChange>[0]);
}

export function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
}

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
}

export function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}?reset=1`,
  });
}

export function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export function signOut() {
  return supabase.auth.signOut();
}
