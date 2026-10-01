import type { LegalPageContent } from "../types/legal.types";

export const LEGAL_CONTENT: Record<"terms" | "privacy", LegalPageContent> = {
  terms: {
    title: "Terms of Service",
    updatedAt: "March 22, 2026",
    sections: [
      {
        heading: "Using the service",
        body: [
          "Life in Weeks is a personal reflection and journaling application built to help you visualize time, track moods, and preserve your own notes.",
          "You agree to use the app lawfully and not to upload content that is abusive, fraudulent, or infringes on someone else's rights.",
        ],
      },
      {
        heading: "Your account and content",
        body: [
          "You are responsible for maintaining the security of your account and login credentials.",
          "You retain ownership of the diary entries, uploaded photos, profile information, and exports you create inside the app.",
        ],
      },
      {
        heading: "AI-assisted features",
        body: [
          "Some features rely on your own Gemini API key. AI-generated output is intended for reflection and convenience, not for medical, legal, or financial advice.",
          "You should review generated content before relying on it or sharing it elsewhere.",
        ],
      },
      {
        heading: "Availability and changes",
        body: [
          "We may improve, modify, or discontinue parts of the service over time. We aim for reliability, but uninterrupted availability is not guaranteed.",
          "If your data is important to you, export it regularly using the in-app export tools.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updatedAt: "March 22, 2026",
    sections: [
      {
        heading: "What data is stored",
        body: [
          "Life in Weeks stores the information needed to operate your account and features, including profile fields, mood entries, diary entries, uploaded photos, and app preferences.",
          "If you add a Gemini API key, it is stored with your profile so AI features can work across devices and mirrored in this browser while you are signed in.",
        ],
      },
      {
        heading: "How the data is used",
        body: [
          "Your data is used to render your dashboard, life grid, diary history, mood history, and optional AI-assisted experiences.",
          "When you use AI-assisted prompts, diary analysis, horoscope, or Time Mirror, the selected text, portrait, or life-stage context is sent from your browser to Gemini using your own API key.",
          "We do not sell your personal journal content or mood history.",
        ],
      },
      {
        heading: "Infrastructure and storage",
        body: [
          "Account data is stored in Supabase and must be protected by per-user Row Level Security policies. App mode, offline diary or mood queues, Gemini helper caches, and the mirrored Gemini key may also be stored locally in your browser.",
          "Uploaded images and avatars are stored in the app's configured storage bucket. Treat uploaded media URLs as sensitive and avoid sharing exports publicly.",
        ],
      },
      {
        heading: "Your controls",
        body: [
          "You can update profile data, export your life data as JSON, replace or delete content you have saved, remove your Gemini key, and clear local offline data from Settings.",
          "For account-specific support, contact support@lifeinweeks.app.",
        ],
      },
    ],
  },
};
