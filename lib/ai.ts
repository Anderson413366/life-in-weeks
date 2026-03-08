import { GoogleGenAI } from "@google/genai";
import { AI_STORAGE_KEY } from "../constants";

const MODEL = "gemini-2.0-flash";

function getClient(): GoogleGenAI | null {
  const key = localStorage.getItem(AI_STORAGE_KEY);
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export function hasApiKey(): boolean {
  return !!localStorage.getItem(AI_STORAGE_KEY);
}

export function setApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(AI_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(AI_STORAGE_KEY);
  }
}

export function getApiKey(): string {
  return localStorage.getItem(AI_STORAGE_KEY) ?? "";
}

export async function generateReflectionPrompts(weekDate: string): Promise<string> {
  const ai = getClient();
  if (!ai) return "Please add your Gemini API key in settings to use AI features.";

  const prompt = `You are a helpful and positive assistant. Generate 3 short, reflective writing prompts for a weekly journal entry. The entry is for the week of ${weekDate}. Keep the prompts concise, open-ended, and encouraging. Format them as a numbered list.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.7, maxOutputTokens: 1024 },
  });
  return response.text ?? "";
}

export async function analyzeDiaryEntry(entryText: string): Promise<string> {
  const ai = getClient();
  if (!ai) return "Please add your Gemini API key in settings to use AI features.";

  const prompt = `You are a helpful and insightful assistant. Analyze the following journal entry and provide:
1. A one-sentence, encouraging summary of the entry.
2. Identify 2-3 key emotions or themes present in the entry.
Format the response clearly with "Summary:" and "Key Themes/Emotions:".

Journal Entry:
---
${entryText}
---`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.7, maxOutputTokens: 1024 },
  });
  return response.text ?? "";
}
