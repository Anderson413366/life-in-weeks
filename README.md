# Life in Weeks

Life in Weeks is a personal reflection app that visualizes your life as a grid of weeks, layers in mood and journal history, and adds optional Gemini-powered insights.

The app is a React single-page application with Supabase for auth/data/storage, Vite for build/dev, and Tailwind CSS for styling. It includes offline-friendly journal and mood syncing, JSON export, public legal pages, and a PWA shell.

Production:

```text
https://life-in-weeks-seven-silk.vercel.app
```

## Core Features

- Dashboard with life statistics, exact age, milestone data, mood check-ins, and expandable insight sections
- Life grid with one-cell-per-week visualization and diary entry access from past weeks
- Diary with text, voice input, photo attachments, AI reflection helpers, and offline queueing
- Time Mirror with Gemini-powered aging/reflection workflows
- Settings for profile, averages, display mode, Gemini key, and data export
- Public `/terms` and `/privacy` pages

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, React Router |
| Build | Vite 7 |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer, CSS/native transitions |
| Auth / DB / Storage | Supabase |
| AI | Google Gemini (`@google/genai`) |
| Testing | Vitest, Testing Library, jsdom |
| Hosting | Vercel |

## Project Structure

```text
src/
  App.tsx                  app shell, routing, legal page content
  index.tsx                React entry point
  index.css                global styles, Tailwind entry, card system, focus mode
  setupTests.ts            test setup (jsdom + testing-library matchers)
  types.ts                 shared TypeScript interfaces
  constants.ts             static app constants and quotes
  components/
    AuthGate.tsx            login, signup, password reset, recovery
    DashboardPage.tsx       dashboard with stats, mood, accordions, lazy sections
    LifeGridPage.tsx        life grid (weeks/months/years) with diary modal
    DiaryPage.tsx           diary list, search, filter, delete
    DiaryModal.tsx          diary entry editor (text, voice, photos, AI)
    WeekModal.tsx           week-level diary editor from grid
    TimeMirrorPage.tsx      Gemini-powered aging/reflection
    SettingsPage.tsx        profile, preferences, export, sign out
    LegalPage.tsx           public terms/privacy renderer
    Navigation.tsx          top nav tabs with greeting/avatar
    FluidBackground.tsx     animated canvas particles (reduced-motion aware)
    WeeksGrid.tsx           memoized 4000+ cell life grid
    AccordionSection.tsx    expandable section with measured height
    FeedbackPopup.tsx       timed in-app feedback (stars + freeform)
    dashboard/              lazy-loaded dashboard subsections
    ...                     shared UI: Tooltip, LifeBattery, ExactAgeTicker, etc.
  hooks/
    useAuth.ts              Supabase auth, recovery, sign-out (clears API key)
    useProfile.ts           profile CRUD with error handling and rollback
    useDiary.ts             diary CRUD, optimistic updates, offline queue
    useMood.ts              mood CRUD, optimistic updates, offline queue
    useLifeStats.ts         life calculations and 1-second dynamic counter
    useAppMode.ts           normal/focus mode toggle
    useTimeMirror.ts        Time Mirror AI flow
    useHoroscope.ts         Gemini horoscope helper
    useFamousBirthdays.ts   birthday insights helper
    useSpeechToText.ts      browser speech-to-text
  lib/
    supabase.ts             Supabase client (env-based)
    ai.ts                   Gemini helpers and BYOK key access
    offlineSync.ts          localStorage queue with race-safe flush
    storage.ts              photo/avatar upload/delete with ownership check
    exportData.ts           JSON export (excludes phone/avatarUrl)
    lifeData.ts             biology, cosmic, and number calculations
    generations.ts          generational identity lookup
    zodiac.ts               zodiac sign lookup
    onThisDay.ts            historical facts
    theme.ts                app mode helpers
public/
  favicon.ico
  manifest.json
  sw.js                    service worker (network-first, stale-while-revalidate)
```

Key config files:

- `vercel.json` SPA rewrite rules for direct route loads in production
- `tailwind.config.js` Tailwind theme with custom colors and animations
- `postcss.config.js` PostCSS with Tailwind and Autoprefixer
- `vite.config.ts` Vite config with React plugin and Rollup WASM alias

## Routes

- `/` dashboard
- `/grid` life grid
- `/diary` journal
- `/timemirror` Time Mirror
- `/settings` profile, preferences, export
- `/terms` public terms page
- `/privacy` public privacy page

Unauthenticated users are routed through `AuthGate`. Password recovery is handled in-app.

## Environment

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Gemini is BYOK. Users add their Gemini API key inside Settings and it is stored in their profile.

## Local Development

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

## Verification

Run the full local verification loop before shipping:

```bash
npm run typecheck
npm run test -- run
npm run build
```

## Deployment

The project is linked to Vercel via `.vercel/project.json`.

Important:

- `vercel.json` contains the SPA rewrite rule required for direct route loads like `/diary`, `/grid`, `/settings`, and `/timemirror`

Production deploy:

```bash
vercel deploy --prod
```

Recommended release flow:

```bash
npm run typecheck
npm run test -- run
npm run build
vercel deploy --prod
```

## Notes

- Supabase lives in a shared project and app tables are prefixed with `liw_`
- Legal pages are public and do not require authentication
- Journal and mood writes use an offline queue with race-safe flush to support temporary connectivity loss
- Export supports JSON life-data export from Settings (excludes phone number and avatar URL for privacy)
- The build toolchain intentionally avoids direct macOS-only native package declarations
- Runtime animation uses CSS/native transitions and a canvas particle background (respects `prefers-reduced-motion`)
- `framer-motion`, `@react-spring/web`, and `@use-gesture/react` are not used
- The Gemini API key is cleared from localStorage on sign-out
- Profile saves include error handling with rollback on critical fields
- The life grid pre-computes date labels and uses `React.memo` for 4000+ cells
- The service worker uses network-first for navigation and stale-while-revalidate for assets

## License

All rights reserved. © 2026 Life in Weeks.
