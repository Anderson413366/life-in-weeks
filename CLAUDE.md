# Life in Weeks — Developer Guide

## Project Overview
Life in Weeks is a visual life dashboard and journaling app. It shows your entire life as a grid of weeks, with rich stats, mood tracking, AI-powered features, and a diary.

## Tech Stack
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS (CDN), Framer Motion
- **Backend**: Supabase (auth, database, storage)
- **AI**: Google Gemini API (user BYOK — bring your own key)
- **Hosting**: Vercel (auto-deploys on push to `main`)
- **Gestures**: @use-gesture/react, @react-spring/web

## Links
- **Production**: https://life-in-weeks-seven-silk.vercel.app
- **GitHub**: https://github.com/Anderson413366/life-in-weeks
- **Supabase Project**: `bqoqjixsdqrqsxasyifa` (gleamops project, `liw_` prefixed tables)

## Architecture

### Database (Supabase — `public` schema, `liw_` prefix)
| Table | Purpose |
|---|---|
| `liw_profiles` | User settings: birthdate, life expectancy, name, phone, avatar, API key, custom averages |
| `liw_diary_entries` | Weekly diary entries with photos (JSONB array of URLs) |
| `liw_mood_entries` | Daily mood check-ins (emoji, energy, note) — resets every 3 hours |
| `liw_feedback` | User feedback (stars 1-5 + message) |
| `liw_signup_log` | New user signup notifications (auto-populated by trigger) |

All tables have RLS policies — users can only access their own data.

### Storage
- **Bucket**: `liw-photos` (public, per-user folders)
- Used for diary photos and user avatars

### Auth
- Email/password with email verification
- Google OAuth (requires Google Cloud credentials in Supabase dashboard)
- Trigger on `auth.users` INSERT logs signups to `liw_signup_log`

### File Structure
```
lib/           → supabase client, AI service, theme, zodiac, generations, storage, onThisDay
hooks/         → useAuth, useProfile, useDiary, useLifeStats, useMood, useAppMode,
                 useHoroscope, useFamousBirthdays, useTimeMirror, useSpeechToText
components/    → All UI components (see below)
types.ts       → All TypeScript interfaces
constants.ts   → Quotes, life expectancy bounds, time constants
App.tsx        → Main orchestrator
index.tsx      → Entry point
index.css      → Premium warm dark theme, card system, accessibility
```

### Key Components
| Component | Purpose |
|---|---|
| `DashboardPage` | Hero ring, mood check-in, accordion data sections (14 sections) |
| `LifeGridPage` | React/CSS grid in 3 modes: Weeks (52×90), Months (12×90), Years (10×9) |
| `DiaryPage` | Diary entries list/card view, search, filters, voice CTA |
| `DiaryModal` | Write/edit entries with photos, voice input, AI prompts |
| `WeekModal` | Premium glassmorphism diary popup for grid clicks |
| `TimeMirrorPage` | AI face aging across decades (Gemini image generation) |
| `SettingsPage` | Profile, API key, custom averages, display mode, contact, life expectancy calculator |
| `AuthGate` | Login/signup with Google OAuth + email/password |
| `FeedbackPopup` | Star rating + follow-up for < 5 stars |
| `Navigation` | 5-tab centered nav bar |
| `Footer` | Copyright + tagline |

### AI Features (all use Gemini 2.5 Flash, user's own API key)
- Diary reflection prompts + entry analysis
- Horoscope (Today/Week/Year) — cached in localStorage
- Famous people born same day — cached 7 days
- Life expectancy questionnaire (no API — deterministic scoring)
- Time Mirror face aging (Gemini image generation)
- Mood-specific compassionate responses (no API — curated messages)

### Design System
- **Theme**: Warm purple-tinted dark (not cold blue)
- **Cards**: `.card-base` CSS class — gradient bg, purple-tinted borders, shadow
- **Colors**: Cyan (#00d4ff) primary, Pink (#ec4899) accent, Purple (#bf5fff) tertiary
- **Modes**: Zen (warm gradients, animations) / Focus (pure black/white, zero animation)
- **Accessibility**: WCAG 2.2 AA, reduced motion, 44px touch targets, focus-visible outlines

## Development Workflow
```bash
npm run dev          # Start dev server
npm run typecheck    # TypeScript check (must pass before commit)
npm run build        # Production build
vercel deploy --prod # Deploy to production
```

## Deploy Checklist
1. `npx tsc --noEmit` — must pass
2. `git add <specific files>` + `git commit`
3. `git push origin main`
4. `vercel deploy --prod`

## Important Notes
- Gemini model: `gemini-2.5-flash` (Google deprecates models frequently — check if 404s occur)
- User API keys stored in `liw_profiles.gemini_api_key` + synced to localStorage
- Supabase uses the same project as GleamOps — tables prefixed with `liw_` to avoid conflicts
- Google OAuth requires credentials configured in Supabase Dashboard → Auth → Providers → Google
- PWA: manifest.json + service worker (`public/sw.js`) — bump cache version on major changes
