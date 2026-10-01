import { supabase } from "@/shared/integrations/supabase";

import { DIARY_TABLE } from "./queries";

export async function fetchDiaryEntries(userId: string) {
  return supabase.from(DIARY_TABLE as any).select("*").eq("user_id", userId).order("week_index", { ascending: false });
}

export async function deleteDiaryEntry(userId: string, weekIndex: number) {
  return supabase.from(DIARY_TABLE as any).delete().eq("user_id", userId).eq("week_index", weekIndex);
}

export async function upsertDiaryEntry(
  userId: string,
  weekIndex: number,
  content: string,
  photos?: string[],
) {
  return (supabase.from(DIARY_TABLE as any) as any).upsert(
    {
      user_id: userId,
      week_index: weekIndex,
      content,
      ...(photos !== undefined ? { photos } : {}),
    },
    { onConflict: "user_id,week_index" },
  );
}
