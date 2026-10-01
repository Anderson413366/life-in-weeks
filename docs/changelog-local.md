# Local Changelog

## Production Readiness Pass

- Moved supporting documentation into `docs/`.
- Removed generated/local-only output folders from the active tree.
- Added deployment, environment, production checklist, backend readiness, and Supabase setup docs.
- Added a reproducible Supabase baseline migration for active `liw_` tables, RLS policies, and the `liw-photos` bucket.
- Fixed PWA icon generation so `.png` and `.ico` files are real bitmap/icon assets.
- Kept `package-lock.json` commit-eligible for reproducible npm installs.
- Hardened image upload validation for avatars, diary photos, and Time Mirror portraits.
- Coalesced offline diary and mood queues before replay so stale superseded operations do not overwrite newer intent.
- Added local device data clearing for offline queues and cached AI helper data.
- Updated privacy copy for local sensitive storage and Gemini processing.
- Preserved public legal routes and Vercel SPA rewrite behavior.
