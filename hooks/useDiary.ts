import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { DiaryMap } from "../types";

export interface FullDiaryEntry {
  week_index: number;
  content: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export function useDiary(userId: string | undefined) {
  const [entries, setEntries] = useState<DiaryMap>({});
  const [fullEntries, setFullEntries] = useState<FullDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("liw_diary_entries")
        .select("week_index, content, photos, created_at, updated_at")
        .eq("user_id", userId)
        .order("week_index", { ascending: false })
        .returns<FullDiaryEntry[]>();

      if (cancelled) return;

      const map: DiaryMap = {};
      const full: FullDiaryEntry[] = [];
      for (const row of data ?? []) {
        map[row.week_index.toString()] = row.content;
        full.push({ ...row, photos: row.photos ?? [] });
      }
      setEntries(map);
      setFullEntries(full);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const saveEntry = useCallback(
    async (weekIndex: number, content: string, photos?: string[]) => {
      if (!userId) return;
      const trimmed = content.trim();
      const key = weekIndex.toString();

      if (trimmed === "") {
        await supabase.from("liw_diary_entries").delete().eq("user_id", userId).eq("week_index", weekIndex);
        setEntries((prev) => { const next = { ...prev }; delete next[key]; return next; });
        setFullEntries((prev) => prev.filter((e) => e.week_index !== weekIndex));
      } else {
        const row = { user_id: userId, week_index: weekIndex, content: trimmed, photos: photos ?? [] };
        await supabase.from("liw_diary_entries").upsert(row, { onConflict: "user_id,week_index" });
        setEntries((prev) => ({ ...prev, [key]: trimmed }));
        setFullEntries((prev) => {
          const now = new Date().toISOString();
          const existing = prev.find((e) => e.week_index === weekIndex);
          const entry: FullDiaryEntry = {
            week_index: weekIndex,
            content: trimmed,
            photos: photos ?? existing?.photos ?? [],
            created_at: existing?.created_at ?? now,
            updated_at: now,
          };
          return [entry, ...prev.filter((e) => e.week_index !== weekIndex)];
        });
      }
    },
    [userId],
  );

  return { entries, fullEntries, loading, saveEntry };
}
