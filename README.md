# DevPrep AI

DevPrep AI is a developer learning platform for beginner and intermediate JavaScript learners. Phase 1 provides an accessible landing page, curated challenges, progressive hints, a sample dashboard, and a clearly labeled tutor demo built from predefined responses.

> **Demo — predefined responses:** This version does not use live AI, analyze arbitrary code, execute code, save progress, or require credentials.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Local setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. No environment variables are needed. `.env.example` intentionally contains no credentials.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
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
- Any other route — not-found page

## Honest limitations

- Tutor answers and hints are local curated content, not model output.
- Arbitrary questions and code are not analyzed.
- No code is executed or verified.
- The dashboard contains sample content only; Phase 1 has no accounts or persistence.
- Supabase, authenticated quizzes, and saved drafts belong to later phases and are not installed.
- Nothing has been deployed or provisioned.

See [the project plan](docs/project-plan.md), [architecture notes](docs/architecture.md), and [progress record](docs/progress.md).
