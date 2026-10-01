import type { MoodEntry } from "../types/mood.types";
import type { MoodSyncOperation } from "../types/dto";
import { THREE_HOURS_MS } from "../repository/queries";

export function isExpired(entry: MoodEntry): boolean {
  const createdAt = new Date(entry.created_at).getTime();
  return Date.now() - createdAt > THREE_HOURS_MS;
}

export function mergeMoodEntry(entries: MoodEntry[], nextEntry: MoodEntry) {
  return [
    nextEntry,
    ...entries.filter((entry) => !(entry.user_id === nextEntry.user_id && entry.date === nextEntry.date)),
  ];
}

export function coalesceMoodOperations(queue: MoodSyncOperation[]): MoodSyncOperation[] {
  const latestByDate = new Map<string, MoodSyncOperation>();

  for (const item of queue) {
    latestByDate.set(item.date, item);
  }

  return Array.from(latestByDate.values());
}

export function applyQueuedMoodOperations(entries: MoodEntry[], queue: MoodSyncOperation[], userId?: string) {
  let nextEntries = [...entries];

  for (const item of coalesceMoodOperations(queue)) {
    const optimisticEntry: MoodEntry = {
      id: `offline-${item.date}`,
      user_id: userId ?? "",
      date: item.date,
      mood: item.mood,
      energy: item.energy,
      note: item.note,
      created_at: item.created_at,
    };

    nextEntries = mergeMoodEntry(nextEntries, optimisticEntry);
  }

  return nextEntries;
}
