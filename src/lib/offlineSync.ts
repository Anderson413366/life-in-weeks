export interface DiarySyncOperation {
  type: "upsert" | "delete";
  weekIndex: number;
  content?: string;
  photos?: string[];
  updatedAt: string;
}

export interface MoodSyncOperation {
  type: "upsert";
  mood: string;
  energy: number;
  note: string | null;
  date: string;
  created_at: string;
}

function readQueue<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue<T>(key: string, queue: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(queue));
}

export function getOfflineQueue<T>(key: string): T[] {
  return readQueue<T>(key);
}

export function setOfflineQueue<T>(key: string, queue: T[]): void {
  writeQueue(key, queue);
}

/**
 * Remove successfully flushed items from the queue while preserving
 * any items that were appended concurrently during the flush window.
 */
export function removeProcessedItems<T>(key: string, processedCount: number, failedItems: T[]): void {
  const current = readQueue<T>(key);
  // Items appended during flush are at indices >= processedCount
  const appendedDuringFlush = current.slice(processedCount);
  writeQueue(key, [...failedItems, ...appendedDuringFlush]);
}

export function appendOfflineItem<T>(key: string, item: T): T[] {
  const queue = [...readQueue<T>(key), item];
  writeQueue(key, queue);
  return queue;
}
