import { useState, useEffect, useCallback } from 'react';
import { clearApiKey, getApiKey, setApiKey } from "@/modules/ai/service/ai.service";
import { DEFAULT_LIFE_EXPECTANCY } from "@/constants";

import {
  bootstrapProfile,
  buildProfileDetailsUpdate,
  createEmptyProfileState,
  fetchProfile,
  hydrateProfileState,
  saveProfile,
  storeAvatar,
} from "../../service/profile.service";
import type { Profile, ProfileDetailsDraft, UserAverages } from "../../types/profile.types";

export function useProfile(userId: string | undefined, userEmail: string | undefined) {
  const [birthdate, setBirthdate] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState(DEFAULT_LIFE_EXPECTANCY);
  const [displayName, setDisplayName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [averages, setAverages] = useState<UserAverages>(() => createEmptyProfileState(DEFAULT_LIFE_EXPECTANCY).averages);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resetProfileState = () => {
      const next = createEmptyProfileState(DEFAULT_LIFE_EXPECTANCY);
      setBirthdate(next.birthdate);
      setLifeExpectancy(next.lifeExpectancy);
      setDisplayName(next.displayName);
      setPreferredName(next.preferredName);
      setPhone(next.phone);
      setAvatarUrl(next.avatarUrl);
      setAverages(next.averages);
    };

    resetProfileState();
    clearApiKey();

    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    async function load() {
      const currentUserId = userId as string;
      const { data, error } = await fetchProfile(currentUserId);

      if (cancelled) return;

      if (error) {
        setLoading(false);
        return;
      }

      if (data) {
        const p = data as Profile;
        const next = hydrateProfileState(p, DEFAULT_LIFE_EXPECTANCY);
        setBirthdate(next.birthdate);
        setLifeExpectancy(next.lifeExpectancy);
        setDisplayName(next.displayName);
        setPreferredName(next.preferredName);
        setPhone(next.phone);
        setAvatarUrl(next.avatarUrl);
        if (p.gemini_api_key) setApiKey(p.gemini_api_key);
        else clearApiKey();
        setAverages(next.averages);
      } else {
        const { error: insertError } = await bootstrapProfile(currentUserId, DEFAULT_LIFE_EXPECTANCY);
        if (insertError) {
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const save = useCallback(
    async (fields: any) => {
      if (!userId) return new Error('Missing user id');
      const { error } = await saveProfile(userId, fields);
      return error;
    },
    [userId],
  );

  const saveProfileDetails = useCallback(async (draft: ProfileDetailsDraft) => {
    const previous = { birthdate, lifeExpectancy, displayName, preferredName, phone };

    setBirthdate(draft.birthdate);
    setLifeExpectancy(draft.lifeExpectancy);
    setDisplayName(draft.displayName);
    setPreferredName(draft.preferredName);
    setPhone(draft.phone);

    const err = await save(buildProfileDetailsUpdate(draft));

    if (err) {
      setBirthdate(previous.birthdate);
      setLifeExpectancy(previous.lifeExpectancy);
      setDisplayName(previous.displayName);
      setPreferredName(previous.preferredName);
      setPhone(previous.phone);
    }

    return !err;
  }, [birthdate, displayName, lifeExpectancy, phone, preferredName, save]);

  const updateBirthdate = useCallback(async (v: string) => {
    return saveProfileDetails({ birthdate: v, lifeExpectancy, displayName, preferredName, phone });
  }, [displayName, lifeExpectancy, phone, preferredName, saveProfileDetails]);

  const updateLifeExpectancy = useCallback(async (v: number) => {
    return saveProfileDetails({ birthdate, lifeExpectancy: v, displayName, preferredName, phone });
  }, [birthdate, displayName, phone, preferredName, saveProfileDetails]);

  const updateDisplayName = useCallback(async (v: string) => {
    return saveProfileDetails({ birthdate, lifeExpectancy, displayName: v, preferredName, phone });
  }, [birthdate, lifeExpectancy, phone, preferredName, saveProfileDetails]);

  const updatePreferredName = useCallback(async (v: string) => {
    return saveProfileDetails({ birthdate, lifeExpectancy, displayName, preferredName: v, phone });
  }, [birthdate, displayName, lifeExpectancy, phone, saveProfileDetails]);

  const updatePhone = useCallback(async (v: string) => {
    return saveProfileDetails({ birthdate, lifeExpectancy, displayName, preferredName, phone: v });
  }, [birthdate, displayName, lifeExpectancy, preferredName, saveProfileDetails]);

  const updateAvatar = useCallback(async (file: File) => {
    if (!userId) return false;
    const previous = avatarUrl;

    try {
      const url = await storeAvatar(userId, file);
      setAvatarUrl(url);
      const err = await save({ avatar_url: url });
      if (err) {
        setAvatarUrl(previous);
        return false;
      }
      return true;
    } catch {
      setAvatarUrl(previous);
      return false;
    }
  }, [avatarUrl, save, userId]);

  const updateApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    const previousKey = getApiKey().trim();
    setApiKey(trimmed);
    const err = await save({ gemini_api_key: trimmed || null });
    if (err) {
      setApiKey(previousKey);
    }
    return !err;
  }, [save]);

  const saveAverages = useCallback(async (nextAverages: UserAverages) => {
    const previous = averages;
    setAverages(nextAverages);
    const err = await save(nextAverages);
    if (err) setAverages(previous);
    return !err;
  }, [averages, save]);

  const updateAverages = useCallback(async (patch: Partial<UserAverages>) => {
    return saveAverages({ ...averages, ...patch });
  }, [averages, saveAverages]);

  const greeting = preferredName || displayName || '';

  return {
    birthdate, lifeExpectancy, displayName, preferredName, phone, avatarUrl, averages, loading, greeting,
    email: userEmail ?? '',
    saveProfileDetails,
    saveAverages,
    updateBirthdate, updateLifeExpectancy, updateDisplayName, updatePreferredName,
    updatePhone, updateAvatar, updateApiKey, updateAverages,
  };
}
