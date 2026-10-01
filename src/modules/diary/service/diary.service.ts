import type { DiaryEntry, DiaryMap } from "../types/diary.types";
import type { DiarySyncOperation } from "../types/dto";

export function coalesceDiaryOperations(queue: DiarySyncOperation[]): DiarySyncOperation[] {
  const latestByWeek = new Map<number, DiarySyncOperation>();

  for (const item of queue) {
    latestByWeek.set(item.weekIndex, item);
  }

  return Array.from(latestByWeek.values());
}

export function applyQueuedDiaryOperations(
  entries: DiaryMap,
  fullEntries: DiaryEntry[],
  queue: DiarySyncOperation[],
  userId?: string,
) {
  const nextEntries = { ...entries };
  let nextFullEntries = [...fullEntries];

  for (const item of coalesceDiaryOperations(queue)) {
    const key = item.weekIndex.toString();

    if (item.type === "delete") {
      delete nextEntries[key];
      nextFullEntries = nextFullEntries.filter((entry) => entry.week_index !== item.weekIndex);
      continue;
    }

    nextEntries[key] = item.content ?? "";

    const existing = nextFullEntries.find((entry) => entry.week_index === item.weekIndex);
    const optimisticEntry: DiaryEntry = {
      id: existing?.id ?? `offline-${item.weekIndex}`,
      user_id: existing?.user_id ?? userId ?? "",
      week_index: item.weekIndex,
      content: item.content ?? "",
      photos: item.photos ?? existing?.photos ?? [],
      created_at: existing?.created_at ?? item.updatedAt,
      updated_at: item.updatedAt,
    };

    nextFullEntries = [
      optimisticEntry,
      ...nextFullEntries.filter((entry) => entry.week_index !== item.weekIndex),
    ];
  }

  return { entries: nextEntries, fullEntries: nextFullEntries };
}
