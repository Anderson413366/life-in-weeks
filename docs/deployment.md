# Deployment Guide

## Recommended Stack

- GitHub for source control.
- Vercel for hosting.
- Supabase for active backend, auth, database, and storage.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## GitHub Setup

Recommended repository name: `life-in-weeks`.

Commit source, docs, public assets, `package-lock.json`, `vercel.json`, and `supabase/migrations`.

Never commit:

- `.env`
- `.env.local`
- `.env.production`
- `.vercel/`
- `dist/`
- `node_modules/`
- Playwright screenshots/output

## Vercel Setup

- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Keep `vercel.json`; it preserves SPA direct-route loading.

## Post-Deploy Verification

Verify:

- `/terms` and `/privacy` load while signed out.
- Protected routes show auth when signed out.
- Sign-up confirmation and password recovery redirects work.
- Signed-in `/`, `/grid`, `/diary`, `/timemirror`, `/settings` load.
- Mood, diary, profile, avatar/photo uploads, and export work.
- Direct route refresh works on every route.
- Browser console has no secret-bearing errors.
