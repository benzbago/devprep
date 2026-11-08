# Phase 4 Architecture

## Runtime shape

```text
Browser (untrusted)
  ├─ Public tutor and inspectable sample quiz: bundled, local-only
  ├─ Supabase Auth session and public quiz prompts/options
  ├─ Owner-only draft and attempt reads through RLS
  └─ Authenticated quiz selections sent to /api/quizzes/grade
                         │
                         ▼
Vercel Web Handler (trusted server boundary)
  ├─ 16 KiB body limit and shared Zod validation
  ├─ Supabase Auth getUser(access-token) verification
  └─ server-secret call to service-role-only grading RPC
                         │
                         ▼
Supabase PostgreSQL
  ├─ published quiz versions and prompts/options
  ├─ private answer keys with no browser-role access
  ├─ atomic grading, persistent rate limit, and idempotency lock
  └─ immutable, owner-readable authoritative attempts
```

Draft CRUD still uses the Supabase browser client directly because RLS is its complete enforcement boundary. Quiz grading uses a Function because browsers must not receive answer keys or assign scores.

## Quiz integrity

- `(quiz_id, version)` identifies an immutable published quiz. Questions and answer keys cannot be updated or deleted after publication.
- Attempts retain the exact quiz version, selected answers, counts, percentage, and submission time, so history remains interpretable after later versions are added.
- The browser can read published prompts/options but no correct-answer column exists in exposed tables.
- `private.quiz_answer_keys` is outside configured Data API schemas. `PUBLIC`, `anon`, and `authenticated` receive no schema or table privileges.
- `public.grade_quiz_attempt` is `SECURITY INVOKER`, executable only by `service_role`, and reads private answers using explicit server-role grants.
- A transaction-scoped advisory lock serializes submissions per user. `(user_id, submission_id)` is also unique. Concurrent identical retries return one stored attempt; changed content with the same UUID fails.
- New attempts are limited persistently to five per user in a rolling minute. Exact retries return before the limit check.

## Public and private progress

`/sample-quiz` is inspectable bundled content, makes no API call, and stores nothing. Signed-out `/dashboard` figures are permanently labeled sample content.

Signed-in dashboard figures come only from owner-scoped `quiz_attempts` rows: total attempts, latest score, best score, and versioned history. Those figures and the existing history query remain all-time.

Phase 4 recommendations are derived in the browser from a separate owner-scoped evidence query and published quiz metadata. The evidence query orders by `submitted_at DESC, id ASC` and limits only recommendation evidence to 100 rows, making equal-timestamp cutoffs deterministic. The rule engine keeps the latest retake for each immutable quiz version, combines matched evidence by topic using exact `correct_count / question_count`, and applies unrounded boundaries:

- below 70%: **Review next**;
- 70% to below 85%: **Practice again**;
- 85% or higher: no remediation; when every evidenced topic meets this boundary, show one weakest-topic **Keep it fresh** suggestion.

The UI displays up to two decimal places, identifies one-version evidence as an early signal, explains when attempts cannot be matched to current metadata, and avoids broken links when no published quiz exists. Recommendations add no stored profile or inferred data and make no AI or external-service call.

## Local and deployed routing

Local authenticated Playwright uses an opt-in Vite middleware adapter that passes `/api/quizzes/grade` requests to the exact Web handler. Direct handler/database tests also invoke that handler with Web `Request` objects.

These checks prove handler behavior and local persistence, not Vercel routing or SPA rewrites. Deployed `/api/*` precedence and production routing remain pending until an explicitly authorized deployment verification.
