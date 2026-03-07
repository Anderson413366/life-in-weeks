
export const QUOTES: string[] = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You are never too old to set another goal or to dream a new dream.",
  "The only limit to our realization of tomorrow is our doubts of today.",
  "Your time is limited, don't waste it living someone else's life.",
  "Act as if what you do makes a difference. It does.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Do not watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there."
];

export const DEFAULT_LIFE_EXPECTANCY = 80;
export const MIN_LIFE_EXPECTANCY = 1;
export const MAX_LIFE_EXPECTANCY = 120;

export const WEEKS_IN_YEAR = 52;
export const DAYS_IN_YEAR_AVG = 365.25; // For calculations
export const HOURS_IN_DAY = 24;
export const MINUTES_IN_HOUR = 60;
export const SECONDS_IN_MINUTE = 60;
export const WAKING_TIME_FACTOR = 2/3; // Assuming 16 waking hours a day

// Tailwind color mapping (for reference, use arbitrary values directly or theme('colors.primary'))
// These are illustrative and components should prefer using Tailwind's theme capabilities.
export const TW_COLORS = {
  primary: '#00d4ff',
  primaryDark: '#0097b5',
  accent: '#ff6b6b',
  bgDark: '#0a0a23',
  bgLight: '#1f1f3a',
  textMain: '#ffffff',
  textMuted: '#b4b4c7',
  boxBorder: '#3a3a5e',
  cardBg: 'rgba(25, 25, 55, 0.75)', 
  decadeMarker: '#ffd700',
  geminiButtonBg: '#8e44ad',
  geminiButtonHoverBg: '#732d91',
};