import type { UserAverages } from "./profile.types";

export interface ProfileRecordUpdate {
  birthdate?: string | null;
  life_expectancy?: number;
  display_name?: string | null;
  preferred_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  gemini_api_key?: string | null;
}

export type ProfileAveragesUpdate = UserAverages;
