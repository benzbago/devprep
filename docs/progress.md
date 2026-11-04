# DevPrep AI Progress

## Current status

Phase 1 is complete. Phase 2 implementation and local database/authenticated persistence verification are complete. No hosted service was provisioned, no payment method was added, and nothing was pushed or deployed.

## Phase 1 delivered

- Strict React, TypeScript, and Vite foundation.
- Tailwind dark-first responsive visual system and Lucide icons.
- Accessible application shell with skip link, landmarks, keyboard focus, and mobile navigation.
- Landing, predefined tutor demo, sample dashboard, and not-found pages.
- Direct curated challenge pages with explicit unknown-challenge handling.
- Two curated JavaScript challenges, selectable predefined questions, and three progressive hints per challenge.
- Explicit unsupported-question response explaining that live AI is unavailable.
- Vitest/React Testing Library component coverage and Playwright desktop/mobile smoke coverage.
- GitHub Actions verification workflow using a standard Ubuntu runner and no stored artifacts.
- Setup, architecture, security, planning, and progress documentation.

## Phase 2 implemented and verified locally

- Optional email/password authentication with explicit loading, signed-out, expired-session, error, and unconfigured states.
- Direct owner-scoped draft CRUD through the Supabase client, protected by exact grants and operation-specific RLS.
- Zod and PostgreSQL constraints for challenge IDs, titles, and code size.
- Private state clearing and request-generation guards so late requests from a previous account cannot repopulate the UI.
- Permanent “Not executed or verified” labels on draft surfaces.
- Versioned migration, pgTAP ownership tests, and a local-Supabase authenticated Playwright persistence test.
- Local Mailpit, environment, hosted-email limitation, and data-deletion documentation.
- A separate CI job that starts local Supabase without hosted credentials.

## Verification record

Final boundary checks run on 2026-11-04:

- `npm run format:check`: passed; all matched files use Prettier formatting.
- `npm run lint`: passed with zero warnings or errors.
- `npm run typecheck`: passed with no TypeScript diagnostics.
- `npm run test:run`: passed; 4 files and 19 component tests.
- `npm run build`: passed; Vite transformed 2,066 modules and emitted the production bundle.
- `npm run test:e2e`: passed; 12 tests across desktop and mobile Chromium in 4.0 seconds.
- `npm audit --omit=dev`: passed with 0 production vulnerabilities.

During final verification, Vitest initially discovered the Playwright spec because both tools use `*.spec.ts` conventions. `vite.config.ts` now limits Vitest to `src/**/*.test.{ts,tsx}`; the component and browser suites both passed afterward.

A fresh code review found that the original implementation exposed challenge content only inside the tutor even though the approved criteria required direct challenge routes. `/challenges/:challengeId`, valid/invalid route tests, full predefined-question mapping tests, and challenge-switch reset coverage were added. A mobile keyboard E2E hang found during the fix was corrected by exercising the visible mobile navigation rather than the hidden desktop navigation.

Phase 2 checks run before Docker became available on 2026-11-04:

- `npm run format:check`: passed.
- `npm run lint`: passed with zero warnings or errors after correcting async-handler and account-remount findings.
- `npm run typecheck`: passed with no TypeScript diagnostics.
- `npm run test:run`: passed after final review; 10 files and 35 tests.
- `npm run build`: passed; Vite transformed 2,213 modules. It emitted a non-failing warning that the 643.70 kB main chunk exceeds 500 kB.
- `npm run test:e2e`: public suite passed 12 tests across desktop and mobile Chromium; the two local-Supabase cases were skipped because their required local values were absent.
- `npm run test:e2e:auth`: initially blocked/skipped because the local stack was unavailable; it was later executed successfully as recorded below.
- `npm run test:db`: initially blocked before connecting to PostgreSQL because no container runtime was available; it was later executed successfully as recorded below.
- `npm audit --omit=dev`: passed with zero production vulnerabilities.
- `npm audit`: reports the same 12 moderate development-only `minimatch` findings described below; the offered forced remediation is breaking and was not applied.
- `git diff --check`: passed; only Git's Windows line-ending notices were printed.
- Credential/code-execution scan: no credential values, model keys, `eval`, `new Function`, or execution UI were found. Documented environment-variable names and prohibition text matched as expected.

GitHub Actions was updated but has not run. Hosted Supabase and production behavior remain unverified because no resource was created or deployment authorized.

Final review corrections:

- Corrected the pgTAP plan from 13 to 14 assertions.
- Reject empty or malformed Supabase configuration before constructing a client, preserving public-route availability when placeholders are copied.
- Added direct AuthProvider tests for account changes and session expiry, plus a component test proving late account-A responses cannot appear after switching to account B or signing out.
- Clarified that draft size is capped at 50,000 characters in both Zod and PostgreSQL; this is an input bound, not an execution limit.

Phase 2 database verification completed on 2026-11-04:

- Docker Desktop was reachable on the `desktop-linux` context with Docker Client/Server `29.9.2` and Linux containers.
- Before reset, the stack reported `linked_project: null`; the database container was `supabase_db_devprep-local`, the only migration was `20261104000100`, and both `auth.users` and `public.code_drafts` contained zero rows.
- `npx supabase db reset` explicitly targeted the local database at `127.0.0.1:54322`, recreated it, and reapplied `20261104000100_create_code_drafts.sql`.
- `npm run test:db`: passed all 16 pgTAP assertions against the real local PostgreSQL roles and RLS policies.
- Mutation check: changing the expected anonymous grant count from 0 to 1 made assertion 4 fail and the suite return exit code 1. The test was restored and all 16 assertions passed again.
- `npm run test:e2e:auth`: executed rather than skipped and passed 1 Chromium test. It created a confirmed local Auth user, signed in through the UI, persisted a draft across reload, and deleted it.
- Post-test cleanup was confirmed directly in PostgreSQL: `auth.users=0`, `public.code_drafts=0`, and migration `20261104000100` remained applied.
- Final public Playwright smoke verification passed 12/12 tests with exit code 0 using an explicitly managed local preview process. A preceding Windows run completed all assertions but hung while Playwright shut down its child preview process, so that hung run was not counted as a pass.
- Supabase CLI 3.0 compatibility fixes: renamed `[inbucket]` to `[local_smtp]`, replaced deprecated `auth.email.enable_signup`, disabled the unused local analytics service after its health check prevented startup, and changed local/CI credential extraction to `supabase status -o json`.
- After verification, `npx supabase stop` stopped only `devprep-local` with backup preservation. Generated `supabase/.temp/` credentials were removed and that directory is now explicitly ignored by Git.

## Known limitations

- The dashboard is sample content only and no activity is persisted.
- Tutor content is intentionally finite and cannot analyze arbitrary questions or code.
- Vercel SPA/API rewrite behavior is not configured or verified until deployment preparation in Phase 5.
- GitHub Actions has not run because no GitHub repository was created or pushed.
- Supabase CLI is pinned at `3.0.0`. `npm run test:e2e:auth` fails fast with exit code 1 when local values are absent, so a skipped-only run cannot be mistaken for verification.
- Supabase's default hosted email sender is restricted to project-team addresses and is rate-limited. Public hosted signup configuration is deferred; no SMTP provider was added and email confirmation was not automatically disabled.
- Full `npm audit` reports 12 moderate entries that all trace to one transitive development-only advisory: `minimatch@10.2.6` through ESLint and TypeScript-ESLint. The vulnerable range is `<11.0.1`, no patched 10.x release exists, and the direct tools currently declare `^10.2.x`. `npm audit --omit=dev` reports zero production vulnerabilities. An 11.x override would be outside the tools' declared compatibility range, while npm's forced remediation proposes breaking toolchain changes; neither was applied. Recheck when ESLint and TypeScript-ESLint adopt a patched compatible release.

## Next authorized step

Phase 2 is stopped at its verified local boundary. Phase 3 requires separate explicit approval before adding quizzes, grading, scores, progress, or recommendations.
