export interface GeminiImageRequest {
  apiKey: string;
  photoBase64: string;
  photoMimeType: string;
  targetAge: number;
  currentAge: number;
}
