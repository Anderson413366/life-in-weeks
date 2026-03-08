import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface MoodEntry {
  date: string;
  mood: string;
  energy: number;
  note: string | null;
}

export function useMood(userId: string | undefined) {
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const today = new Date().toISOString().split("T")[0];

      // Load today's mood and last 14 days
      const { data } = await supabase
        .from("liw_mood_entries")
        .select("date, mood, energy, note")
        .eq("user_id", userId)
        .gte("date", new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0])
        .order("date", { ascending: false })
        .returns<MoodEntry[]>();

      if (cancelled) return;

      const entries = data ?? [];
      setRecentMoods(entries);
      setTodayMood(entries.find((e) => e.date === today) ?? null);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const saveMood = useCallback(
    async (mood: string, energy: number, note?: string) => {
      if (!userId) return;
      const today = new Date().toISOString().split("T")[0];
      const entry: MoodEntry = { date: today, mood, energy, note: note?.trim() || null };

      await supabase.from("liw_mood_entries").upsert(
        { user_id: userId, date: today, mood, energy, note: entry.note },
        { onConflict: "user_id,date" },
      );

      setTodayMood(entry);
      setRecentMoods((prev) => {
        const filtered = prev.filter((e) => e.date !== today);
        return [entry, ...filtered];
      });
    },
    [userId],
  );

  return { todayMood, recentMoods, loading, saveMood };
}
