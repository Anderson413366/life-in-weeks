import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MoodEntry } from '../types';
import {
  appendOfflineItem,
  getOfflineQueue,
  removeProcessedItems,
  type MoodSyncOperation,
} from '../lib/offlineSync';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const MOOD_QUEUE_KEY = 'liw-offline-mood-queue';

function isExpired(entry: MoodEntry): boolean {
  const createdAt = new Date(entry.created_at).getTime();
  return Date.now() - createdAt > THREE_HOURS_MS;
}

function applyQueuedMoodOperations(entries: MoodEntry[], queue: MoodSyncOperation[], userId?: string) {
  let nextEntries = [...entries];

  for (const item of queue) {
    const optimisticEntry: MoodEntry = {
      id: `offline-${item.date}`,
      user_id: userId ?? '',
      date: item.date,
      mood: item.mood,
      energy: item.energy,
      note: item.note,
      created_at: item.created_at,
    };

    nextEntries = [
      optimisticEntry,
      ...nextEntries.filter((entry) => !(entry.user_id === optimisticEntry.user_id && entry.date === optimisticEntry.date)),
    ];
  }

  return nextEntries;
}

export function useMood(userId: string | undefined) {
  const [currentMood, setCurrentMood] = useState<MoodEntry | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { 
      setLoading(false); 
      setCurrentMood(null);
      setRecentMoods([]);
      return; 
    }
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('liw_mood_entries' as any)
        .select('*')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false })
        .limit(100);

      if (cancelled) return;
      if (error) {
        console.error('Error loading mood:', error);
        setLoading(false);
        return;
      }

      const entries = applyQueuedMoodOperations((data as MoodEntry[]) || [], getOfflineQueue<MoodSyncOperation>(MOOD_QUEUE_KEY), userId);
      setRecentMoods(entries);

      // Current mood is the latest one if not expired
      const latest = entries[0];
      setCurrentMood(latest && !isExpired(latest) ? latest : null);

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

      const queue = getOfflineQueue<MoodSyncOperation>(MOOD_QUEUE_KEY);
      if (queue.length === 0) return;

      syncingRef.current = true;
      const queueLength = queue.length;
      const failed: MoodSyncOperation[] = [];

      for (const item of queue) {
        try {
          const { error } = await (supabase.from('liw_mood_entries' as any) as any)
            .upsert({
              user_id: userId,
              date: item.date,
              mood: item.mood,
              energy: item.energy,
              note: item.note,
              created_at: item.created_at,
            }, { onConflict: 'user_id,date' });

          if (error) throw error;
        } catch {
          failed.push(item);
        }
      }

      removeProcessedItems(MOOD_QUEUE_KEY, queueLength, failed);
      syncingRef.current = false;
    };

    void flushQueue();
    window.addEventListener('online', flushQueue);

    return () => {
      window.removeEventListener('online', flushQueue);
    };
  }, [userId]);

  const saveMood = useCallback(
    async (mood: string, energy: number, note?: string) => {
      if (!userId) return;
      
      const prevMood = currentMood;
      const prevRecent = [...recentMoods];

      const now = new Date().toISOString();
      const today = now.split('T')[0];
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
      setRecentMoods((prev) => [optimisticEntry, ...prev.filter(m => m.id !== optimisticEntry.id)]);

      const operation: MoodSyncOperation = {
        type: 'upsert',
        mood,
        energy,
        note: note?.trim() || null,
        date: today,
        created_at: now,
      };

      if (!navigator.onLine) {
        appendOfflineItem<MoodSyncOperation>(MOOD_QUEUE_KEY, operation);
        return;
      }

      const { data, error } = await (supabase.from('liw_mood_entries' as any) as any).upsert({
        user_id: userId,
        date: today,
        mood,
        energy,
        note: note?.trim() || null,
        created_at: now
      }, { onConflict: 'user_id,date' }).select().single();
      
      if (error) {
        console.error('Error saving mood:', error);
        appendOfflineItem<MoodSyncOperation>(MOOD_QUEUE_KEY, operation);
        const queuedEntries = applyQueuedMoodOperations(prevRecent, getOfflineQueue<MoodSyncOperation>(MOOD_QUEUE_KEY), userId);
        setCurrentMood(queuedEntries[0] && !isExpired(queuedEntries[0]) ? queuedEntries[0] : prevMood);
        setRecentMoods(queuedEntries);
      } else if (data) {
        setCurrentMood(data);
        setRecentMoods((prev) => [data, ...prev.filter(m => !(m.user_id === data.user_id && m.date === data.date))]);
      }
    },
    [userId, currentMood, recentMoods],
  );

  return { todayMood: currentMood, recentMoods, loading, saveMood };
}
