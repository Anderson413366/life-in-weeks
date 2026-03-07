
// Import firebase for v8 style types, assuming it's globally available or via 'firebase/app'
// If using 'firebase/app' for types, ensure it's imported where FirebaseServices is defined.
// For this case, we'll assume firebase global or it's handled by the main App.tsx import.
// No direct import here to keep types.ts clean, but expect firebase types to be resolvable.
// If firebase types are not globally resolved, `App.tsx` local definition or direct import here would be needed.
// For now, this is a placeholder for the concept. The actual fix is making App.tsx self-contained for types.

export interface LifeStats {
  daysPassed: number;
  daysRemaining: number;
  totalLifeDays: number;
  weeksPassed: number;
  weeksRemaining: number;
  totalLifeWeeks: number;
  percentageLived: string;
  milestones: {
    quarter: string;
    halfway: string;
    threeQuarter: string;
  };
  currentWeekInYear: number;
  currentYearOfLife: number;
  currentDateFormatted: string;
  totalLifeSeconds: number;
}

export interface DynamicStats {
  secondsLived: number;
  minutesLived: number;
  hoursLived: number;
  secondsRemaining: number;
  minutesRemaining: number;
  hoursRemaining: number;
  percentDayPassed: number;
  percentMonthPassed: number;
  percentYearPassed: number;
  wakingHoursLived: number;
  wakingHoursRemaining: number;
}

export interface SelectedWeek {
  index: number;
  row: number;
  col: number;
  date: string;
}

export interface DiaryEntries {
  [weekIndex: string]: string; // weekIndex is a number, but object keys are strings
}

export interface HoverInfo {
  content: string;
  x: number;
  y: number;
  transform?: string; // Tailwind class string for transform
}

// Props for components that interact with Firebase
// This interface is now defined locally in App.tsx as it needs firebase v8 types.
// Keeping it here would require `types.ts` to also import `firebase/app`.
// To simplify, this global definition is effectively overridden by the local one in App.tsx.
// If this were to be the sole source of truth, it would need:
// import firebase from 'firebase/app';
// export interface FirebaseServices {
//   db: firebase.firestore.Firestore | null;
//   auth: firebase.auth.Auth | null;
//   userId: string | null;
//   appId: string;
//   isAuthReady: boolean;
// }
// For now, we assume App.tsx's local definition takes precedence.
// The original global definition in App.tsx has been modified.

// User data stored in Firestore
export interface UserSettings {
  birthdate?: string;
  totalYears?: string; // Stored as string in Firestore in user's example
}
