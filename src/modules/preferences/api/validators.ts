import type { AppMode } from "../types/preferences.types";

export function isAppMode(value: string): value is AppMode {
  return value === "zen" || value === "focus";
}
