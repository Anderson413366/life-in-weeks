import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface MoodEntry {
  date: string;
  mood: string;
  energy: number;
  note: string | null;
  created_at: string;
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

function isExpired(entry: MoodEntry): boolean {
  const createdAt = new Date(entry.created_at).getTime();
  return Date.now() - createdAt > THREE_HOURS_MS;
}

export function useMood(userId: string | undefined) {
  const [currentMood, setCurrentMood] = useState<MoodEntry | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("liw_mood_entries")
        .select("date, mood, energy, note, created_at")
        .eq("user_id", userId)
        .gte("date", new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0])
        .order("date", { ascending: false })
        .returns<MoodEntry[]>();

      if (cancelled) return;

      const entries = data ?? [];
      setRecentMoods(entries);

      // Find today's entry — only show if not expired (< 3 hours old)
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = entries.find((e) => e.date === today);
      setCurrentMood(todayEntry && !isExpired(todayEntry) ? todayEntry : null);

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const saveMood = useCallback(
    async (mood: string, energy: number, note?: string) => {
      if (!userId) return;
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();
      const entry: MoodEntry = { date: today, mood, energy, note: note?.trim() || null, created_at: now };

      await supabase.from("liw_mood_entries").upsert(
        { user_id: userId, date: today, mood, energy, note: entry.note, created_at: now },
        { onConflict: "user_id,date" },
      );

      setCurrentMood(entry);
      setRecentMoods((prev) => {
        const filtered = prev.filter((e) => e.date !== today);
        return [entry, ...filtered];
      });
    },
    [userId],
  );

  // Check expiration periodically
  useEffect(() => {
    if (!currentMood) return;

    const check = () => {
      if (currentMood && isExpired(currentMood)) {
        setCurrentMood(null);
      }
    };

    const id = setInterval(check, 60000); // Check every minute
    return () => clearInterval(id);
  }, [currentMood]);

  return { todayMood: currentMood, recentMoods, loading, saveMood };
}
