# Phase 3 Curated Quizzes Implementation Plan

> **For agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add curated authenticated JavaScript quizzes with private answer material, authoritative server-side grading, owner-only attempt history, and a dashboard derived from graded attempts, while keeping the unsigned sample quiz completely separate.

**Architecture:** Authenticated clients read active question prompts and options from RLS-protected public tables, then send selections and an idempotency key to a Web-standard Vercel Function. The Function verifies the Supabase bearer token, derives the user ID, validates the bounded payload with Zod, and invokes a single service-role-only PostgreSQL function that reads private answer keys and atomically inserts or returns an authoritative attempt. Browser roles can only read their own immutable attempts; public sample quiz data stays bundled and never touches authenticated tables.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Tailwind CSS, Vercel Functions using Web `Request`/`Response`, Supabase Auth/PostgreSQL/Data API, Zod, Vitest, React Testing Library, pgTAP, and Playwright.

---

## Scope boundaries

- Include curated multiple-choice JavaScript quizzes, server grading, attempt history, and basic score/activity summaries.
- Exclude live AI, arbitrary code analysis, all code execution, deterministic recommendations, payment services, deployment, and hosted resource creation.
- Keep the public sample quiz inspectable, unsigned, and local-only. Its result must never create an authenticated attempt.
- Treat private answer material as private from browser assets, browser roles, and public APIs. Because this is a portfolio source repository, committed SQL seed values remain visible to repository readers; do not claim source-code secrecy.
- Allow deliberate reattempts. Collapse only network retries that reuse the same client-generated submission UUID.

## Runtime and trust boundaries

1. The browser obtains a normal Supabase Auth access token from the existing Phase 2 session.
2. Authenticated quiz prompts and options are read with the browser Supabase client from `public.quizzes` and `public.quiz_questions`; neither table contains a correct answer.
3. The browser posts `{ quizId, quizVersion, submissionId, answers }` to `/api/quizzes/grade` with `Authorization: Bearer <access-token>`.
4. The Function accepts only `POST`, checks content type and body size, parses the shared Zod contract, and validates the token with Supabase Auth `getUser(token)`. It never trusts a submitted user ID or score.
5. A server-only Supabase client invokes `public.grade_quiz_attempt` with the verified user ID. The server credential is never prefixed with `VITE_`, returned, or logged.
6. `public.grade_quiz_attempt` is `SECURITY INVOKER`, executable only by `service_role`, and runs one transaction that validates the active quiz/version/question set, reads `private.quiz_answer_keys`, calculates the score, and inserts the attempt. It returns only attempt metadata and score totals, never answer keys.
7. The client reads `public.quiz_attempts` through owner-only RLS. It has no insert, update, or delete grant, so authoritative rows cannot be forged or edited.
8. The dashboard derives attempted quizzes, latest score, and best score from these immutable rows. No separate client-writable progress table is needed.

## Proposed database model

### `public.quizzes`

- `id text primary key`
- `version integer not null check (version > 0)`
- `title text not null`
- `description text not null`
- `topic text not null`
- `is_active boolean not null default false`
- `question_count integer not null check (question_count between 1 and 20)`
- Unique identity across `id` and `version`; immutable seeded catalog content.
- `SELECT` for `authenticated` on active rows only through RLS. No browser write grants.

### `public.quiz_questions`

- `id uuid primary key`
- `quiz_id text not null`, `quiz_version integer not null`
- `position integer not null`
- `prompt text not null`
- `options jsonb not null`
- Database checks require 2–6 non-empty string options, bounded text, unique position, and a matching quiz/version.
- `SELECT` for `authenticated` only when the parent quiz is active. No answer column and no browser write grants.

### `private.quiz_answer_keys`

- One row per question/version with `correct_option integer`.
- Foreign key to the exact public question version and a range check against the option count.
- No grants to `anon` or `authenticated`; `private` is not an exposed Data API schema.
- Explicitly revoke schema/table privileges from `PUBLIC`, `anon`, and `authenticated`.

### `public.quiz_attempts`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `quiz_id text not null`, `quiz_version integer not null`
- `submission_id uuid not null`
- `selected_answers jsonb not null`
- `correct_count integer not null`, `question_count integer not null`, `score_percent integer not null`
- `submitted_at timestamptz not null default now()`
- Unique `(user_id, submission_id)` for idempotent retries; indexes on `(user_id, submitted_at desc)` and `(user_id, quiz_id, quiz_version)`.
- Authenticated users receive `SELECT` only. RLS permits selecting only `user_id = auth.uid()`. No browser insert/update/delete policy or grant.

### `public.grade_quiz_attempt`

- `SECURITY INVOKER`, owned and called with the server role.
- Revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`; grant only to `service_role`.
- Use `SET search_path = ''` and schema-qualify every object.
- Reject inactive/unknown versions, missing/extra/duplicate question IDs, invalid option indexes, and oversized submissions.
- On `(user_id, submission_id)` conflict, return the existing row only when quiz/version and submitted answers match; otherwise reject the idempotency-key collision.
- Insert score and selections atomically so no half-written attempt can exist.

## Request and failure behavior

- Shared Zod bounds: UUID submission ID, known-format quiz ID, positive version, 1–20 answers, unique question IDs, and integer option indexes 0–5.
- Function responses: `401` missing/invalid/expired session, `405` wrong method, `415` wrong content type, `413` body too large, `400` malformed input, `409` conflicting reuse of an idempotency key or stale quiz version, `429` exceeded authenticated submission window if the database limiter is enabled, and generic `500/503` without database details.
- Do not log bearer tokens, answer selections, email addresses, answer keys, or server secrets.
- Send `Cache-Control: no-store` on grading and private-attempt responses.
- Enforce a persistent five-new-attempts-per-user rolling-minute limit inside the atomic PostgreSQL grading function. Exact idempotent retries return the existing attempt before the limiter and do not consume another slot. Do not add process-local counters, Redis, or a paid limiter.

## How grading runs locally and on Vercel

- The production entry point is `api/quizzes/grade.ts`, exporting a Web-standard `POST(request: Request): Promise<Response>` handler supported by Vercel Functions.
- The handler delegates to a runtime-neutral grading service, so Vitest can call it locally with a real `Request` and the disposable local Supabase stack—no Vercel account, deployment, or hosted project is required.
- Local integration tests obtain only local keys from `npx supabase status -o json`, pass them through process environment, invoke the real handler, and assert the persisted database result. Secrets are cleared after the process and never written to files.
- Browser/component tests mock only the HTTP transport for UI-state coverage; they do not replace the real handler/database integration suite.
- Vercel will provide the same server-only environment names at runtime after later explicit deployment authorization. The browser build receives only the existing public URL/publishable key. Phase 3 does not link a Vercel project or configure hosted secrets.

## Implementation tasks

### Task 1: Freeze contracts with failing tests

**Files:**

- Create: `shared/quiz-contract.ts`
- Create: `shared/quiz-contract.test.ts`

1. Add failing tests for valid submissions and every bound: malformed quiz IDs, versions, UUIDs, duplicate question IDs, too many answers, and invalid option indexes.
2. Run `npm run test:run -- shared/quiz-contract.test.ts` and confirm failure.
3. Implement the smallest shared Zod request/response schemas.
4. Rerun the focused test and commit only when it passes.

### Task 2: Add the versioned quiz schema and private answer storage

**Files:**

- Create: `supabase/migrations/20261104000200_create_quizzes.sql`
- Create: `supabase/tests/quiz_grading_test.sql`

1. Write failing pgTAP assertions for schemas, columns, constraints, exact grants, RLS enablement, policies, and denied `anon`/`authenticated` access to answer material and grading execution.
2. Add public catalog, private answer-key, and immutable attempt tables with explicit grants and RLS.
3. Add a small curated authenticated JavaScript quiz and answer rows in the migration, keeping answers out of frontend source.
4. Add the service-role-only atomic grading function and idempotency rules.
5. Run concurrent identical submissions and prove they return the same attempt ID while storing one row; changed content with the same UUID must fail.
6. Reset only the confirmed disposable local stack, run `npm run test:db`, and require every assertion to execute and pass.
7. Temporarily break one authorization assertion, prove the suite exits non-zero, restore it, and rerun green.

### Task 3: Implement the server grading boundary

**Files:**

- Create: `api/quizzes/grade.ts`
- Create: `api/quizzes/grade.test.ts`
- Create: `api/_lib/server-supabase.ts`
- Create: `api/_lib/http.ts`
- Modify: `.env.example`
- Modify: `eslint.config.js`

1. Add failing handler tests for method/content-type/body-size checks, missing and expired tokens, invalid payloads, stale versions, duplicate retry behavior, and sanitized database failures.
2. Create separate auth-verification and server-role clients. Validate identity with `getUser(token)` before any privileged call.
3. Invoke only the service-role-only RPC and return its bounded result with `no-store` headers.
4. Add a real local-Supabase integration case that grades one submission and confirms the database—not the client—assigned its score.
5. Confirm no `VITE_*` server secret, token logging, or answer key appears in built frontend assets.

### Task 4: Add the authenticated quiz experience

**Files:**

- Create: `src/features/quizzes/QuizListPage.tsx`
- Create: `src/features/quizzes/QuizPage.tsx`
- Create: `src/features/quizzes/quiz-service.ts`
- Create: `src/features/quizzes/QuizPage.test.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/components/AppLayout.tsx`

1. Add failing component tests for loading, signed-out, empty, invalid quiz, submission, duplicate-click prevention, expired-session, conflict, and retry states.
2. Read prompts/options with the authenticated Supabase client and submit only selections to `/api/quizzes/grade`.
3. Generate one submission UUID per deliberate submit and reuse it for transport retries; disable repeated clicks while pending.
4. Display authoritative totals returned by the server without revealing correct answers.
5. Clear quiz-private state on sign-out/account changes and guard late responses using the Phase 2 request-scope pattern.

### Task 5: Add a separate public sample quiz

**Files:**

- Create: `src/data/public-demo/sample-quiz.ts`
- Create: `src/features/quizzes/PublicSampleQuizPage.tsx`
- Create: `src/features/quizzes/PublicSampleQuizPage.test.tsx`
- Modify: `src/app/router.tsx`

1. Add failing tests proving the route works with Supabase unconfigured and is labeled as inspectable sample content.
2. Grade the small sample entirely in memory from bundled data.
3. State that sample activity is not saved to account progress.
4. Assert that the sample never calls Supabase or `/api/quizzes/grade`.

### Task 6: Replace sample dashboard data with authoritative progress

**Files:**

- Modify: `src/features/dashboard/DashboardPage.tsx`
- Create or modify: `src/features/dashboard/DashboardPage.test.tsx`
- Create: `src/features/quizzes/attempt-service.ts`

1. Add failing tests for signed-out, empty, loading, error, account-switch, and populated states.
2. Read only the current user's RLS-protected attempt rows.
3. Derive attempted quiz count, latest result, and best score per quiz in deterministic client code.
4. Remove the Phase 1 sample-progress claim from the authenticated dashboard. Keep recommendations out of this phase.

### Task 7: Prove authorization and end-to-end persistence

**Files:**

- Expand: `supabase/tests/quiz_grading_test.sql`
- Create: `e2e/authenticated-quizzes.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/require-local-supabase-env.mjs`

1. Test anonymous denial, owner read, cross-user denial, no client writes, no browser answer-key access, service-only function execution, tampered scores, invalid question sets, stale versions, retry idempotency, and distinct intentional reattempts.
2. Add authenticated Playwright coverage that signs in, completes a real quiz through the local handler, reloads, and sees the same authoritative attempt on the dashboard.
3. Require the authenticated test to fail—not skip—when local server values are absent.
4. Extend the existing standard-runner CI job to run migrations, pgTAP, Function integration, and authenticated persistence without hosted credentials.

### Task 8: Documentation and phase-boundary verification

**Files:**

- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/security.md`
- Modify: `docs/setup.md`
- Modify: `docs/progress.md`
- Modify: `docs/project-plan.md`

1. Document the server/browser trust boundary, answer-key threat model, local environment names, local grading test procedure, data deletion effect, and public/authenticated separation.
2. State honestly that answer seeds in a public repository are inspectable by repository readers even though they are absent from browser assets and APIs.
3. Run formatting, lint, TypeScript, unit/component tests, build, public Playwright, real pgTAP, Function integration, authenticated quiz persistence, production dependency audit, secret scan, and frontend-bundle answer scan.
4. Record exact pass/fail/blocked counts. Keep GitHub CI and production marked unverified until they actually run.
5. Stop before recommendations, deployment, remote migrations, pushing, or Phase 4.

## Acceptance criteria

### Product behavior

- Signed-in users can load curated JavaScript quiz prompts/options, submit selections once per deliberate attempt, receive an authoritative score, and see attempt history after reload.
- The dashboard reports only real graded attempts and has honest empty/error states.
- A public sample quiz works without credentials or network calls, is labeled as inspectable sample content, and never writes authenticated records.
- No quiz feature executes code, uses live AI, produces recommendations, or claims arbitrary analysis.

### Authentication and authorization

- Every grading request validates a current Supabase bearer token server-side and derives identity from it.
- Anonymous grading is rejected; user IDs and scores supplied by clients are ignored or rejected.
- Authenticated browser roles cannot read answer keys, execute the grading function, insert/update/delete attempts, or read another user's attempts.
- Owner-only attempt reads are enforced by both explicit grants and RLS and proven against the real local database.
- Sign-out/account changes clear quiz and attempt state; stale responses cannot display the previous user's data.

### Integrity and leakage prevention

- Correct answers are absent from frontend source modules and production browser assets.
- The private schema is not exposed to browser roles, and the grading RPC is executable only by `service_role`.
- The database validates the exact active quiz/version and complete unique question set before grading.
- Retried requests with the same submission UUID return one attempt; conflicting reuse fails; a new UUID permits a legitimate reattempt.
- Only the server/database assigns `correct_count`, `question_count`, and `score_percent`.

### Verification

- Shared-contract, handler, component, and derivation tests pass.
- pgTAP proves grants, RLS, ownership, cross-user denial, answer privacy, grading authorization, validation, and idempotency; an intentional broken assertion exits non-zero.
- The real local Function/database integration test passes without mocks.
- Authenticated Playwright grading/persistence executes rather than skips and passes against disposable local Supabase.
- Public Playwright remains green without credentials.
- Formatting, lint, strict TypeScript, production build, and production dependency audit pass; limitations and warnings are reported rather than hidden.
- No hosted resource is created, no remote migration is applied, and nothing is pushed or deployed.

## Manual setup expected after approval

No hosted setup is required for local implementation. The owner only needs Docker Desktop running with Linux containers, the existing Node/npm prerequisites, and the checked-in Supabase CLI dependency. Tests derive disposable local values from `npx supabase status -o json`; they must not ask for secrets in chat or write them to tracked files.

Hosted Supabase/Vercel environment configuration, remote migrations, production email signup, CI observation, and deployment remain deferred until separately authorized.
