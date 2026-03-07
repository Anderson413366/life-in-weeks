
import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Ensure API_KEY is handled as per instructions (from process.env)
// For client-side, this would typically be proxied or handled by a secure backend.
// As per prompt, assuming process.env.API_KEY is available.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn(
    "Gemini API key not found in process.env.API_KEY. Gemini features will be disabled."
  );
}

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const generateReflectionPrompts = async (weekDate: string): Promise<string> => {
  if (!ai) return "AI features are currently unavailable. API key might be missing.";

  const prompt = `You are a helpful and positive assistant. Generate 3 short, reflective writing prompts for a weekly journal entry. The entry is for the week of ${weekDate}. Keep the prompts concise, open-ended, and encouraging. Format them as a numbered list. Example: "1. What was a small win this week?"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{text: prompt}] }], // This structure is valid for Content[]
        config: { // Correctly pass config
            ...generationConfig,
            safetySettings: safetySettings 
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating reflection prompts:", error);
    return `Error from AI: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};

export const analyzeDiaryEntry = async (entryText: string): Promise<string> => {
  if (!ai) return "AI features are currently unavailable. API key might be missing.";

  const prompt = `You are a helpful and insightful assistant. Analyze the following journal entry and provide:
1. A one-sentence, encouraging summary of the entry.
2. Identify 2-3 key emotions or themes present in the entry. Be positive or neutral in your interpretation where possible.
Format the response clearly with "Summary:" and "Key Themes/Emotions:".

Journal Entry:
---
${entryText}
---
`;

  try {
     const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{text: prompt}] }], // This structure is valid for Content[]
        config: { // Correctly pass config
            ...generationConfig,
            safetySettings: safetySettings
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing diary entry:", error);
    return `Error from AI: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
};