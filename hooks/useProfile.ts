import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_LIFE_EXPECTANCY, AI_STORAGE_KEY } from "../constants";

export function useProfile(userId: string | undefined) {
  const [birthdate, setBirthdate] = useState<string>("");
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(DEFAULT_LIFE_EXPECTANCY);
  const [loading, setLoading] = useState(true);

  // Load profile on mount / user change
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      // Try to load existing profile
      const { data } = await supabase
        .from("liw_profiles")
        .select("birthdate, life_expectancy, gemini_api_key")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        if (data.birthdate) setBirthdate(data.birthdate);
        if (data.life_expectancy) setLifeExpectancy(data.life_expectancy);
        // Sync API key from DB → localStorage
        if (data.gemini_api_key) {
          localStorage.setItem(AI_STORAGE_KEY, data.gemini_api_key);
        }
      } else {
        // Auto-create profile on first login
        await supabase
          .from("liw_profiles")
          .insert({ id: userId, life_expectancy: DEFAULT_LIFE_EXPECTANCY });
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Persist profile changes
  const saveProfile = useCallback(
    async (fields: Record<string, unknown>) => {
      if (!userId) return;
      await supabase
        .from("liw_profiles")
        .upsert({ id: userId, ...fields }, { onConflict: "id" });
    },
    [userId],
  );

  const updateBirthdate = useCallback(
    (value: string) => {
      setBirthdate(value);
      saveProfile({ birthdate: value });
    },
    [saveProfile],
  );

  const updateLifeExpectancy = useCallback(
    (value: number) => {
      setLifeExpectancy(value);
      saveProfile({ life_expectancy: value });
    },
    [saveProfile],
  );

  const updateApiKey = useCallback(
    (key: string) => {
      const trimmed = key.trim();
      if (trimmed) {
        localStorage.setItem(AI_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(AI_STORAGE_KEY);
      }
      saveProfile({ gemini_api_key: trimmed || null });
    },
    [saveProfile],
  );

  return { birthdate, lifeExpectancy, loading, updateBirthdate, updateLifeExpectancy, updateApiKey };
}
