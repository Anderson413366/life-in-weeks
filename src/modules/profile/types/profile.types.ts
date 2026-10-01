export { DEFAULT_AVERAGES } from "@/types";
export type { DiaryEntry, MoodEntry, Profile, UserAverages } from "@/types";

export interface ProfileDetailsDraft {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  preferredName: string;
  phone: string;
}
