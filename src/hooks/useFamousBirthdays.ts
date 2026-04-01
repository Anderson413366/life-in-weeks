import { useState, useCallback } from "react";
import { getApiKey } from "../lib/ai";

export interface FamousPerson {
  name: string;
  born: number;
  died: number | null;
  field: string;
  emoji: string;
  tagline: string;
}

const CACHE_PREFIX = "liw-famous-";
const EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCached(key: string): FamousPerson[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

export function useFamousBirthdays(birthMonth: number, birthDay: number) {
  const [people, setPeople] = useState<FamousPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const fetch = useCallback(async () => {
    if (fetched) return;
    const cacheKey = `${CACHE_PREFIX}${birthMonth}-${birthDay}`;
    const cached = getCached(cacheKey);
    if (cached) { setPeople(cached); setFetched(true); return; }

    const apiKey = getApiKey();
    if (!apiKey) { setError("no-key"); setFetched(true); return; }

    setLoading(true);
    setError("");
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const prompt = `You are a knowledgeable historian. List exactly 8 famous people born on ${monthNames[birthMonth]} ${birthDay} (any year). Include people from diverse fields: one musician, one actor/actress, one athlete, one scientist/inventor, one political figure, one artist/writer, one entrepreneur/business figure, and one historical figure.

For each person respond with JSON array:
[{"name":"Full Name","born":1985,"died":null,"field":"Music","emoji":"🎵","tagline":"One sentence max 12 words"}]

Return ONLY the raw JSON array, no markdown, no explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.7, maxOutputTokens: 1024 },
      });

      const raw = (response.text ?? "").replace(/```json\n?|```/g, "").trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      const parsed: FamousPerson[] = JSON.parse(jsonMatch[0]);
      setPeople(parsed);
      localStorage.setItem(cacheKey, JSON.stringify({ data: parsed, expiry: Date.now() + EXPIRY }));
    } catch (e: any) {
      setError("Failed to load");
      console.error("Famous birthdays error:", e);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [birthMonth, birthDay, fetched]);

  return { people, loading, error, fetch };
}
