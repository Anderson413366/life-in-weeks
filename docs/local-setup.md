# Local Setup

## Requirements

- Node.js compatible with the current Vite toolchain
- npm
- A Supabase project with working auth and the expected `liw_` tables

## Environment

Create `.env` with:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app fails fast if either value is missing.

## Install

```bash
npm install
```

## Run In Dev Mode

```bash
npm run dev
```

Vite normally serves on `http://127.0.0.1:5173`.

## Run Local Verification Against A Built App

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run verify:e2e -- --base-url=http://127.0.0.1:4173
```

If `4173` is busy, use the actual printed preview URL.

## Baseline Checks

```bash
npm run typecheck
npm run test -- run
npm run build
```

## Suggested Manual Checks

- Signed-out `/`, `/terms`, `/privacy`
- Signed-in `/`, `/grid`, `/diary`, `/timemirror`, `/settings`
- Mood save
- Diary create, edit, photo add, photo remove, delete
- Settings profile save, averages save, avatar upload, export
- Time Mirror no-key gating
- Mobile shell and footer at `390x844`
