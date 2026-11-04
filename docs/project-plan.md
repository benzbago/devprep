# DevPrep AI Project Plan

**Status:** Phases 1 and 2 completed and verified locally; hosted CI and production remain unverified

**Last updated:** 2026-11-04
**Product description:** A developer learning platform with a clearly labeled AI tutor demo. Version 1 does not use a live AI model and does not execute code.

## 1. Product intent

DevPrep AI helps beginner and intermediate JavaScript developers practice with curated challenges, predefined tutoring examples, progressive hints, multiple-choice quizzes, saved code drafts, and learning records.

Version 1 is a personal, non-commercial portfolio application. It must be possible to build and deploy it without paying for hosting, a database, AI APIs, code execution, or proprietary application libraries. Free services have finite allowances and may change, pause, restrict, or discontinue service; the application and its documentation must never promise unlimited resources, uninterrupted availability, or permanent zero-cost operation.

## 2. Hard Version 1 constraints

### Zero-paid-service boundary

- Use Vercel Hobby for the frontend and lightweight TypeScript Functions.
- Use Supabase Free for authentication and PostgreSQL.
- Use GitHub Free and standard GitHub-hosted runners for source control and CI.
- Use free, open-source frontend, validation, and testing libraries.
- Do not add a payment method, paid subscription, billable add-on, automatic paid upgrade, or usage-based overage path.
- If a free allowance is exhausted, allow the affected service to pause or reject work. Show an honest temporary-unavailability message rather than switching providers or creating a paid charge.
- Recheck official plan terms before provisioning and again before public release.

### No live AI

- Do not call OpenAI or any other hosted model API.
- Do not require an AI API key.
- Tutor conversations, hints, and code-explanation examples are curated and predefined.
- Every tutor surface displays **“Demo — predefined responses”**.
- Only selectable example questions receive corresponding predefined answers.
- Arbitrary questions or arbitrary code receive an explanation that live AI analysis is unavailable in this version.
- Never imply that a predefined response analyzed user-submitted text or code.
- A future live-AI integration may be described as a separate optional upgrade, but Version 1 must not build provider clients, streaming infrastructure, token accounting, model evaluations, AI quotas, or unused model abstractions.

### No code execution

- Do not execute user code in the browser, Web Workers, Vercel Functions, Node.js, PostgreSQL, CI, or any third-party execution service.
- Do not use `eval`, `new Function`, child processes, dynamic module import of user content, or execution-like workarounds.
- Do not build a runner service or integrate an execution provider.
- Do not implement hidden execution tests.
- Users may edit and save plain-text JavaScript drafts.
- Every saved draft is labeled **“Not executed or verified.”**
- Do not show “Run Code,” pass/fail execution results, verified completion, or execution-based badges.

## 3. Version 1 scope

1. Responsive landing page and accessible navigation.
2. Public tutor demo with selectable example questions and the permanent label “Demo — predefined responses”.
3. Curated JavaScript challenge descriptions and progressive hints.
4. A simple text editor for JavaScript drafts, with authenticated persistence but no execution.
5. Curated multiple-choice quizzes with server-side grading.
6. Supabase authentication.
7. User-specific drafts, quiz attempts, and progress records.
8. A small dashboard derived from actual graded quiz activity.
9. Deterministic learning recommendations based on stored quiz results.
10. A public demo that works without signing in.

### Explicitly deferred or excluded

- Live AI/model integration and claims of measured live-AI performance.
- Code execution, execution providers, hidden execution tests, and verified code results.
- AI-generated quizzes, recommendations, or challenge content.
- Monaco or another IDE-scale editor.
- Charts and elaborate dashboards.
- Autonomous agents, LangChain, LangGraph, Redis, containerized application infrastructure, queues, or an additional backend framework. A pre-existing Docker-compatible runtime may be used only to run the official local Supabase test stack.
- Payments, subscriptions, commercial use, and paid platform features.

## 4. Architecture

Use one React + TypeScript + Vite project with React Router and Tailwind CSS. Keep root-level Vercel Functions in `api/` and shared runtime-neutral Zod contracts in `shared/`. This avoids monorepo overhead while preserving a clear runtime boundary.

```text
Browser (untrusted)
  ├─ React pages, public demo, and public sample quiz
  ├─ Supabase Auth client using public configuration
  └─ authenticated requests carrying a Supabase access token
              ├──────────────► Supabase Data API (Phase 2 draft CRUD)
              │                         │
              │                         ▼
              │               PostgreSQL grants and RLS
              │
              ▼
Vercel Functions (Phase 3 server enforcement boundary)
  ├─ validate requests with Zod
  ├─ verify authentication and derive user identity
  ├─ check ownership
  ├─ load private quiz answer material
  ├─ grade attempts and assign authoritative scores
  └─ apply request and payload limits
              │
              ▼
Supabase PostgreSQL (data authorization boundary)
  ├─ exposed user data protected by grants and RLS
  ├─ private quiz answers unavailable to browser roles
  └─ user-specific drafts, attempts, progress, and deletion operations
```

### Proposed folder structure

```text
api/
  quizzes/grade.ts
  account/delete.ts
shared/
  draft-contract.ts
  quiz-contract.ts
src/
  app/
  components/
  features/
    auth/
    challenges/
    dashboard/
    drafts/
    quizzes/
    recommendations/
    tutor-demo/
  data/
    public-demo/
  lib/
  test/
supabase/
  migrations/
  tests/
e2e/
docs/
  architecture.md
  project-plan.md
  progress.md
  security.md
  data-retention.md
```

Only create a directory or abstraction when its owning phase needs it.

## 5. Public demo and authenticated product separation

### Public demo

- Works without Supabase availability or sign-in.
- Uses bundled sample challenges, sample quiz questions, predefined tutor conversations, and local in-memory or browser-local demo state.
- Public sample quiz answers may be inspectable in frontend assets and are explicitly described as sample content.
- Demo quiz results and activity never create or modify authenticated progress records.
- Browser-local state is labeled as local demo activity, not saved account progress.

### Authenticated experience

- Uses a separate curated question bank whose answer keys are not bundled into frontend assets.
- Loads public question text without revealing answers.
- Submits selected answers to a Vercel Function.
- The function verifies identity, validates the question/version, loads private answer material, grades the attempt, and writes the authoritative score.
- Users can read and modify only their own drafts and learning records.

## 6. Security and data rules

- Treat the browser, route parameters, access tokens, draft text, question IDs, and submitted answers as untrusted.
- Verify Supabase-issued authentication server-side and derive the user ID from verified claims.
- Never trust a client-supplied user ID, score, completion flag, recommendation, or ownership claim.
- Validate all Function inputs with Zod and enforce method, content-type, payload-size, and request-frequency limits.
- Apply explicit grants and RLS policies to every exposed table.
- Test allowed and denied `select`, `insert`, `update`, and `delete` behavior for anonymous users, owners, and other authenticated users where relevant.
- Store authenticated answer keys in a private schema or private server-accessible table with no browser-role grants.
- Grade authenticated quizzes only in server-side Functions; clients cannot write authoritative scores.
- Use a server-only Supabase secret only where an administrative operation genuinely requires it. Never place it in a `VITE_*` variable.
- Commit only placeholder environment files. Ignore all real local environment files.
- Render any Markdown with raw HTML disabled and safe URL protocols.
- Collect only the email/account identity required by Supabase Auth plus product records needed for drafts and quiz progress.
- Provide documented deletion instructions and an authenticated deletion flow or clearly documented manual deletion procedure before public data collection.
- Keep logs minimal and never log tokens, secrets, full draft contents, or unnecessary personal data.

### Request-limit approach

Version 1 uses inexpensive, defensive limits rather than paid rate-limit infrastructure:

- Keep grading endpoints authenticated except for the bundled public demo, which requires no grading API.
- Apply strict body-size limits and schema bounds.
- Use an atomic PostgreSQL function or table-backed window counter for sensitive authenticated mutations if public usage demonstrates a need.
- Add coarse Vercel/platform protection where available on Hobby without paid add-ons.
- Return `429` for exceeded limits and fail closed if a required server-side limiter cannot be checked.
- Do not introduce Redis or a paid rate-limiting provider.

## 7. SPA and API routing

Production routing must preserve `/api/*` for Vercel Functions before applying the React SPA fallback. Direct navigation to `/tutor`, `/challenges/:id`, and `/dashboard` should return `index.html`; unknown `/api/*` routes must remain API 404 responses and must not return the React application.

Use Vite for the fast frontend development loop. Use `vercel dev` when integrated Function and rewrite behavior is needed. Verify production-like routing with automated requests before deployment.

## 8. Roadmap

### Phase 1 — Foundation, landing page, demo tutor, tests, and CI

**Scope**

- Initialize the repository and strict React/TypeScript/Vite foundation.
- Add React Router, Tailwind CSS, and a small accessible component foundation.
- Build the responsive landing page, navigation, not-found page, and public demo tutor.
- Add a small bundled public challenge catalog with progressive predefined hints.
- Add tests, production build checks, and GitHub Actions CI.
- Establish project, architecture, security, and progress documentation.

**Not included**

- Supabase, authentication, database tables, Vercel grading Functions, persisted drafts, authenticated quizzes, or deployment.

### Phase 2 — Authentication, database, RLS, and draft persistence

**Scope**

- Add optional Supabase email/password Auth in the browser; reserve server-side verification for later privileged APIs.
- Add reproducible migrations, explicit grants, and RLS.
- Add user-owned JavaScript draft editing and persistence.
- Label all drafts “Not executed or verified.”
- Add ownership and denied-access database tests.
- Keep the public unsigned demo independent of Supabase configuration or availability.
- Represent loading, errors, expired sessions, and signed-out states, and clear private state on account changes.
- Document local Mailpit use and defer hosted public-signup email configuration.

### Phase 3 — Curated quizzes, server-side grading, and progress

**Scope**

- Add a private authenticated question bank and answer material.
- Add a separate inspectable public sample quiz.
- Add server-side Zod-validated grading through Vercel Functions.
- Persist authoritative attempts and scores.
- Add a small dashboard derived only from real authenticated quiz attempts.
- Add authorization, tampering, repeat-submission, and failure-path tests.

### Phase 4 — Deterministic recommendations, accessibility, and release checks

**Scope**

- Add rule-based recommendations from quiz topic scores and attempt history.
- Store either reproducible recommendation inputs or derive recommendations on read; do not use AI.
- Complete keyboard, screen-reader, contrast, reduced-motion, and responsive checks.
- Add account/data deletion guidance and validate data separation.
- Run the full test and security checklist.

### Phase 5 — Deployment preparation and portfolio documentation

**Scope**

- Reverify current free-plan terms and project eligibility.
- Prepare, but do not perform, Vercel, Supabase, and GitHub manual setup.
- Verify environment-variable classification and SPA/API routing.
- Document limitations, architecture, security decisions, and portfolio evidence honestly.
- Deploy only after explicit authorization.

## 9. Phase 1 acceptance criteria

Phase 1 is accepted only when all of the following are true:

### Product behavior

- `/`, `/tutor`, challenge routes, and the not-found route work at supported mobile and desktop widths.
- Navigation is keyboard accessible, has visible focus, and uses appropriate landmarks and headings.
- The tutor permanently displays **“Demo — predefined responses”**.
- Users select from example questions; each supported selection returns its matching curated response.
- Unsupported/free-form questions receive a clear message that live AI is unavailable and are never presented as analyzed.
- At least a small set of curated JavaScript challenges provides three progressive predefined hint levels.
- The public demo works without credentials, network APIs, Supabase, or an AI key.
- No UI contains Run Code, execution results, verified completion, or live-AI claims.

### Engineering quality

- TypeScript strict checking passes.
- ESLint and formatting checks pass.
- Vitest and React Testing Library cover navigation, tutor labeling, supported/unsupported demo questions, and progressive hints.
- Playwright covers the public landing-to-tutor journey, direct-route navigation, keyboard navigation, and a representative mobile viewport.
- The production build succeeds.
- CI uses a standard GitHub-hosted Linux runner, avoids paid/larger runners, and retains no unnecessary artifacts.
- `.env.example` contains placeholders only, and secret-bearing environment files are ignored.
- `docs/progress.md` records the exact commands run and their real results.

### Scope integrity

- No Supabase dependency, OpenAI/model SDK, execution dependency, grading endpoint, payment integration, or unused future infrastructure is added.
- No external resource is provisioned and no deployment is performed.
- Phase 2 work has not started.

## 10. Verification at each phase boundary

Run and report the actual available commands for:

1. Formatting check.
2. ESLint.
3. TypeScript checking.
4. Unit/component tests.
5. Production build.
6. Relevant Playwright E2E tests.
7. From Phase 2 onward, migration and direct RLS authorization tests.

Do not claim an unrun check passed. Record blockers and known limitations in `docs/progress.md`. Stop after each phase and wait for approval.

## 11. Current free-plan constraints verified on 2026-11-04

These figures are planning inputs, not guarantees. Recheck them before account setup and release.

### Vercel Hobby

- Restricted to personal, non-commercial use.
- Current included usage lists 100 GB Fast Data Transfer, 10 GB Fast Origin Transfer, 1,000,000 CDN requests, 4 CPU-hours, 360 GB-hours provisioned memory, and 1,000,000 Function invocations.
- Hobby usage is paused when included limits are exceeded; the plan does not provide a paid overage path that this project should enable.
- Conditions and availability may change or the plan may be discontinued.
- Sources: [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel plan behavior](https://vercel.com/docs/plans), and [Vercel terms](https://vercel.com/legal/terms).

### Supabase Free

- Two active free projects across organizations where the user is an owner or administrator.
- Current allowances include 500 MB database size per project, 50,000 monthly active users, 5 GB uncached egress, 5 GB cached egress, and 1 GB storage.
- Free projects may pause after low activity; current pricing documentation describes pausing after one week of inactivity.
- Continued excess usage can lead to service restrictions. Do not upgrade or enable paid add-ons.
- Sources: [Supabase billing documentation](https://supabase.com/docs/guides/platform/billing-on-supabase) and [Supabase pricing](https://supabase.com/pricing).

### GitHub Free and Actions

- Standard GitHub-hosted runners are free for public repositories.
- For private repositories, GitHub Free currently includes $12 USD of Actions compute usage per month, 500 MB of shared artifact/package storage, and 10 GB of Actions cache per repository.
- Additional private-repository use can be billable if a payment path is configured. This project must not configure one; prefer a public repository if appropriate for the portfolio, use standard Linux runners, keep CI focused, and minimize artifact retention.
- Sources: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) and [included product usage](https://docs.github.com/en/billing/reference/product-usage-included).

## 12. Manual setup requiring explicit authorization

No external setup is part of the current planning task. Later phases require the owner to authorize and perform or supervise:

1. Create the GitHub repository and choose public or private visibility.
2. Confirm no payment method or paid Actions usage is enabled; configure usage notifications or a zero-spend stopping budget where GitHub exposes that control.
3. If separately authorized in a later deployment task, create one Supabase Free project and record its public URL/publishable key locally.
4. Configure server-only Supabase credentials only in local/Vercel secret settings, never in Git.
5. Create/link a Vercel Hobby project in Phase 5 without starting a Pro trial or adding payment details.
6. Configure production environment variables and verify that only intentionally public values use the `VITE_*` prefix.
7. Review usage dashboards periodically and accept service pause/restriction rather than upgrading automatically.

## 13. Honest portfolio claims

Version 1 may claim:

- A React/TypeScript developer learning platform.
- A clearly labeled AI tutor demo using curated predefined responses.
- Secure user-specific persistence with Supabase Auth, PostgreSQL, RLS, and tested authorization boundaries after those phases are complete.
- Server-side grading of curated multiple-choice quizzes.
- Deterministic recommendations based on real quiz activity.

Version 1 must not claim:

- Live AI or model integration.
- Analysis of arbitrary questions or arbitrary code.
- Measured live-model quality, latency, token usage, or cost.
- Code execution, automated code verification, or execution-backed completion.
- Unlimited, permanently free, or production-SLA hosting.

## 14. Approval gate

Phases 1 and 2 were approved for local implementation. Do not initialize hosted services, deploy, push, or begin Phase 3. Phases 3–5 each require separate explicit approval.
