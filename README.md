# Life in Weeks

Life in Weeks is a React 19 + TypeScript + Vite personal reflection app. It visualizes a private life timeline as weeks, supports diary and mood tracking, adds optional Gemini BYOK reflection tools, and keeps export/privacy controls close to the user.

## Core Workflows

1. Sign in or create an account through Supabase Auth.
2. Complete profile setup with birthdate, preferred name, and life expectancy.
3. Use Home for mood check-ins and navigation.
4. Capture weekly reflections in Diary or from Life Grid.
5. Use Time Mirror and AI reflection only after adding a Gemini API key.
6. Export account data as JSON from Settings.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS plus shared product CSS
- Supabase Auth, Postgres, RLS, and Storage
- Gemini BYOK through `@google/genai`
- Vitest + Testing Library
- Playwright-based local browser verifier

## Routes

- `/` Home dashboard
- `/grid` Life Grid
- `/diary` Diary
- `/timemirror` Time Mirror
- `/settings` Settings
- `/terms` public legal page
- `/privacy` public legal page

Protected routes go through the authenticated shell. `/terms` and `/privacy` remain public.

## Environment

Required variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Copy `.env.example` to `.env` for local development. Do not put service role keys in this frontend app.

## Local Setup

```bash
npm install
npm run dev
```

Default dev URL:

```text
http://127.0.0.1:5173
```

## Verification

```bash
npm run typecheck
npm run test -- run
npm run build
```

Optional browser verification against a preview build:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
npm run verify:e2e -- --base-url=http://127.0.0.1:4173
```

## Deployment

Recommended production path:

- GitHub for source control
- Vercel for hosting
- Supabase for active auth/database/storage

Vercel settings:

- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Keep `vercel.json`; it preserves SPA direct-route behavior.

## Supabase

Supabase is required now. The baseline schema and RLS package is in:

```text
supabase/migrations/20260430120907_init_life_in_weeks_schema.sql
```

The app expects:

- `liw_profiles`
- `liw_diary_entries`
- `liw_mood_entries`
- `liw_feedback`
- `liw-photos`

## Privacy Notes

- Gemini is BYOK and optional.
- Gemini keys are excluded from JSON exports.
- Settings includes a control to clear local offline queues and cached AI helper data.
- Uploaded images use the configured Supabase storage bucket. The current app stores photo/avatar URLs for rendering; for stricter production privacy, migrate to a private bucket with signed URLs.

## Documentation

- [Architecture](docs/architecture.md)
- [Backend readiness](docs/backend-readiness.md)
- [Supabase setup](docs/supabase-setup.md)
- [Deployment guide](docs/deployment.md)
- [Environment variables](docs/environment-variables.md)
- [Production checklist](docs/production-checklist.md)
- [Project tree](docs/project-tree.md)
- [Feature map](docs/feature-map.md)
- [QC report](docs/qc-report.md)
