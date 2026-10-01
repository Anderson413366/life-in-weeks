import { useState, useEffect, useCallback } from 'react';
import { appendOfflineItem, formatLocalDate, getOfflineQueue, getScopedOfflineQueueKey, quarantineLegacyQueue, removeProcessedItems, setOfflineQueue } from '@/shared/lib';

import { fetchMoodEntries, upsertMoodEntry } from "../../repository/mood.repository";
import { MOOD_QUEUE_KEY } from "../../repository/queries";
import { applyQueuedMoodOperations, coalesceMoodOperations, isExpired, mergeMoodEntry } from "../../service/mood.service";
import type { MoodEntry } from '../../types/mood.types';
import {
  type MoodSyncOperation,
} from '../../types/dto';

export function useMood(userId: string | undefined) {
  const [currentMood, setCurrentMood] = useState<MoodEntry | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const queueKey = userId ? getScopedOfflineQueueKey(MOOD_QUEUE_KEY, userId) : null;

  useEffect(() => {
    if (!userId) return;
    quarantineLegacyQueue<MoodSyncOperation>(MOOD_QUEUE_KEY);
  }, [userId]);

  useEffect(() => {
    if (!userId) { 
      setLoading(false); 
      setCurrentMood(null);
      setRecentMoods([]);
      return; 
    }

    setLoading(true);
    setCurrentMood(null);
    setRecentMoods([]);
    let cancelled = false;

    async function load() {
      const { data, error } = await fetchMoodEntries(userId as string);

      if (cancelled) return;
      if (error) {
        const queuedEntries = applyQueuedMoodOperations([], getOfflineQueue<MoodSyncOperation>(queueKey!), userId);
        setRecentMoods(queuedEntries);
        const latest = queuedEntries[0];
        setCurrentMood(latest && !isExpired(latest) ? latest : null);
        setLoading(false);
        return;
      }

      const entries = applyQueuedMoodOperations((data as MoodEntry[]) || [], getOfflineQueue<MoodSyncOperation>(queueKey!), userId);
      setRecentMoods(entries);

      // Current mood is the latest one if not expired
      const latest = entries[0];
      setCurrentMood(latest && !isExpired(latest) ? latest : null);

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

      const rawQueue = getOfflineQueue<MoodSyncOperation>(queueKey);
      const queue = coalesceMoodOperations(rawQueue);
      if (queue.length !== rawQueue.length) setOfflineQueue(queueKey, queue);
      if (queue.length === 0) return;

      syncingRef.current = true;
      const queueLength = queue.length;
      const failed: MoodSyncOperation[] = [];

      for (const item of queue) {
        try {
          const { error } = await upsertMoodEntry(
            userId,
            item.date,
            item.mood,
            item.energy,
            item.note,
            item.created_at,
          );

          if (error) throw error;
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

  const saveMood = useCallback(
    async (mood: string, energy: number, note?: string) => {
      if (!userId || !queueKey) return;
      
      const prevMood = currentMood;
      const prevRecent = [...recentMoods];

      const now = new Date().toISOString();
      const today = formatLocalDate();
      const optimisticEntry: MoodEntry = { 
        id: 'temp-' + Date.now(),
        user_id: userId, 
        date: today,
        mood, 
        energy, 
        note: note?.trim() || null, 
        created_at: now 
      };

      // OPTIMISTIC UPDATE
      setCurrentMood(optimisticEntry);
      setRecentMoods((prev) => mergeMoodEntry(prev, optimisticEntry));

      const operation: MoodSyncOperation = {
        type: 'upsert',
        mood,
        energy,
        note: note?.trim() || null,
        date: today,
        created_at: now,
      };

      if (!navigator.onLine) {
        appendOfflineItem<MoodSyncOperation>(queueKey, operation);
        return;
      }

      const { data, error } = await upsertMoodEntry(userId, today, mood, energy, note?.trim() || null, now);
      
      if (error) {
        appendOfflineItem<MoodSyncOperation>(queueKey, operation);
        const queuedEntries = applyQueuedMoodOperations(prevRecent, getOfflineQueue<MoodSyncOperation>(queueKey), userId);
        setCurrentMood(queuedEntries[0] && !isExpired(queuedEntries[0]) ? queuedEntries[0] : prevMood);
        setRecentMoods(queuedEntries);
      } else if (data) {
        setCurrentMood(data);
        setRecentMoods((prev) => mergeMoodEntry(prev, data));
      }
    },
    [userId, queueKey, currentMood, recentMoods],
  );

  return { todayMood: currentMood, recentMoods, loading, saveMood };
}
