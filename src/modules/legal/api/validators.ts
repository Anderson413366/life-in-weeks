import type { LegalPageKey } from "../types/legal.types";

export function isLegalPageKey(value: string): value is LegalPageKey {
  return value === "terms" || value === "privacy";
}
