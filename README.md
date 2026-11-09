# DevPrep AI

DevPrep AI is a developer learning platform for beginner and intermediate JavaScript learners. Phases 1–4 provide curated challenges, private code drafts, authoritative server-graded quizzes, real attempt history, and deterministic study recommendations while preserving a credential-free public demo.

> **Demo — predefined responses:** The tutor does not use live AI or analyze arbitrary code. DevPrep never executes code. Public sample activity needs no credentials and is not saved.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Public demo setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables are needed for public routes.

For optional local authentication, drafts, and server-graded quizzes, follow [the setup guide](docs/setup.md). Local development uses Mailpit; no hosted project or external email provider is required. Account creation is hidden by default. Set `VITE_ENABLE_SIGNUP=true` only for explicit local Mailpit signup testing.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
npm run test:e2e:a11y
npm run test:e2e:routing
npm run test:db
npm run test:e2e:auth
npm run test:integration:quiz
npm run test:e2e:quiz
```

The routing suite requires the explicitly configured local server described in [the setup guide](docs/setup.md#local-routing-verification); it does not start that server itself.

Playwright uses the installed Chromium browser. If Chromium is not installed:

```bash
npx playwright install chromium
```

## Current routes

- `/` — product landing page
- `/tutor` — predefined tutor questions and progressive hints
- `/challenges/:challengeId` — direct curated challenge details
- `/sample-quiz` — inspectable public quiz with local-only results
- `/quizzes` — authenticated curated quiz catalog
- `/quizzes/:quizId/:quizVersion` — authenticated server-graded quiz
- `/dashboard` — sample content while signed out; real attempt-derived progress while signed in
- `/account` — optional email/password sign-in; public registration is hidden by default
- `/drafts` — private saved drafts; authentication required
- Any other route — not-found page

## Honest limitations

- Tutor answers and hints are curated content, not model output.
- Arbitrary questions and code are not analyzed.
- Saved code is labeled “Not executed or verified.”
- Public sample answers and SQL seed answers are inspectable in this public portfolio repository.
- Authenticated answer keys are not bundled into browser assets or exposed to browser roles.
- Deployed Vercel API/SPA routing has not been verified.
- Recommendations are deterministic rules over the signed-in user's own server-graded attempts. They are not AI-generated.
- The account-page UI flag controls only whether signup controls are shown. Hosted Supabase Auth must separately disable public registration.
- Local Vite-adapter routing has been tested, but the Vercel runtime and hosted routing remain unverified.
- Nothing has been pushed, deployed, or provisioned for Phase 5.

See [the portfolio notes](docs/portfolio.md), [manual accessibility walkthrough](docs/manual-accessibility.md), [project plan](docs/project-plan.md), [architecture notes](docs/architecture.md), [security notes](docs/security.md), [data-deletion guide](docs/data-deletion.md), and [progress record](docs/progress.md).
