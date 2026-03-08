import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { DiaryEntry, DiaryMap } from "../types";

export function useDiary(userId: string | undefined) {
  const [entries, setEntries] = useState<DiaryMap>({});
  const [loading, setLoading] = useState(true);

  // Load all diary entries for user
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("diary_entries")
        .select("week_index, content")
        .eq("user_id", userId)
        .returns<Pick<DiaryEntry, "week_index" | "content">[]>();

      if (cancelled) return;

      const map: DiaryMap = {};
      for (const row of data ?? []) {
        map[row.week_index.toString()] = row.content;
      }
      setEntries(map);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const saveEntry = useCallback(
    async (weekIndex: number, content: string) => {
      if (!userId) return;

      const trimmed = content.trim();
      const key = weekIndex.toString();

      if (trimmed === "") {
        // Delete entry
        await supabase
          .from("diary_entries")
          .delete()
          .eq("user_id", userId)
          .eq("week_index", weekIndex);

        setEntries((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        // Upsert entry
        await supabase.from("diary_entries").upsert(
          { user_id: userId, week_index: weekIndex, content: trimmed },
          { onConflict: "user_id,week_index" },
        );

        setEntries((prev) => ({ ...prev, [key]: trimmed }));
      }
    },
    [userId],
  );

  return { entries, loading, saveEntry };
}
