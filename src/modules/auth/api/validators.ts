export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hasAuthCredentials(email: string, password: string): boolean {
  return normalizeEmail(email).length > 0 && password.trim().length > 0;
}
