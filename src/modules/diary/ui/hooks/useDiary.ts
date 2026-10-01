import { useState, useEffect, useCallback } from 'react';
import { deletePhoto, appendOfflineItem, getOfflineQueue, getScopedOfflineQueueKey, quarantineLegacyQueue, removeProcessedItems, setOfflineQueue } from '@/shared/lib';

import { deleteDiaryEntry, fetchDiaryEntries, upsertDiaryEntry } from "../../repository/diary.repository";
import { DIARY_QUEUE_KEY } from "../../repository/queries";
import { applyQueuedDiaryOperations, coalesceDiaryOperations } from "../../service/diary.service";
import type { DiaryEntry, DiaryMap } from "../../types/diary.types";
import {
  type DiarySyncOperation,
} from '../../types/dto';

export type { DiaryEntry };

export function useDiary(userId: string | undefined) {
  const [entries, setEntries] = useState<DiaryMap>({});
  const [fullEntries, setFullEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const queueKey = userId ? getScopedOfflineQueueKey(DIARY_QUEUE_KEY, userId) : null;

  useEffect(() => {
    if (!userId) return;
    quarantineLegacyQueue<DiarySyncOperation>(DIARY_QUEUE_KEY);
  }, [userId]);

  useEffect(() => {
    if (!userId) { 
      setLoading(false); 
      setEntries({});
      setFullEntries([]);
      return; 
    }

    setLoading(true);
    setEntries({});
    setFullEntries([]);
    let cancelled = false;

    async function load() {
      const { data, error } = await fetchDiaryEntries(userId as string);

      if (cancelled) return;
      if (error) {
        const queue = getOfflineQueue<DiarySyncOperation>(queueKey!);
        const merged = applyQueuedDiaryOperations({}, [], queue, userId);
        setEntries(merged.entries);
        setFullEntries(merged.fullEntries);
        setLoading(false);
        return;
      }

      const map: DiaryMap = {};
      const full: DiaryEntry[] = [];
      for (const row of (data as any) || []) {
        map[row.week_index.toString()] = row.content;
        full.push(row);
      }

      const queue = getOfflineQueue<DiarySyncOperation>(queueKey!);
      const merged = applyQueuedDiaryOperations(map, full, queue, userId);

      setEntries(merged.entries);
      setFullEntries(merged.fullEntries);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId, queueKey]);

  useEffect(() => {
    if (!userId || !queueKey) return;

    const syncingRef = { current: false };

    const flushQueue = async () => {
      if (syncingRef.current || !navigator.onLine) return;

      const rawQueue = getOfflineQueue<DiarySyncOperation>(queueKey);
      const queue = coalesceDiaryOperations(rawQueue);
      if (queue.length !== rawQueue.length) setOfflineQueue(queueKey, queue);
      if (queue.length === 0) return;

      syncingRef.current = true;
      const queueLength = queue.length;
      const failed: DiarySyncOperation[] = [];

      for (const item of queue) {
        try {
          if (item.type === 'delete') {
            const { error } = await deleteDiaryEntry(userId as string, item.weekIndex);

            if (error) throw error;
          } else {
            const { error } = await upsertDiaryEntry(
              userId,
              item.weekIndex,
              item.content ?? '',
              item.photos,
            );

            if (error) throw error;
          }
        } catch {
          failed.push(item);
        }
      }

      removeProcessedItems(queueKey, queueLength, failed);
      syncingRef.current = false;
    };

    void flushQueue();
    window.addEventListener('online', flushQueue);

    return () => {
      window.removeEventListener('online', flushQueue);
    };
  }, [userId, queueKey]);

  const saveEntry = useCallback(
    async (weekIndex: number, content: string, photos?: string[]) => {
      if (!userId || !queueKey) return;
      const trimmed = content.trim();
      const key = weekIndex.toString();
      const updatedAt = new Date().toISOString();
      const existing = fullEntries.find((e) => e.week_index === weekIndex);

      const prevEntries = { ...entries };
      const prevFull = [...fullEntries];

      if (trimmed === '') {
        setEntries((prev) => { const next = { ...prev }; delete next[key]; return next; });
        setFullEntries((prev) => prev.filter((e) => e.week_index !== weekIndex));

        if (!navigator.onLine) {
          appendOfflineItem<DiarySyncOperation>(queueKey, {
            type: 'delete',
            weekIndex,
            updatedAt,
          });
          return;
        }

        const { error } = await deleteDiaryEntry(userId as string, weekIndex);
        if (error) {
          appendOfflineItem<DiarySyncOperation>(queueKey, {
            type: 'delete',
            weekIndex,
            updatedAt,
          });
          setEntries(prevEntries);
          setFullEntries(prevFull);

          const merged = applyQueuedDiaryOperations(prevEntries, prevFull, getOfflineQueue<DiarySyncOperation>(queueKey), userId);
          setEntries(merged.entries);
          setFullEntries(merged.fullEntries);
        } else if (existing?.photos?.length) {
          await Promise.allSettled(existing.photos.map((url) => deletePhoto(url, userId)));
        }
      } else {
        const nextPhotos = photos ?? existing?.photos ?? [];
        const optimisticEntry: DiaryEntry = {
          id: existing?.id || 'temp-' + Date.now(),
          user_id: userId,
          week_index: weekIndex,
          content: trimmed,
          photos: nextPhotos,
          created_at: existing?.created_at || updatedAt,
          updated_at: updatedAt,
        };

        setEntries((prev) => ({ ...prev, [key]: trimmed }));
        setFullEntries((prev) => [optimisticEntry, ...prev.filter((e) => e.week_index !== weekIndex)]);

        if (!navigator.onLine) {
          appendOfflineItem<DiarySyncOperation>(queueKey, {
            type: 'upsert',
            weekIndex,
            content: trimmed,
            ...(photos !== undefined ? { photos } : {}),
            updatedAt,
          });
          return;
        }

        const { error } = await upsertDiaryEntry(userId, weekIndex, trimmed, photos);
        
        if (error) {
          appendOfflineItem<DiarySyncOperation>(queueKey, {
            type: 'upsert',
            weekIndex,
            content: trimmed,
            ...(photos !== undefined ? { photos } : {}),
            updatedAt,
          });
          setEntries(prevEntries);
          setFullEntries(prevFull);

          const merged = applyQueuedDiaryOperations(prevEntries, prevFull, getOfflineQueue<DiarySyncOperation>(queueKey), userId);
          setEntries(merged.entries);
          setFullEntries(merged.fullEntries);
        } else if (photos !== undefined && existing?.photos?.length) {
          const removedPhotos = existing.photos.filter((url) => !nextPhotos.includes(url));
          if (removedPhotos.length) {
            await Promise.allSettled(removedPhotos.map((url) => deletePhoto(url, userId)));
          }
        }
      }
    },
    [userId, queueKey, entries, fullEntries],
  );

  return { entries, fullEntries, loading, saveEntry };
}
