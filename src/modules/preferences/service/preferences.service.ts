import { readStoredMode, syncBodyMode, writeStoredMode } from "../repository/preferences.repository";
import type { AppMode } from "../types/preferences.types";

export function getMode(): AppMode {
  return readStoredMode() ?? "zen";
}

export function setMode(mode: AppMode): void {
  writeStoredMode(mode);
}

export function applyModeToBody(mode: AppMode): void {
  syncBodyMode(mode);
}

/**
 * Zen Mode: cosmic gradients, soft glows, breathing animations
 * Focus Mode: high-contrast black/white, zero animations, binary clarity
 */
export const THEME = {
  zen: {
    bg: "bg-gradient-to-br from-bg-dark to-bg-light",
    card: "glass",
    text: "text-white",
    muted: "text-text-muted",
    accent: "text-primary",
    animate: true,
    ring: true,
    particles: true,
  },
  focus: {
    bg: "bg-black",
    card: "bg-[#111] border border-[#333]",
    text: "text-white",
    muted: "text-[#888]",
    accent: "text-white",
    animate: false,
    ring: false,
    particles: false,
  },
} as const;
