See [README.md](README.md) for the product overview, routes, commands, and deployment notes.

# Life in Weeks — Claude Code Operating Instructions

## Mission
You are working on **Life in Weeks**, a React 19 + TypeScript + Vite + Supabase personal reflection app centered on a life-in-weeks visualization.
Your job is to **analyze deeply, audit aggressively, fix carefully, and optimize meaningfully** while preserving the app’s emotional tone, privacy model, and product identity.

## Current product realities
- Authenticated dashboard, life grid, diary, mood tracking, Time Mirror, settings, JSON export, and public legal pages exist.
- The app uses React Router routes for `/`, `/grid`, `/diary`, `/timemirror`, `/settings`, `/terms`, and `/privacy`.
- If unauthenticated, users go through `AuthGate`.
- Supabase tables use the `liw_` prefix.
- Storage uses the `liw-photos` bucket for avatars and diary images.
- Gemini is BYOK. Users add their Gemini API key in-app, and it is stored on the profile row.
- Diary and mood workflows must remain resilient during temporary connection loss.
- Focus Mode must remain low-noise, high-contrast, and accessible.
- Legal pages must remain public.
- Production depends on the SPA rewrite rule in `vercel.json`.

## Source-of-truth rule
Prefer the **current repo code plus the current README / CLAUDE.md** over stale notes, comments, or older docs.
If you discover conflicting documentation:
1. Identify the conflict explicitly.
2. Verify the real behavior in code.
3. Treat code plus the newest project docs as canonical.
4. If needed, update stale docs as part of the fix.

## Critical technical constraints
- Required env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Do **not** reintroduce `framer-motion`, `@react-spring/web`, or `@use-gesture/react` into the live app path unless there is an exceptional, documented reason.
- Avoid direct platform-specific packages in `package.json`.
- Prefer existing React, TypeScript, Tailwind, CSS/native transition, and Supabase patterns already in the repo.
- Preserve direct-route production behavior. Do not remove or casually change the Vercel SPA rewrite.
- Keep the auth page intentionally constrained to a centered card, not a stretched full-width auth form.

## Audit priorities
Always inspect these areas during broad analysis:
1. Routing, route protection, and recovery flows
2. Auth session handling and profile bootstrapping
3. Life/week calculations and date math
4. Diary and mood optimistic updates, offline queueing, and sync recovery
5. Supabase reads/writes/storage usage and error handling
6. Gemini BYOK handling, privacy boundaries, and failure states
7. Settings/profile/export behavior
8. Public legal pages and unauthenticated access
9. Accessibility, Focus Mode, keyboard behavior, reduced motion, contrast
10. Performance, bundle hygiene, render churn, and expensive calculations
11. PWA / manifest / service worker behavior
12. Type safety, test quality, and release readiness

## Operating procedure
For any non-trivial task, follow this order:
1. **Explore first**
   - Read the relevant files.
   - Build a grounded architecture map.
   - Use specialist subagents for investigation to keep context clean.
2. **Plan second**
   - Produce a concrete plan before large or multi-file edits.
   - Separate confirmed issues from hypotheses.
   - Prioritize highest-risk or highest-value fixes first.
3. **Implement third**
   - Make the smallest safe set of changes.
   - Preserve existing product feel unless improvement is part of the goal.
   - Avoid unrelated refactors.
4. **Verify fourth**
   - Run targeted verification after each fix batch.
   - Before closing a substantial task, prefer:
     - `npm run typecheck`
     - `npm run test -- run`
     - `npm run build`
   - If something cannot be verified, state the exact blocker and what remains uncertain.

## Grounding rules
- Never speculate about code you have not opened.
- Never claim an issue exists without file evidence, command output, or both.
- Distinguish:
  - **Confirmed issue**
  - **Likely issue**
  - **Infra-dependent / cannot verify from repo alone**
- When you mention a bug, include:
  - affected file(s)
  - why it is a problem
  - severity
  - recommended fix
  - verification method

## Change rules
- Change only files relevant to the current batch.
- Preserve existing naming conventions unless there is a strong consistency reason to change them.
- Favor readability and maintainability over cleverness.
- Do not add dependencies unless the benefit is substantial and you explain why existing tools are insufficient.
- Keep temporary debugging code out of final changes.
- If a migration, env change, or dashboard setting is required, document it clearly.

## Privacy and safety rules
- Never expose, log, hardcode, or casually duplicate user Gemini API keys.
- Treat diary text, mood data, profile data, uploads, and exported data as sensitive user content.
- Audit storage and upload flows for unsafe assumptions.
- Be conservative around auth, reset, recovery, storage, and public-page behavior.

## UX and accessibility rules
- Preserve the emotional tone of the app: reflective, calm, low-friction.
- Focus Mode must stay visually quiet, high-contrast, and sensory-friendly.
- Favor keyboard support, visible focus states, semantic structure, and reduced-motion compatibility.
- Watch for mobile overflow, modal traps, low contrast, noisy animation, and dense layouts.

## Output contract
When auditing, respond with this shape:
1. **What you inspected**
2. **Confirmed findings**
3. **Top risks by priority**
4. **Fix plan**
5. **Changes made**
6. **Verification results**
7. **Remaining risks / next best improvements**

When implementing, keep status updates concise and evidence-based.

## Preferred subagent usage
Use specialist subagents aggressively:
- `repo-cartographer` for repo mapping and dependency tracing
- `security-privacy-reviewer` for auth, privacy, uploads, and public-surface risk
- `supabase-integrity-auditor` for data flow, offline sync, and export correctness
- `ui-performance-optimizer` for UX, accessibility, render efficiency, and PWA behavior
- `test-reliability-guardian` for typecheck, tests, build, and regression analysis
- `remediation-engineer` for focused implementation work

## Common commands
- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run test -- run`
- `npm run build`
- `vercel deploy --prod`

## Triage hints
- If routing or auth breaks, inspect `App.tsx`, `AuthGate.tsx`, and public legal route handling first.
- If deploy breaks, verify env vars and re-run local build.
- If offline flows break, inspect hooks and helpers around diary, mood, and offline sync first.
- If UI polish regresses, inspect page shells, shared UI, global CSS, and route transitions before rewriting components.

## Definition of done
Do not declare a task finished until you have:
- summarized the actual issue(s)
- explained the fix
- verified the change as far as the repo/environment allows
- listed any remaining uncertainty honestly
