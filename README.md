# DevPrep AI

DevPrep AI is a developer learning platform for beginner and intermediate JavaScript learners. Phase 2 adds optional email/password accounts and private code-draft persistence while preserving the credential-free public demo.

> **Demo — predefined responses:** This version does not use live AI, analyze arbitrary code, execute code, save progress, or require credentials.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Public demo setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables are needed for public routes.

For optional local authentication and drafts, follow [the Supabase setup guide](docs/setup.md). Local development uses Mailpit; no hosted project or external email provider is required.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
npm run test:db
npm run test:e2e:auth
```

Playwright uses the installed Chromium browser and starts a production preview automatically. If Chromium is not already installed:

```bash
npx playwright install chromium
```

## Current routes

- `/` — product landing page
- `/tutor` — predefined tutor questions and progressive hints
- `/challenges/:challengeId` — direct curated challenge details
- `/dashboard` — clearly labeled sample dashboard
- `/account` — optional email/password authentication
- `/drafts` — private saved drafts; authentication required
- Any other route — not-found page

## Honest limitations

- Tutor answers and hints are local curated content, not model output.
- Arbitrary questions and code are not analyzed.
- Saved code is explicitly labeled “Not executed or verified.”
- The dashboard contains sample content only; Phase 1 has no accounts or persistence.
- Quizzes, scoring, live AI, and code execution remain outside Phase 2.
- Nothing has been deployed or provisioned.

See [the project plan](docs/project-plan.md), [architecture notes](docs/architecture.md), [data-deletion guide](docs/data-deletion.md), and [progress record](docs/progress.md).
