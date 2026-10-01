import { formatLocalDate } from "@/shared/lib";

import type { DiaryEntry, MoodEntry, UserAverages } from "../types/profile.types";

export interface ExportProfileSnapshot {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  preferredName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  averages: UserAverages;
}

export interface ExportPayload {
  exportedAt: string;
  app: string;
  version: number;
  profile: ExportProfileSnapshot;
  diaryEntries: DiaryEntry[];
  moods: MoodEntry[];
}

export function downloadLifeData(payload: ExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = formatLocalDate();

  anchor.href = url;
  anchor.download = `life-in-weeks-export-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
