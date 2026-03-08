export type AppMode = "zen" | "focus";

const STORAGE_KEY = "liw-mode";

export function getMode(): AppMode {
  return (localStorage.getItem(STORAGE_KEY) as AppMode) ?? "zen";
}

export function setMode(mode: AppMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
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
