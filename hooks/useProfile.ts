import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_LIFE_EXPECTANCY, AI_STORAGE_KEY } from "../constants";
import { DEFAULT_AVERAGES, type UserAverages } from "../types";

export interface ProfileState {
  birthdate: string;
  lifeExpectancy: number;
  displayName: string;
  email: string;
  phone: string;
  averages: UserAverages;
  loading: boolean;
}

export function useProfile(userId: string | undefined, userEmail: string | undefined) {
  const [birthdate, setBirthdate] = useState("");
  const [lifeExpectancy, setLifeExpectancy] = useState(DEFAULT_LIFE_EXPECTANCY);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [averages, setAverages] = useState<UserAverages>({ ...DEFAULT_AVERAGES });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("liw_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        if (data.birthdate) setBirthdate(data.birthdate);
        if (data.life_expectancy) setLifeExpectancy(data.life_expectancy);
        if (data.display_name) setDisplayName(data.display_name);
        if (data.phone) setPhone(data.phone);
        if (data.gemini_api_key) localStorage.setItem(AI_STORAGE_KEY, data.gemini_api_key);

        setAverages({
          avg_heartbeats_per_min: data.avg_heartbeats_per_min ?? DEFAULT_AVERAGES.avg_heartbeats_per_min,
          avg_breaths_per_min: data.avg_breaths_per_min ?? DEFAULT_AVERAGES.avg_breaths_per_min,
          avg_blinks_per_min: data.avg_blinks_per_min ?? DEFAULT_AVERAGES.avg_blinks_per_min,
          meals_per_day: data.meals_per_day ?? DEFAULT_AVERAGES.meals_per_day,
          avg_steps_per_day: data.avg_steps_per_day ?? DEFAULT_AVERAGES.avg_steps_per_day,
          avg_sleep_hours: data.avg_sleep_hours ?? DEFAULT_AVERAGES.avg_sleep_hours,
          avg_screen_hours: data.avg_screen_hours ?? DEFAULT_AVERAGES.avg_screen_hours,
          avg_words_per_day: data.avg_words_per_day ?? DEFAULT_AVERAGES.avg_words_per_day,
          avg_laughs_per_day: data.avg_laughs_per_day ?? DEFAULT_AVERAGES.avg_laughs_per_day,
        });
      } else {
        await supabase.from("liw_profiles").insert({ id: userId, life_expectancy: DEFAULT_LIFE_EXPECTANCY });
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const save = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!userId) return;
      await supabase.from("liw_profiles").upsert({ id: userId, ...fields }, { onConflict: "id" });
    },
    [userId],
  );

  const updateBirthdate = useCallback((v: string) => { setBirthdate(v); save({ birthdate: v }); }, [save]);
  const updateLifeExpectancy = useCallback((v: number) => { setLifeExpectancy(v); save({ life_expectancy: v }); }, [save]);
  const updateDisplayName = useCallback((v: string) => { setDisplayName(v); save({ display_name: v || null }); }, [save]);
  const updatePhone = useCallback((v: string) => { setPhone(v); save({ phone: v || null }); }, [save]);

  const updateApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(AI_STORAGE_KEY, trimmed);
    else localStorage.removeItem(AI_STORAGE_KEY);
    save({ gemini_api_key: trimmed || null });
  }, [save]);

  const updateAverages = useCallback((patch: Partial<UserAverages>) => {
    setAverages((prev) => ({ ...prev, ...patch }));
    save(patch);
  }, [save]);

  return {
    birthdate, lifeExpectancy, displayName, phone, averages, loading,
    email: userEmail ?? "",
    updateBirthdate, updateLifeExpectancy, updateDisplayName, updatePhone,
    updateApiKey, updateAverages,
  };
}
