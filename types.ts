export interface Profile {
  id: string;
  birthdate: string | null;
  life_expectancy: number;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  week_index: number;
  content: string;
  created_at: string;
  updated_at: string;
}

/** Precomputed map: week_index → content (derived from DiaryEntry[]) */
export type DiaryMap = Record<string, string>;

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

export interface HoverInfo {
  content: string;
  x: number;
  y: number;
  transform?: string;
}
