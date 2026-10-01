# Architecture

Life in Weeks is a React 19 + TypeScript + Vite single-page app with active Supabase auth, database, and storage. The product is a private, single-user reflection workspace, not a team or admin system.

## Runtime Flow

1. `src/index.tsx` mounts `BrowserRouter` and registers the service worker only in production.
2. `src/App.tsx` keeps `/terms` and `/privacy` public before auth checks.
3. `useAuth` resolves Supabase session and recovery callbacks.
4. `useProfile`, `useDiary`, and `useMood` load per-user Supabase data.
5. Offline diary and mood queues are merged into the view and coalesced before replay.
6. Signed-in routes render inside the shared shell with `Navigation`, route content, `Footer`, and optional feedback.

## Source Layout

- `src/modules/auth` - Supabase auth, callback recovery, `AuthGate`.
- `src/modules/profile` - profile settings, averages, avatar upload, Gemini key persistence, JSON export.
- `src/modules/diary` - weekly diary surfaces, modal editing, voice input, photo uploads, offline queue.
- `src/modules/mood` - mood check-ins and offline queue.
- `src/modules/life` - dashboard, life grid, date math, snapshot, on-this-day, zodiac panels.
- `src/modules/ai` - Gemini BYOK helpers and Time Mirror.
- `src/modules/legal` - public terms and privacy content.
- `src/shared` - Supabase client, date/storage/offline/file helpers, shared UI, and shell.

## Backend Contract

Supabase is required now. The app expects:

- `liw_profiles`
- `liw_diary_entries`
- `liw_mood_entries`
- `liw_feedback`
- `liw-photos` storage bucket

The baseline schema, constraints, RLS policies, and storage bucket policy are captured in `supabase/migrations/20260430120907_init_life_in_weeks_schema.sql`.

## Deployment Contract

- Vercel is the recommended host.
- `vercel.json` must keep the SPA rewrite for direct route loads.
- Required env vars are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- No service role key belongs in this frontend app.

## Privacy Boundaries

Diary text, mood notes, profile fields, photos, exports, and Gemini keys are sensitive. Gemini is bring-your-own-key and optional, but AI actions can send selected journal text, portrait images, or birth/life-stage context to Gemini from the browser.
