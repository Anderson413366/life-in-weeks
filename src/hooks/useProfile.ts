import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { uploadAvatar } from '../lib/storage';
import { DEFAULT_LIFE_EXPECTANCY, AI_STORAGE_KEY } from '../constants';
import { DEFAULT_AVERAGES, type UserAverages, type Profile } from '../types';

export function useProfile(userId: string | undefined, userEmail: string | undefined) {
  const [birthdate, setBirthdate] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState(DEFAULT_LIFE_EXPECTANCY);
  const [displayName, setDisplayName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [averages, setAverages] = useState<UserAverages>({ ...DEFAULT_AVERAGES });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('liw_profiles' as any)
        .select('*')
        .eq('id', userId as string)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Profile load failed:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const p = data as Profile;
        if (p.birthdate) setBirthdate(p.birthdate);
        if (p.life_expectancy) setLifeExpectancy(p.life_expectancy);
        if (p.display_name) setDisplayName(p.display_name);
        if (p.preferred_name) setPreferredName(p.preferred_name);
        if (p.phone) setPhone(p.phone);
        if (p.avatar_url) setAvatarUrl(p.avatar_url);
        if (p.gemini_api_key) localStorage.setItem(AI_STORAGE_KEY, p.gemini_api_key);

        setAverages({
          avg_heartbeats_per_min: p.avg_heartbeats_per_min ?? DEFAULT_AVERAGES.avg_heartbeats_per_min,
          avg_breaths_per_min: p.avg_breaths_per_min ?? DEFAULT_AVERAGES.avg_breaths_per_min,
          avg_blinks_per_min: p.avg_blinks_per_min ?? DEFAULT_AVERAGES.avg_blinks_per_min,
          meals_per_day: p.meals_per_day ?? DEFAULT_AVERAGES.meals_per_day,
          avg_steps_per_day: p.avg_steps_per_day ?? DEFAULT_AVERAGES.avg_steps_per_day,
          avg_sleep_hours: p.avg_sleep_hours ?? DEFAULT_AVERAGES.avg_sleep_hours,
          avg_screen_hours: p.avg_screen_hours ?? DEFAULT_AVERAGES.avg_screen_hours,
          avg_words_per_day: p.avg_words_per_day ?? DEFAULT_AVERAGES.avg_words_per_day,
          avg_laughs_per_day: p.avg_laughs_per_day ?? DEFAULT_AVERAGES.avg_laughs_per_day,
        });
      } else {
        const { error: insertError } = await supabase.from('liw_profiles' as any).insert({ id: userId, life_expectancy: DEFAULT_LIFE_EXPECTANCY } as any);
        if (insertError) console.error('Profile bootstrap insert failed:', insertError);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const save = useCallback(
    async (fields: any) => {
      if (!userId) return;
      const { error } = await supabase.from('liw_profiles' as any).upsert({ id: userId, ...fields });
      if (error) console.error('Profile save failed:', error);
      return error;
    },
    [userId],
  );

  const updateBirthdate = useCallback(async (v: string) => { setBirthdate(v); const err = await save({ birthdate: v }); if (err) setBirthdate(''); }, [save]);
  const updateLifeExpectancy = useCallback(async (v: number) => { const prev = lifeExpectancy; setLifeExpectancy(v); const err = await save({ life_expectancy: v }); if (err) setLifeExpectancy(prev); }, [save, lifeExpectancy]);
  const updateDisplayName = useCallback(async (v: string) => { setDisplayName(v); await save({ display_name: v || null }); }, [save]);
  const updatePreferredName = useCallback(async (v: string) => { setPreferredName(v); await save({ preferred_name: v || null }); }, [save]);
  const updatePhone = useCallback(async (v: string) => { setPhone(v); await save({ phone: v || null }); }, [save]);

  const updateAvatar = useCallback(async (file: File) => {
    if (!userId) return;
    const url = await uploadAvatar(userId, file);
    setAvatarUrl(url);
    await save({ avatar_url: url });
  }, [userId, save]);

  const updateApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(AI_STORAGE_KEY, trimmed);
    else localStorage.removeItem(AI_STORAGE_KEY);
    const err = await save({ gemini_api_key: trimmed || null });
    if (err) {
      // Revert localStorage on save failure
      localStorage.removeItem(AI_STORAGE_KEY);
    }
  }, [save]);

  const updateAverages = useCallback(async (patch: Partial<UserAverages>) => {
    setAverages((prev) => ({ ...prev, ...patch }));
    await save(patch);
  }, [save]);

  const greeting = preferredName || displayName || '';

  return {
    birthdate, lifeExpectancy, displayName, preferredName, phone, avatarUrl, averages, loading, greeting,
    email: userEmail ?? '',
    updateBirthdate, updateLifeExpectancy, updateDisplayName, updatePreferredName,
    updatePhone, updateAvatar, updateApiKey, updateAverages,
  };
}
