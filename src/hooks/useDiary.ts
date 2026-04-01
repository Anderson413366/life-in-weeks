import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DiaryMap, DiaryEntry } from '../types';
import {
  appendOfflineItem,
  getOfflineQueue,
  removeProcessedItems,
  type DiarySyncOperation,
} from '../lib/offlineSync';

export type { DiaryEntry };

const DIARY_QUEUE_KEY = 'liw-offline-diary-queue';

function applyQueuedDiaryOperations(
  entries: DiaryMap,
  fullEntries: DiaryEntry[],
  queue: DiarySyncOperation[],
  userId?: string,
) {
  const nextEntries = { ...entries };
  let nextFullEntries = [...fullEntries];

  for (const item of queue) {
    const key = item.weekIndex.toString();

    if (item.type === 'delete') {
      delete nextEntries[key];
      nextFullEntries = nextFullEntries.filter((entry) => entry.week_index !== item.weekIndex);
      continue;
    }

    nextEntries[key] = item.content ?? '';

    const existing = nextFullEntries.find((entry) => entry.week_index === item.weekIndex);
    const optimisticEntry: DiaryEntry = {
      id: existing?.id ?? `offline-${item.weekIndex}`,
      user_id: existing?.user_id ?? userId ?? '',
      week_index: item.weekIndex,
      content: item.content ?? '',
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

export function useDiary(userId: string | undefined) {
  const [entries, setEntries] = useState<DiaryMap>({});
  const [fullEntries, setFullEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { 
      setLoading(false); 
      setEntries({});
      setFullEntries([]);
      return; 
    }
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('liw_diary_entries' as any)
        .select('*')
        .eq('user_id', userId as string)
        .order('week_index', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Error loading diary:', error);
        setLoading(false);
        return;
      }

      const map: DiaryMap = {};
      const full: DiaryEntry[] = [];
      for (const row of (data as any) || []) {
        map[row.week_index.toString()] = row.content;
        full.push(row);
      }

      const queue = getOfflineQueue<DiarySyncOperation>(DIARY_QUEUE_KEY);
      const merged = applyQueuedDiaryOperations(map, full, queue, userId);

      setEntries(merged.entries);
      setFullEntries(merged.fullEntries);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const syncingRef = { current: false };

    const flushQueue = async () => {
      if (syncingRef.current || !navigator.onLine) return;

      const queue = getOfflineQueue<DiarySyncOperation>(DIARY_QUEUE_KEY);
      if (queue.length === 0) return;

      syncingRef.current = true;
      const queueLength = queue.length;
      const failed: DiarySyncOperation[] = [];

      for (const item of queue) {
        try {
          if (item.type === 'delete') {
            const { error } = await supabase
              .from('liw_diary_entries' as any)
              .delete()
              .eq('user_id', userId as string)
              .eq('week_index', item.weekIndex);

            if (error) throw error;
          } else {
            const { error } = await (supabase.from('liw_diary_entries' as any) as any).upsert({
              user_id: userId,
              week_index: item.weekIndex,
              content: item.content ?? '',
              photos: item.photos ?? [],
            });

            if (error) throw error;
          }
        } catch {
          failed.push(item);
        }
      }

      removeProcessedItems(DIARY_QUEUE_KEY, queueLength, failed);
      syncingRef.current = false;
    };

    void flushQueue();
    window.addEventListener('online', flushQueue);

    return () => {
      window.removeEventListener('online', flushQueue);
    };
  }, [userId]);

  const saveEntry = useCallback(
    async (weekIndex: number, content: string, photos?: string[]) => {
      if (!userId) return;
      const trimmed = content.trim();
      const key = weekIndex.toString();
      const updatedAt = new Date().toISOString();

      const prevEntries = { ...entries };
      const prevFull = [...fullEntries];

      if (trimmed === '') {
        setEntries((prev) => { const next = { ...prev }; delete next[key]; return next; });
        setFullEntries((prev) => prev.filter((e) => e.week_index !== weekIndex));

        if (!navigator.onLine) {
          appendOfflineItem<DiarySyncOperation>(DIARY_QUEUE_KEY, {
            type: 'delete',
            weekIndex,
            updatedAt,
          });
          return;
        }

        const { error } = await supabase.from('liw_diary_entries' as any).delete().eq('user_id', userId as string).eq('week_index', weekIndex);
        if (error) {
          appendOfflineItem<DiarySyncOperation>(DIARY_QUEUE_KEY, {
            type: 'delete',
            weekIndex,
            updatedAt,
          });
          setEntries(prevEntries);
          setFullEntries(prevFull);

          const merged = applyQueuedDiaryOperations(prevEntries, prevFull, getOfflineQueue<DiarySyncOperation>(DIARY_QUEUE_KEY), userId);
          setEntries(merged.entries);
          setFullEntries(merged.fullEntries);
        }
      } else {
        const existing = fullEntries.find((e) => e.week_index === weekIndex);
        const optimisticEntry: DiaryEntry = {
          id: existing?.id || 'temp-' + Date.now(),
          user_id: userId,
          week_index: weekIndex,
          content: trimmed,
          photos: photos || existing?.photos || [],
          created_at: existing?.created_at || updatedAt,
          updated_at: updatedAt,
        };

        setEntries((prev) => ({ ...prev, [key]: trimmed }));
        setFullEntries((prev) => [optimisticEntry, ...prev.filter((e) => e.week_index !== weekIndex)]);

        if (!navigator.onLine) {
          appendOfflineItem<DiarySyncOperation>(DIARY_QUEUE_KEY, {
            type: 'upsert',
            weekIndex,
            content: trimmed,
            photos: photos || [],
            updatedAt,
          });
          return;
        }

        const row = { user_id: userId, week_index: weekIndex, content: trimmed, photos: photos || [] };
        const { error } = await (supabase.from('liw_diary_entries' as any) as any).upsert(row);
        
        if (error) {
          appendOfflineItem<DiarySyncOperation>(DIARY_QUEUE_KEY, {
            type: 'upsert',
            weekIndex,
            content: trimmed,
            photos: photos || [],
            updatedAt,
          });
          setEntries(prevEntries);
          setFullEntries(prevFull);

          const merged = applyQueuedDiaryOperations(prevEntries, prevFull, getOfflineQueue<DiarySyncOperation>(DIARY_QUEUE_KEY), userId);
          setEntries(merged.entries);
          setFullEntries(merged.fullEntries);
        }
      }
    },
    [userId, entries, fullEntries],
  );

  return { entries, fullEntries, loading, saveEntry };
}
