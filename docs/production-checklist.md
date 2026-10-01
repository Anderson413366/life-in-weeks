# Production Checklist

## Code

- `npm run typecheck`
- `npm run test -- run`
- `npm run build`
- No `framer-motion`, `@react-spring/web`, or `@use-gesture/react` in runtime dependencies.
- `package-lock.json` committed for reproducible npm installs.

## Supabase

- Baseline migration applied.
- RLS enabled and verified on all `liw_` tables.
- `liw-photos` bucket exists.
- Storage write/delete policies restrict users to their own folder.
- Auth redirect URLs include local and production URLs.
- Google OAuth configured or Google button removed before launch.

## Vercel

- `VITE_SUPABASE_URL` set.
- `VITE_SUPABASE_ANON_KEY` set.
- `vercel.json` SPA rewrite present.
- Production URL verified after deploy.

## Privacy

- Gemini key is never exported.
- Users are told AI actions can send selected content to Gemini.
- Users can clear local offline queues and cached AI helper data.
- Public-photo URL strategy is accepted, or private signed URLs are implemented before public launch.

## Browser QA

- Desktop and mobile route sweep.
- Keyboard navigation through auth, settings, diary modal, and feedback modal.
- Focus Mode checked for low motion and high contrast.
- Offline diary/mood queue behavior checked.
