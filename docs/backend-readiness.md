# Backend Readiness

Backend Status: Required Now

Supabase Status: Required Now

## Current Need

Life in Weeks already requires Supabase for auth, profile data, diary entries, mood entries, feedback, and photo/avatar storage.

## Active Supabase Surfaces

- Auth: email/password, Google OAuth, password reset, recovery password updates.
- Database: `liw_profiles`, `liw_diary_entries`, `liw_mood_entries`, `liw_feedback`.
- Storage: `liw-photos` for avatars and diary photos.
- Client: browser Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Reproducibility

The baseline schema and RLS policy package is now in:

```text
supabase/migrations/20260430120907_init_life_in_weeks_schema.sql
```

Apply this to a new Supabase project before connecting production.

## Security Posture

The app now validates image MIME types and size before upload, coalesces offline queues before replay, and documents local sensitive storage. Remaining production security depends on live Supabase configuration:

- RLS must be enabled on every `liw_` table.
- Storage policies must restrict writes/deletes to user-owned paths.
- The current app stores public photo URLs for compatibility. For stricter privacy, migrate to a private bucket and signed URLs before public launch with sensitive images.

## Future Backend Growth

If this becomes a multi-user product, add server-side boundaries before adding roles:

1. Move Gemini key usage to an Edge Function or serverless function.
2. Move private photo reads to signed URL generation.
3. Add account deletion/export workflows.
4. Add audit logs only if admin or support roles are introduced.
