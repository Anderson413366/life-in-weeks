import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_LIFE_EXPECTANCY } from "../constants";
import type { Profile } from "../types";

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
      const { data } = await supabase
        .from("profiles")
        .select("birthdate, life_expectancy")
        .eq("id", userId)
        .single<Pick<Profile, "birthdate" | "life_expectancy">>();

      if (cancelled) return;

      if (data) {
        if (data.birthdate) setBirthdate(data.birthdate);
        setLifeExpectancy(data.life_expectancy);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Persist profile changes
  const saveProfile = useCallback(
    async (fields: { birthdate?: string; life_expectancy?: number }) => {
      if (!userId) return;

      await supabase
        .from("profiles")
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

  return { birthdate, lifeExpectancy, loading, updateBirthdate, updateLifeExpectancy };
}
