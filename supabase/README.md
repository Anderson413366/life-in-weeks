# Supabase

This folder contains the reproducible backend package for Life in Weeks.

## Active Migration

```text
migrations/20260430120907_init_life_in_weeks_schema.sql
```

It creates the active `liw_` tables, constraints, indexes, RLS policies, and the `liw-photos` bucket expected by the app.

## Required Environment Variables

Frontend only:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in this Vite app.
