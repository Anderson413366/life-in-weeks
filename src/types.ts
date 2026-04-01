export interface Database {
  public: {
    Tables: {
      liw_profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id'> & { id?: string };
        Update: Partial<Profile>;
      };
      liw_diary_entries: {
        Row: DiaryEntry;
        Insert: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<DiaryEntry>;
      };
      liw_mood_entries: {
        Row: MoodEntry;
        Insert: Omit<MoodEntry, 'id' | 'created_at'> & { id?: string };
        Update: Partial<MoodEntry>;
      };
      liw_feedback: {
        Row: Feedback;
        Insert: Omit<Feedback, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Feedback>;
      };
    };
  };
}

export interface Profile {
  id: string;
  birthdate: string | null;
  life_expectancy: number;
  display_name: string | null;
  preferred_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  gemini_api_key: string | null;
  // Customizable averages
  avg_heartbeats_per_min: number;
  avg_breaths_per_min: number;
  avg_blinks_per_min: number;
  meals_per_day: number;
  avg_steps_per_day: number;
  avg_sleep_hours: number;
  avg_screen_hours: number;
  avg_words_per_day: number;
  avg_laughs_per_day: number;
}

export const DEFAULT_AVERAGES: Omit<Profile, "id" | "birthdate" | "life_expectancy" | "display_name" | "preferred_name" | "phone" | "gemini_api_key" | "avatar_url"> = {
  avg_heartbeats_per_min: 72,
  avg_breaths_per_min: 15,
  avg_blinks_per_min: 17,
  meals_per_day: 3,
  avg_steps_per_day: 7500,
  avg_sleep_hours: 8,
  avg_screen_hours: 7,
  avg_words_per_day: 16000,
  avg_laughs_per_day: 15,
};

export interface DiaryEntry {
  id: string;
  user_id: string;
  week_index: number;
  content: string;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  date: string;
  mood: string;
  energy: number;
  note: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  stars: number;
  message: string | null;
  created_at: string;
}

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

export type UserAverages = typeof DEFAULT_AVERAGES;
