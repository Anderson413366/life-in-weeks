# Environment Variables

## Active Public Variables

These are required now and are exposed to the browser by Vite:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

The anon key is public-safe only when RLS and storage policies are correct.

## Active Private Server Variables

None. This app has no server runtime today.

## Do Not Add To Vite

Do not add these to `.env`, Vercel frontend variables, or any `VITE_` variable:

```bash
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GEMINI_API_KEY=
```

Gemini is BYOK in-app. Users add their own key in Settings.
