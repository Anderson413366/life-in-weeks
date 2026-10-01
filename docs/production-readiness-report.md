# Life in Weeks Production Readiness Report

Date: 2026-04-30

## A. Executive Summary

Life in Weeks is an authenticated personal reflection app with a life-in-weeks grid, diary, mood tracking, Time Mirror AI features, settings/export, public legal pages, and a PWA shell.

The app is a React 19 + TypeScript + Vite SPA backed by active Supabase Auth, Postgres tables, and Supabase Storage. Vercel remains the recommended hosting path because the app is a browser SPA with an existing direct-route rewrite in `vercel.json`.

Main blockers fixed:

- Reintroduced a commit-ready lockfile by removing the stale `package-lock.json` ignore rule.
- Added a repo-level `.npmrc` so native optional packages install for the current machine instead of inheriting user-level `os=linux`.
- Fixed dependency audit findings through a clean lockfile refresh.
- Added a reproducible Supabase baseline migration with RLS policies and storage bucket policy definitions.
- Hardened upload validation, offline replay, local data clearing, PWA registration, modal accessibility, Focus Mode motion behavior, and privacy disclosure.
- Removed generated/local-only folders from the workspace.

Main blockers remaining:

- Live Supabase project migration history must be reconciled before applying the new baseline to an existing production project.
- Vercel environment variables and Supabase Auth redirect URLs must be configured manually.
- Existing public media URL behavior should be accepted explicitly or upgraded to private signed URLs before broad sensitive use.

Recommended deployment path: GitHub repository + Vercel SPA hosting + active Supabase backend.

Recommended backend posture: active Supabase now, with documented future paths for stricter storage privacy, monitoring, analytics, and possible payments/CMS only if product scope expands.

## B. Current Stack

| Area | Current |
| --- | --- |
| Framework | React 19 SPA |
| Language | TypeScript |
| Build tool | Vite |
| Package manager | npm with `package-lock.json` |
| Styling | Tailwind CSS plus global app CSS |
| Routing | React Router |
| Backend | Supabase client-side BaaS |
| Database | Supabase Postgres, `liw_` tables |
| Authentication | Supabase Auth |
| Storage | Supabase Storage `liw-photos` bucket |
| AI API | Google Gemini BYOK through `@google/genai` |
| Hosting assumption | Vercel static SPA output with `vercel.json` rewrite |
| Production concern | Live Supabase migration/auth/storage settings still require manual verification |

## C. Recommended Production Stack

| Layer | Recommended Tool | Status | Why | Alternatives Considered |
| --- | --- | --- | --- | --- |
| Hosting | Vercel | Active | Best fit for Vite SPA, GitHub import, preview deployments, existing rewrite | Netlify, Cloudflare Pages |
| Frontend framework | React + TypeScript + Vite | Active | Current app is already working and deployable here | Next.js not justified for current SPA |
| Backend | Supabase | Active | Auth, private records, storage, RLS, simple operational model | Firebase, Convex, custom backend |
| Database | Supabase Postgres | Active | Relational user profile, diary, mood, feedback records | Neon + custom auth |
| Authentication | Supabase Auth | Active | Already wired and fits current backend | Clerk if org/team UX becomes central |
| Storage | Supabase Storage | Active | Already used for avatars and diary photos | UploadThing, S3/R2 |
| Email | Supabase Auth email | Active for auth only | Password reset/confirmation are Supabase-managed | Resend/Postmark for app email later |
| Forms | React state + Supabase writes | Active | Current forms are app workflows, not marketing lead forms | React Hook Form/Zod later for larger forms |
| Payments | Stripe | Prepared for Future Use | Only if subscriptions or paid features launch | Lemon Squeezy |
| Analytics | Vercel Analytics or PostHog | Prepared for Future Use | Useful after launch, not required for core function | Plausible, GA |
| Error monitoring | Sentry | Prepared for Future Use | Recommended before serious public launch | Better Stack, Axiom |
| CMS | Not needed now | Future only | Content is limited and developer-controlled | Sanity, MDX |
| AI tooling | Gemini BYOK | Active | Current app supports user-owned Gemini keys | Vercel AI SDK if server-side AI is introduced |

## D. Backend and Supabase Status

Backend Status: Required Now

Supabase Status: Required Now

Current Need:
The app requires auth, persisted profile rows, diary entries, mood history, feedback rows, uploads, RLS, and Supabase Auth recovery flows. It is not frontend-only.

Future Readiness:
The repo now contains baseline Supabase migration documentation, environment variable documentation, deployment documentation, and explicit backend-readiness guidance. The structure keeps Supabase integration isolated under shared integrations and domain modules so future admin, portal, storage, analytics, or server-side AI work can be added without a full rebuild.

Recommendation:
Use Vercel + active Supabase for production. Apply or reconcile the Supabase schema intentionally before launch, and decide whether public media URLs remain acceptable or should move to private signed URLs.

## E. Production Readiness Score

| Area | Score | Notes |
| --- | ---: | --- |
| Code organization | 8 | Module/shared structure is much clearer; worktree still has large tracked deletions from the old layout. |
| Build readiness | 9 | Typecheck, tests, install dry-run, audit, and build pass. |
| GitHub readiness | 8 | Ignore rules and lockfile are fixed; commit should include new module tree and old deletions together. |
| Hosting readiness | 9 | Vercel rewrite preserved and build output is clean. |
| Backend readiness | 7 | Active Supabase migration exists; live history reconciliation remains manual. |
| Database readiness | 7 | Baseline tables/RLS/indexes are documented; remote schema not verified here. |
| Future Supabase readiness | 8 | Strong structure and docs now exist. |
| Security | 7 | No tracked secrets found; BYOK plaintext/profile storage and public photo URLs remain design risks. |
| Environment variables | 9 | `.env.example` and docs are aligned. |
| Error handling | 8 | Upload/offline errors improved; full E2E still recommended. |
| Authentication | 8 | Supabase Auth remains active; redirect/sender config must be verified live. |
| Testing | 8 | Unit/integration suite passes; browser E2E script exists but was not run in this pass. |
| Documentation | 9 | README and deployment/backend docs are now production-focused. |
| Maintainability | 8 | Domain modules and shared utilities are clearer. |
| UI/UX readiness | 8 | Focus Mode, modals, settings, privacy copy improved. |
| Accessibility | 8 | Modal semantics and reduced-motion behavior improved; full keyboard browser QA still recommended. |

## F. Deployment Recommendation

Recommended option: Vercel + Supabase active.

Deploy after minor manual setup: connect GitHub to Vercel, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, reconcile/apply Supabase migrations, configure Supabase Auth URLs, and verify production flows.

## G. Current vs Future Architecture

| Layer | Needed Now? | Prepared for Future? | Recommendation |
| --- | --- | --- | --- |
| Backend | Yes | Yes | Keep Supabase active. |
| Database | Yes | Yes | Use `liw_` Postgres tables with RLS. |
| Authentication | Yes | Yes | Keep Supabase Auth; consider Clerk only if teams/orgs become central. |
| File storage | Yes | Yes | Use Supabase Storage; consider signed URLs for stricter privacy. |
| Admin dashboard | No | Yes | Add only when support/admin workflows exist. |
| Customer portal | No | Yes | Current app is personal workspace, not portal. |
| Employee portal | No | Yes | Not current scope. |
| Payments | No | Yes | Add Stripe only for paid plans. |
| AI features | Yes | Yes | Keep BYOK Gemini; server-side AI later if privacy model changes. |
| CMS | No | Yes | Add only if non-developers must edit legal/content pages. |

## H. Blockers

Critical Blockers:

- None in the local code/build path after this pass.

Important Blockers:

- Existing Supabase project migration history must be reconciled before pushing the new baseline migration to production.
- Supabase Auth redirect URLs, email sender branding, and storage policies need live verification.
- Public media URL behavior should be accepted explicitly or changed to private signed URLs.

Nice-to-Have Improvements:

- Run `npm run verify:e2e` against a preview deployment with a disposable inbox.
- Add Sentry and Vercel Analytics or PostHog before public launch.
- Add stricter schema validation for larger future forms.

Future-Readiness Gaps:

- No admin/support role model yet.
- No server-side AI proxy yet; Gemini remains BYOK from the browser.
- No payments, CMS, or product analytics yet.

## I. Security Risks

| Risk | Status |
| --- | --- |
| Exposed secrets | No tracked API keys found by grep scan; `.env` remains ignored. |
| Unsafe auth | Auth is active; live redirect/sender configuration still needs verification. |
| Weak database permissions | Migration adds RLS policies; existing remote RLS not verified here. |
| Missing validation | Image MIME/size validation added for uploads. |
| Public admin access | No admin routes found. |
| Unsafe file uploads | File type/size checks added; storage remains public URL based. |
| Sensitive data exposure | Diary/mood/profile data are sensitive; public photo URLs and BYOK storage remain design risks. |
| Dependency risks | `npm audit --audit-level=high` now reports 0 vulnerabilities. |
| Production logging risks | Runtime `console.*` calls removed from `src`. |
| Environment controls | `.env.example`, `.gitignore`, and docs now align. |

## J. What Was Changed

| File or Area | Change Made | Reason |
| --- | --- | --- |
| `.gitignore` | Fixed lockfile handling; ignored generated/local/Supabase temp files. | GitHub hygiene. |
| `.npmrc` | Added repo override for user-level `os=linux`. | Correct native package installs. |
| `.env.example` | Clarified active Supabase browser env vars and server-key warning. | Safer setup. |
| `package-lock.json` | Regenerated and made commit-ready. | Reproducible installs and audit fix. |
| `README.md` | Rewritten for product, setup, deploy, and backend handoff. | Developer onboarding. |
| `docs/*` | Added/updated deployment, backend, Supabase, env, checklist, architecture docs. | Production handoff. |
| `supabase/*` | Added README and baseline migration. | Active backend reproducibility. |
| `scripts/generate-icons.mjs` + `public/icons/*` | Generated real PNG/ICO assets from SVG source. | PWA/browser readiness. |
| `src/App.tsx`, `vite.config.ts` | Removed route-splitting warning by using concrete lazy imports and no stale manual chunk. | Bundle hygiene. |
| `src/shared/lib/fileValidation.ts`, `src/shared/lib/storage.ts` | Added image MIME/size validation and safer upload extension handling. | Upload safety. |
| `src/shared/lib/offlineSync.ts`, diary/mood services/hooks/tests | Coalesced queued operations before replay and added regression coverage. | Offline data correctness. |
| `src/modules/profile/ui/pages/SettingsPage.tsx` | Avoided Gemini key prefill, added key removal and local data clearing. | Privacy and account control. |
| `src/modules/diary/ui/components/DiaryModal.tsx` | Added upload validation, offline upload messaging, cleanup on failure, AI disclosure. | Privacy and resilience. |
| `src/modules/legal/repository/queries.ts` | Expanded privacy disclosures. | Accurate legal copy. |
| `src/index.tsx`, `public/sw.js` | Limited service worker registration to production and safer cache writes. | QA and PWA reliability. |
| `src/index.css`, feedback/legacy modal components | Improved Focus Mode motion reduction and modal accessibility. | Accessibility. |
| Removed local folders | `dist`, `.vercel`, `.claude`, `.vscode`, `screenshot`, `__Archive`, `.agents`, `node_modules`, `supabase/.temp`. | Cleanup/GitHub readiness. |

## Completion Appendix

### Files Changed

Material changed groups: root config/docs (`.gitignore`, `.npmrc`, `.env.example`, `README.md`, `CLAUDE.md`, `package.json`, `package-lock.json`, `vercel.json` preserved), `docs/**`, `supabase/**`, `public/icons/**`, `public/sw.js`, `scripts/**`, `src/App.tsx`, `src/App.test.tsx`, `src/index.*`, `src/setupTests.ts`, `src/modules/**`, `src/shared/**`, `src/types/**`.

### Cleanup Summary

| Category | Result |
| --- | --- |
| Unused files removed | Legacy root component/hook/lib paths removed from active architecture. |
| Unused folders removed | Generated/local-only folders removed. |
| Duplicate code removed | Old root-level component/hook/lib implementation replaced by module/shared layout. |
| Unused assets removed | Stale generated output folders removed; app icons regenerated. |
| Unused dependencies removed | No declared dependency removed; vulnerable transitive versions fixed by lock refresh. |
| Config files cleaned | `.gitignore`, `.npmrc`, `.env.example`, Vite chunk config. |
| Folder structure improved | Domain modules plus shared UI/lib/integrations. |
| Build verified after cleanup | Yes: typecheck, tests, audit, install dry-run, build passed. |

### Deleted Files and Folders

| Deleted Item | Reason Deleted | Verification Method |
| --- | --- | --- |
| `dist/` | Generated build output. | Rebuilt successfully, then removed. |
| `.vercel/` | Local deployment metadata. | Not needed for source control. |
| `.claude/` | Local agent metadata/archive. | Not referenced by app. |
| `.vscode/` | Local editor config. | Not needed for deployment. |
| `screenshot/` | Local QA artifacts. | Not referenced by app. |
| `__Archive/` | Obsolete archive folder. | Not referenced by app. |
| `.agents/` | Local agent skill metadata. | Not app runtime. |
| `node_modules/` | Generated dependency install. | Reinstall verified with `npm ci --dry-run`. |
| `supabase/.temp/` | Supabase CLI temp metadata. | Ignored and removed. |

### Moved or Renamed Files

| Old Path | New Path | Reason |
| --- | --- | --- |
| `ARCHITECTURE.md` | `docs/architecture.md` | Centralize docs. |
| `FEATURE_MAP.md` | `docs/feature-map.md` | Centralize docs. |
| `LOCAL_SETUP.md` | `docs/local-setup.md` | Centralize docs. |
| `PROJECT_TREE.md` | `docs/project-tree.md` | Centralize docs. |
| `QC_REPORT.md` | `docs/qc-report.md` | Centralize docs. |
| `UI_UX_AUDIT.md` | `docs/ui-ux-audit.md` | Centralize docs. |
| `CHANGELOG_LOCAL.md` | `docs/changelog-local.md` | Centralize docs. |

### Environment Variables Needed

Active Public Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Active Private Server Variables:

- None in this Vite frontend repo.

Future-Ready Public Variables:

- None added.

Future-Ready Private Server Variables:

- `SUPABASE_SERVICE_ROLE_KEY` only if a trusted server runtime is added later. Never expose it to Vite/browser code.

### Commands Run

Primary commands run:

- `git status --short --ignored`
- `rg`, `find`, `sed`, `git diff`, `git grep`, `git check-ignore`
- `supabase --version`
- `supabase migration new init_life_in_weeks_schema`
- `supabase migration list --local`
- `node scripts/generate-icons.mjs`
- `file public/icons/*.png public/favicon.ico`
- `npm audit --audit-level=high`
- `npm audit fix --ignore-scripts`
- `npm install --ignore-scripts`
- `npm run typecheck`
- `npm run test -- run`
- `npm run build`
- `npm ci --dry-run --ignore-scripts`
- `rm -rf dist node_modules supabase/.temp`

### Human Setup Still Required

- Create or connect the GitHub repository.
- Import the repo into Vercel.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel.
- Reconcile the existing Supabase migration history before applying the new migration to a live project.
- Configure Supabase Auth site URL, redirect URLs, and email sender branding.
- Decide whether public photo URLs are acceptable or switch to private signed URLs.
- Run browser E2E against a preview deployment.
- Configure domain, analytics, and monitoring when ready.

### Plain-English Owner Summary

GitHub will hold the code. Vercel should host the React app. Supabase is active in this version because the app already uses login, saved profile data, diary entries, mood entries, feedback, and image uploads. The repo now has a cleaner backend path, reproducible Supabase schema, safer environment docs, cleaner install behavior, and passing local verification. The app is close to deployable, but the live Supabase project still needs manual migration/auth/storage verification before calling production fully ready.

### Final Recommendation

Deploy after minor fixes.

The codebase is Vercel-ready and Supabase-ready locally. Do not treat it as fully production-ready until the Supabase migration history and live auth/storage settings are verified.
