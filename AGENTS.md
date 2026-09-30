# Life in Weeks

React 19 + TypeScript + Vite + Supabase personal reflection app centered on a life-in-weeks visualization. Preserve its emotional tone (reflective, calm, low-friction), privacy model, and product identity. See [README.md](README.md) for product overview, routes, and deployment. Global rules live in `~/AI-Rules/RULES.md`. Code plus the newest docs beat stale notes; if docs conflict, verify in code and fix the stale doc.

## Product facts
- Authenticated Home, life grid, diary, mood tracking, Time Mirror, settings, JSON export, public legal pages, and a PWA shell (`/sw.js`, `/manifest.json`).
- React Router routes: `/`, `/grid`, `/diary`, `/timemirror`, `/settings`, `/terms`, `/privacy`. Unauthenticated users go through `AuthGate` (email/password, sign-up, Google OAuth, password reset, recovery password update).
- Single-user private workspace; no owner/admin/manager/team roles or invites.
- Supabase tables use the `liw_` prefix. Storage bucket `liw-photos` holds avatars and diary images.
- Gemini is BYOK: the user adds a key in-app, stored on the profile row. Keys are excluded from exports.
- Diary and mood must stay resilient during connection loss. Offline queues are scoped per user; legacy unscoped queue data is quarantined, never replayed into another account.
- Stored `YYYY-MM-DD` values are local calendar dates, not UTC midnight timestamps.
- Settings export includes the profile snapshot, phone, avatar URL, averages, diary entries, and mood history.
- Primary signed-in pages use route-local headings and collapsible `PageGuide` task maps, not a shared global page header.
- `/` is a working Home page (quick actions, current priorities, reflective deep dives). Settings separates identity, account access, optional AI tools, averages, experience preferences, backup/export, and support.
- Production alias: `https://life-in-weeks-seven-silk.vercel.app`. In-app contact: `support@lifeinweeks.app` and the GitHub Issues page.
- Auth verification emails are sent by Supabase project config, not repo code. As of 2026-04-03 sign-up emails arrive from `noreply@andersoncleaning.com` / `Anderson Cleaning`; fixing that branding is a Supabase email config change.

## Commands
```bash
npm install
npm run dev
npm run typecheck
npm run test -- run
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run verify:e2e -- --base-url=http://127.0.0.1:4173   # Playwright + disposable inbox
vercel deploy --prod --yes
```
`verify:e2e` covers public routes, auth confirmation, settings persistence, export, Home mood saves, grid/diary flows, Time Mirror upload gating, fallback routing, sign-out. Before closing a substantial task run typecheck, tests, and build.

## Technical constraints
- Required env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The app must fail fast if either is missing; never add runtime fallback credentials.
- Do not reintroduce `framer-motion`, `@react-spring/web`, or `@use-gesture/react` into the live app path without an exceptional, documented reason.
- No direct platform-specific packages in `package.json`. Prefer existing React, TypeScript, Tailwind, CSS/native transition, and Supabase patterns.
- Do not remove or casually change the Vercel SPA rewrite in `vercel.json` (production direct routes depend on it).
- Keep the auth page a centered card, not a stretched full-width form. Legal pages stay public.
- Gemini keys: never expose, log, hardcode, or duplicate. Diary, mood, profile, uploads, and exports are sensitive. Be conservative around auth, reset, recovery, storage, and public pages.
- Focus Mode stays visually quiet, high-contrast, sensory-friendly. Favor keyboard support, visible focus, semantic structure, reduced motion; watch mobile overflow, modal traps, low contrast, noisy animation.
- Do not add dependencies unless the benefit is substantial and explained. Document any migration, env, or dashboard change needed.

## Audit priorities (inspect during broad analysis)
1. Routing, route protection, recovery flows
2. Auth session handling and profile bootstrapping
3. Life/week calculations and date math
4. Diary and mood optimistic updates, offline queueing, sync recovery
5. Supabase reads/writes/storage usage and error handling
6. Gemini BYOK handling, privacy boundaries, failure states
7. Settings/profile/export behavior
8. Public legal pages and unauthenticated access
9. Accessibility, Focus Mode, keyboard, reduced motion, contrast
10. Performance, bundle hygiene, render churn, expensive calculations
11. PWA / manifest / service worker
12. Type safety, test quality, release readiness

## Working method
Explore, plan, implement the smallest safe change, verify. Never claim a bug without file evidence; label findings Confirmed / Likely / Infra-dependent. For each bug give files, why, severity, fix, verification. Audit reports use: inspected, confirmed findings, top risks, fix plan, changes made, verification, remaining risks.

Specialist subagents (Claude): `repo-cartographer` (repo map), `security-privacy-reviewer` (auth, uploads, public surface), `supabase-integrity-auditor` (data flow, offline sync, export), `ui-performance-optimizer` (UX, a11y, PWA), `test-reliability-guardian` (typecheck/tests/build), `remediation-engineer` (focused fixes).

## Triage hints
- Routing or auth breaks: `src/App.tsx`, `src/modules/auth/ui/components/AuthGate.tsx`, public legal route handling.
- Deploy breaks: verify env vars, re-run local build.
- Offline flows break: hooks and helpers for diary, mood, offline sync (`src/modules/diary`, `src/modules/mood`).
- UI polish regresses: route-local headings, `src/shared/ui/components/PageGuide.tsx`, `src/shared/ui/shell/Navigation.tsx`, `Footer.tsx`, shared UI, global CSS, route transitions, before rewriting components.

## Done means
Actual issue summarized, fix explained, verified as far as the environment allows, remaining uncertainty listed honestly.

## Current status
Working tree has an in-progress move of `src/components`, `src/hooks`, `src/lib` into `src/modules/*` and `src/shared/*` (uncommitted); paths above follow the new layout.

## 📚 Reference (read only when working on that area)
- `README.md`; `docs/architecture.md`, `docs/feature-map.md`, `docs/deployment.md`, `docs/environment-variables.md`, `docs/supabase-setup.md`, `docs/production-checklist.md`, `docs/local-setup.md`
