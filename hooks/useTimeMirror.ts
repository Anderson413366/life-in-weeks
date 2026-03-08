import { GoogleGenAI } from "@google/genai";

export interface DecadeInfo {
  age: number;
  year: number;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

export async function generateDecadeImage(
  apiKey: string,
  photoBase64: string,
  photoMimeType: string,
  targetAge: number,
  currentAge: number,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const ageDesc =
    targetAge === 0 ? "a newborn baby (0 years old)"
    : targetAge <= 5 ? `a toddler approximately ${targetAge} years old`
    : targetAge <= 12 ? `a child approximately ${targetAge} years old`
    : targetAge <= 19 ? `a teenager approximately ${targetAge} years old`
    : targetAge <= 30 ? `a young adult approximately ${targetAge} years old`
    : targetAge <= 50 ? `a middle-aged adult approximately ${targetAge} years old`
    : targetAge <= 65 ? `a mature adult approximately ${targetAge} years old`
    : `an elderly person approximately ${targetAge} years old`;

  const prompt = `This is a photo of a real person currently around ${currentAge} years old. Transform this portrait to show exactly how this same person would look as ${ageDesc}. Preserve their exact facial bone structure, eye shape, nose shape, and unique features. Maintain the same skin tone and ethnicity. Age or de-age only: adjust skin texture, wrinkles, hair color/amount, face fullness appropriately. Photorealistic result, professional portrait photography style. Soft natural lighting, front-facing. Clean neutral background.`;

  // Try the image generation model first
  const models = ["gemini-2.0-flash-exp", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: photoMimeType, data: photoBase64 } },
          ],
        }],
        config: {
          responseModalities: ["IMAGE", "TEXT"],
        } as any,
      });

      // Check for image in response
      const candidates = (response as any).candidates ?? [];
      for (const candidate of candidates) {
        for (const part of candidate?.content?.parts ?? []) {
          if (part?.inlineData?.mimeType?.startsWith("image/")) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      // Also check response.text for any base64 image data
      const text = response.text ?? "";
      if (text.includes("data:image")) {
        const match = text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (match) return match[0];
      }

      // If no image found, this model doesn't support image generation
      continue;
    } catch (e: any) {
      console.warn(`Model ${model} failed:`, e.message);
      continue;
    }
  }

  throw new Error("Image generation not available. The Gemini models tried do not support image output for this request.");
}
