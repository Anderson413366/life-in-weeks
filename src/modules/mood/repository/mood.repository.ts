import { supabase } from "@/shared/integrations/supabase";

import { MOOD_TABLE } from "./queries";

export async function fetchMoodEntries(userId: string) {
  return supabase.from(MOOD_TABLE as any).select("*").eq("user_id", userId).order("created_at", { ascending: false });
}

export async function upsertMoodEntry(
  userId: string,
  date: string,
  mood: string,
  energy: number,
  note: string | null,
  createdAt: string,
) {
  return (supabase.from(MOOD_TABLE as any) as any)
    .upsert(
      {
        user_id: userId,
        date,
        mood,
        energy,
        note,
        created_at: createdAt,
      },
      { onConflict: "user_id,date" },
    )
    .select()
    .single();
}
