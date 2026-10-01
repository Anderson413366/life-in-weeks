import { AI_STORAGE_KEY, GEMINI_IMAGE_MODELS, GEMINI_TEXT_MODEL } from "./queries";

export async function getGoogleGenAI(apiKey: string) {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
}

export function getStoredApiKey(): string {
  return localStorage.getItem(AI_STORAGE_KEY) ?? "";
}

export function setStoredApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(AI_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(AI_STORAGE_KEY);
  }
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(AI_STORAGE_KEY);
}

export { AI_STORAGE_KEY, GEMINI_IMAGE_MODELS, GEMINI_TEXT_MODEL };
