# DevPrep AI Progress

## Current status

Phases 1–3 have local checkpoint commits. Phase 4 is implemented and verified locally in the working tree, awaiting review before a checkpoint. GitHub CI and deployed Vercel routing have not been verified. No hosted service was provisioned, no payment method was added, and nothing was pushed or deployed.

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

## Phase 3 implemented and verified locally

- Versioned published JavaScript quizzes with immutable questions and answer keys.
- Private answer storage, browser-read-only prompts/options, explicit grants, and owner-only attempt RLS.
- A service-role-only atomic grading function with complete membership/option validation, per-user advisory locking, idempotency, and a persistent five-new-attempts-per-minute limit.
- A 16 KiB Zod-validated Web handler that verifies Supabase access tokens and never accepts client scores or user IDs.
- Authenticated quiz catalog/completion UI and immutable attempt history.
- Signed-in dashboard figures derived only from real authoritative attempts; signed-out sample figures remain clearly labeled.
- A separate inspectable public sample quiz that grades locally and stores nothing.
- Real-handler concurrency/integration and authenticated Playwright suites that fail fast rather than skip when local values are absent.
- Account deletion cascade coverage for both drafts and quiz attempts.

## Phase 3 verification record — 2026-11-07

Passed locally without Supabase:

- `npm run test:run`: 15 files and 66 tests passed.
- `npm run typecheck`: passed with no diagnostics.
- `npm run lint`: passed with zero warnings or errors.
- `npm run build`: passed; Vite transformed 2,220 modules. The existing non-failing chunk warning remains, now at 661.74 kB.
- Public Playwright smoke verification: 14/14 passed across desktop and mobile Chromium, including the zero-network public sample quiz. The normal Windows-managed preview again hung after assertions, so the counted pass used the documented explicitly managed preview process and exited 0.
- `npm audit --omit=dev`: passed with zero production vulnerabilities.
- Production browser-asset scan: no `quiz_answer_keys`, grading RPC name, server credential names, or private grading identifiers were found.
- Credential-shape scan: no committed secret/key values were found.

Passed locally with Supabase on 2026-11-07:

- Docker Client and Server `29.9.2` were reachable using Linux containers.
- Before reset, the target was verified as the unlinked `devprep-local` stack at `127.0.0.1:54322`, backed by container `supabase_db_devprep-local`. It contained only migration `20261104000100`, with `auth.users=0`, `public.code_drafts=0`, and no Phase 3 attempt table, so there was no data to preserve.
- `npx supabase db reset` explicitly targeted the local stack and applied migrations `20261104000100` and `20261107000100`.
- `npm run test:db`: passed 57/57 real pgTAP assertions: 16 draft/RLS assertions and all 41 quiz/grading assertions.
- Mutation check: changing the expected anonymous quiz grant count from 0 to 1 made quiz assertion 12 fail and the suite exit 1. The temporary change was restored, then all 57 assertions passed again.
- `npm run test:integration:quiz`: executed 3/3 real handler/database tests. It covered invalid-token rejection, two concurrent identical requests producing one consistent attempt, conflicting submission-UUID reuse returning 409, the persistent five-new-attempts-per-minute limit, and an exact retry succeeding after the limit.
- `npm run test:e2e:auth`: executed rather than skipped and passed 1/1 Chromium draft-persistence test.
- `npm run test:e2e:quiz`: initially exposed a test race because it navigated before sign-in state committed. The test now waits for the authenticated drafts page; the rerun executed rather than skipped and passed 1/1 Chromium quiz test, including authoritative grading and dashboard persistence across reload.
- Post-test cleanup was confirmed directly: `auth.users=0`, `public.code_drafts=0`, and `public.quiz_attempts=0`. The expected immutable seed remains: one quiz version and three private answer rows.
- Closeout review expanded published-version coverage from 41 to 45 quiz assertions. Inserts and moves into published question/answer sets are now rejected; the final database suite passed 61/61 assertions (16 draft/RLS plus 45 quiz/grading).
- Closeout review also added a lost-response regression: an unchanged retry preserves its submission identifier, while editing answers or choosing “Start a new attempt” abandons it and generates a new identifier instead of trapping the user in an idempotency conflict.

Not locally provable:

- GitHub Actions has not run because nothing was pushed.
- Deployed Vercel `/api/*` routing has not run because deployment was not authorized. Direct handler integration and the opt-in local Vite adapter do not prove deployed routing.

## Phase 4 implemented locally

- Deterministic, explainable study recommendations use only the signed-in user's owner-readable, server-graded quiz attempts and existing published topic metadata.
- Recommendation evidence is independently bounded to 100 attempts ordered by `submitted_at DESC, id ASC`; all-time dashboard statistics and history are unchanged.
- The latest retake of each immutable quiz version contributes exact count-based topic evidence. Unrounded scores below 70% produce **Review next**, scores from 70% to below 85% produce **Practice again**, and scores at or above 85% require no remediation.
- Near-threshold results display up to two decimal places. One-version evidence is labeled as an early signal, unmatched attempts produce an incomplete-evidence notice, and an absent quiz catalog produces a useful non-linked empty state.
- Public sample results remain local, credential-free, and excluded from signed-in recommendations. Account changes remount the private dashboard, clear prior recommendation state, and reject late responses.
- Quiz result headings receive focus after keyboard submission. The focused heading is the only result feedback path, so the same score is not repeated by an `aria-live` region.
- Axe-powered public and authenticated accessibility coverage, narrow-mobile overflow checks, and contrast fixes were added. The GitHub workflow now includes the public accessibility command.

## Phase 4 verification record — 2026-11-07

Passed locally:

- `npm run format:check`: passed; all matched files use Prettier formatting.
- `npm run lint`: passed with zero warnings or errors.
- `npm run typecheck`: passed with no diagnostics.
- `npm run test:run`: 17 files and 83 tests passed, including exact threshold, tie, retake, 100-attempt cutoff, incomplete metadata, no-catalog, account-change, and result-focus cases.
- `npm run build`: passed; Vite transformed 2,223 modules. The existing non-failing bundle warning remains at 668.09 kB (192.64 kB gzip).
- `npm run test:e2e`: 14/14 public desktop/mobile smoke tests passed using the documented explicitly managed preview process.
- `npm run test:e2e:a11y`: 4/4 public desktop/mobile tests passed. Axe reported no serious or critical findings on the checked pages; the suite also verified 320-pixel horizontal fit, keyboard submission, result focus, and absence of a duplicate live region.
- `npm run test:db`: 61/61 existing real pgTAP assertions passed. Phase 4 adds no migration or policy change.
- `npm run test:integration:quiz`: 3/3 real handler/database tests passed, preserving token validation, atomic grading, persistent request limits, and concurrent idempotency.
- `npm run test:e2e:auth`: executed rather than skipped and passed 1/1 authenticated draft-persistence test.
- `npm run test:e2e:quiz`: executed rather than skipped and passed 1/1 authenticated quiz test, including authoritative persistence, the signed-in recommendation, result focus, and serious/critical axe checks on quiz and dashboard flows.
- `npm audit --omit=dev`: zero production vulnerabilities.
- `git diff --check`: passed; only Windows line-ending notices were printed.
- Credential and prohibited-feature scans found no secret values, model client, code execution primitive, or execution UI. Empty example variables and CI extraction of a local ephemeral key are intentional.

Automated accessibility results and manual checks are distinct:

- Automated: the public axe suite and authenticated quiz axe checks above passed; component and browser tests verified focus movement and the single announcement path.
- Manually performed: rendered desktop sample-quiz and 320-pixel dashboard screenshots were visually inspected for readable labels, card stacking, navigation layout, and obvious clipping/overflow; no visible defect was found.
- Not manually performed: no screen-reader session or manual keyboard-only browser walkthrough was completed in this environment. These remain release-review checks rather than claimed passes.

Non-blocking limitations and external checks:

- Full `npm audit` reports 10 moderate development-only paths to the current `minimatch` advisory. npm offers only `--force` with a breaking ESLint downgrade, so no incompatible remediation was applied; production audit remains clean.
- GitHub Actions execution is pending because nothing was pushed.
- Deployed Vercel `/api/*` routing is pending because no deployment was authorized. Local handler and browser tests do not prove deployed routing.

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

- Signed-out dashboard figures are sample content; signed-in figures require verified authoritative attempts.
- Tutor content is intentionally finite and cannot analyze arbitrary questions or code.
- Vercel SPA/API rewrite behavior is not configured or verified until deployment preparation in Phase 5.
- GitHub Actions has not run because no GitHub repository was created or pushed.
- Supabase CLI is pinned at `3.0.0`. `npm run test:e2e:auth` fails fast with exit code 1 when local values are absent, so a skipped-only run cannot be mistaken for verification.
- Supabase's default hosted email sender is restricted to project-team addresses and is rate-limited. Public hosted signup configuration is deferred; no SMTP provider was added and email confirmation was not automatically disabled.
- Full `npm audit` currently reports 10 moderate entries that trace to one transitive development-only `minimatch` advisory through ESLint and TypeScript-ESLint. `npm audit --omit=dev` reports zero production vulnerabilities. npm's offered forced fix would make a breaking ESLint downgrade, so it was not applied. Recheck when the toolchain adopts a compatible patched dependency.

## Next authorized step

Phase 4 implementation and local verification are complete in the uncommitted working tree. Stop for review; do not commit, push, deploy, provision resources, or begin Phase 5 without separate explicit approval.
