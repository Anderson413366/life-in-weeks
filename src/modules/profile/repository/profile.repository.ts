import { supabase } from "@/shared/integrations/supabase";
import { uploadAvatar } from "@/shared/lib";

import { PROFILE_TABLE } from "./queries";
import type { ProfileRecordUpdate } from "../types/dto";

export async function fetchProfile(userId: string) {
  return supabase.from(PROFILE_TABLE as any).select("*").eq("id", userId).maybeSingle();
}

export async function bootstrapProfile(userId: string, lifeExpectancy: number) {
  return supabase.from(PROFILE_TABLE as any).insert({ id: userId, life_expectancy: lifeExpectancy } as any);
}

export async function saveProfile(userId: string, fields: ProfileRecordUpdate) {
  return (supabase.from(PROFILE_TABLE as any) as any).upsert({ id: userId, ...fields });
}

export async function storeAvatar(userId: string, file: File) {
  return uploadAvatar(userId, file);
}
