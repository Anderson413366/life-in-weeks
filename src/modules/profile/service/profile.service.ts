import { DEFAULT_AVERAGES, type Profile, type ProfileDetailsDraft, type UserAverages } from "../types/profile.types";
import type { ProfileRecordUpdate } from "../types/dto";
import { bootstrapProfile, fetchProfile, saveProfile, storeAvatar } from "../repository/profile.repository";

export interface ProfileViewState {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  preferredName: string;
  phone: string;
  avatarUrl: string;
  averages: UserAverages;
}

export function createEmptyProfileState(defaultLifeExpectancy: number): ProfileViewState {
  return {
    birthdate: "",
    lifeExpectancy: defaultLifeExpectancy,
    displayName: "",
    preferredName: "",
    phone: "",
    avatarUrl: "",
    averages: { ...DEFAULT_AVERAGES },
  };
}

export function hydrateProfileState(profile: Profile, defaultLifeExpectancy: number): ProfileViewState {
  return {
    birthdate: profile.birthdate ?? "",
    lifeExpectancy: profile.life_expectancy ?? defaultLifeExpectancy,
    displayName: profile.display_name ?? "",
    preferredName: profile.preferred_name ?? "",
    phone: profile.phone ?? "",
    avatarUrl: profile.avatar_url ?? "",
    averages: {
      avg_heartbeats_per_min: profile.avg_heartbeats_per_min ?? DEFAULT_AVERAGES.avg_heartbeats_per_min,
      avg_breaths_per_min: profile.avg_breaths_per_min ?? DEFAULT_AVERAGES.avg_breaths_per_min,
      avg_blinks_per_min: profile.avg_blinks_per_min ?? DEFAULT_AVERAGES.avg_blinks_per_min,
      meals_per_day: profile.meals_per_day ?? DEFAULT_AVERAGES.meals_per_day,
      avg_steps_per_day: profile.avg_steps_per_day ?? DEFAULT_AVERAGES.avg_steps_per_day,
      avg_sleep_hours: profile.avg_sleep_hours ?? DEFAULT_AVERAGES.avg_sleep_hours,
      avg_screen_hours: profile.avg_screen_hours ?? DEFAULT_AVERAGES.avg_screen_hours,
      avg_words_per_day: profile.avg_words_per_day ?? DEFAULT_AVERAGES.avg_words_per_day,
      avg_laughs_per_day: profile.avg_laughs_per_day ?? DEFAULT_AVERAGES.avg_laughs_per_day,
    },
  };
}

export function buildProfileDetailsUpdate(draft: ProfileDetailsDraft): ProfileRecordUpdate {
  return {
    birthdate: draft.birthdate || null,
    life_expectancy: draft.lifeExpectancy,
    display_name: draft.displayName || null,
    preferred_name: draft.preferredName || null,
    phone: draft.phone || null,
  };
}

export { bootstrapProfile, fetchProfile, saveProfile, storeAvatar };
