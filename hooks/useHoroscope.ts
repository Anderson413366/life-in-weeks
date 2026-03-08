import { useState, useCallback } from "react";
import { getApiKey } from "../lib/ai";
import { GoogleGenAI } from "@google/genai";

export interface HoroscopeResult {
  theme: string;
  message: string;
  focus: string;
  energy: "high" | "medium" | "low";
}

type Period = "today" | "week" | "year";

const CACHE_PREFIX = "liw-horoscope-";
const EXPIRY: Record<Period, number> = {
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  year: 30 * 24 * 60 * 60 * 1000,
};

function getCached(key: string): HoroscopeResult | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key: string, data: HoroscopeResult, period: Period) {
  localStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + EXPIRY[period] }));
}

export function useHoroscope(
  zodiacSign: string,
  zodiacElement: string,
  birthMonth: number,
  birthDay: number,
  birthYear: number,
  currentAge: number,
  lifePercent: string,
) {
  const [result, setResult] = useState<HoroscopeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePeriod, setActivePeriod] = useState<Period>("today");

  const fetch = useCallback(async (period: Period) => {
    setActivePeriod(period);
    const cacheKey = `${CACHE_PREFIX}${zodiacSign}-${period}`;
    const cached = getCached(cacheKey);
    if (cached) { setResult(cached); return; }

    const apiKey = getApiKey();
    if (!apiKey) { setError("no-key"); return; }

    setLoading(true);
    setError("");
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an insightful, modern astrologer. The user is a ${zodiacSign} (${zodiacElement} sign), born ${birthMonth}/${birthDay}/${birthYear}, currently ${currentAge} years old.
Generate a ${period === "today" ? "daily" : period === "week" ? "weekly" : "yearly"} horoscope. Be specific, warm, and empowering — not generic. Reference their actual life stage (${currentAge} years old, ${lifePercent}% through their journey). Keep each section under 60 words. Return ONLY valid JSON, no markdown:
{"theme":"one word","message":"the horoscope","focus":"one action","energy":"high|medium|low"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.8, maxOutputTokens: 512 },
      });

      const text = (response.text ?? "").replace(/```json\n?|```/g, "").trim();
      const parsed: HoroscopeResult = JSON.parse(text);
      setResult(parsed);
      setCache(cacheKey, parsed, period);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.error("Horoscope error:", msg, e);
      setError(msg.includes("API_KEY") || msg.includes("401") ? "Invalid API key. Check Settings → AI Configuration." : `Horoscope error: ${msg.slice(0, 80)}`);
    } finally {
      setLoading(false);
    }
  }, [zodiacSign, zodiacElement, birthMonth, birthDay, birthYear, currentAge, lifePercent]);

  return { result, loading, error, activePeriod, fetch };
}
