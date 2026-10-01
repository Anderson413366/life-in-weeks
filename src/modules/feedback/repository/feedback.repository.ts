import { supabase } from "@/shared/integrations/supabase";

import { FEEDBACK_TABLE } from "./queries";

export async function insertFeedback(userId: string | undefined, stars: number, message: string) {
  return (supabase.from(FEEDBACK_TABLE as any) as any).insert({
    user_id: userId ?? null,
    stars,
    message: message.trim() || null,
  });
}
