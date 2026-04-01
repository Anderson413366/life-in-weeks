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
  const { GoogleGenAI } = await import("@google/genai");
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

  const prompt = `You are creating a respectful age-progression portrait from a real uploaded face.

Transform this portrait of a person currently around ${currentAge} years old so they appear as ${ageDesc}.

Requirements:
- Preserve identity, bone structure, eye shape, nose shape, smile shape, skin tone, and ethnicity.
- Change only age-related attributes like skin texture, wrinkles, hair density or graying, face fullness, and posture cues.
- Keep the portrait front-facing, realistic, calm, and natural.
- Use soft natural lighting and a clean neutral background.
- Do not stylize, caricature, beautify, distort, or add extra accessories.
- Return a single photorealistic portrait image.`;

  // Try the image generation model first
  const models = ["gemini-2.5-flash", "gemini-2.0-flash-exp"];

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

  throw new Error("Time Mirror could not generate an image right now. Try again in a minute, or use a clearer front-facing photo.");
}
