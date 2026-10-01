import type { AppMode } from "../types/preferences.types";

const MODE_KEY = "liw-mode";

export function readStoredMode(): AppMode | null {
  const value = localStorage.getItem(MODE_KEY);
  return value === "focus" || value === "zen" ? value : null;
}

export function writeStoredMode(mode: AppMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function syncBodyMode(mode: AppMode): void {
  document.body.classList.toggle("focus-mode", mode === "focus");
}
