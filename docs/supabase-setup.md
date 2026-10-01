# Supabase Setup

## Create Project

Create a Supabase project and copy:

- Project URL to `VITE_SUPABASE_URL`
- anon or publishable browser key to `VITE_SUPABASE_ANON_KEY`

## Apply Schema

Use the Supabase CLI or dashboard SQL editor to apply:

```text
supabase/migrations/20260430120907_init_life_in_weeks_schema.sql
```

The migration creates the `liw_` tables, indexes, RLS policies, and `liw-photos` bucket.

## Auth Configuration

Configure:

- Email/password auth.
- Google OAuth only if Google sign-in should remain enabled.
- Site URL: production Vercel URL.
- Redirect URLs: production URL, preview URL pattern if used, and local dev URL.

## Storage Configuration

The current app uses public URLs for avatars and diary photos, so the baseline migration creates `liw-photos` as a public bucket with authenticated write/delete policies by user folder.

For stricter privacy, migrate later to:

1. private `liw-photos` bucket
2. stored object paths instead of public URLs
3. short-lived signed URLs generated after auth

Do not expose a service role key to the browser.

## Verification

Before production:

```bash
npm run typecheck
npm run test -- run
npm run build
```

Then verify live behavior:

- sign-up and email confirmation
- sign-in and sign-out
- profile bootstrap
- diary create/edit/delete
- mood save
- avatar upload
- diary photo upload/remove/delete
- JSON export
- legal pages while signed out
