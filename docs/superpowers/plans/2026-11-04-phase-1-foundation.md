# DevPrep AI Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the credential-free DevPrep AI Phase 1 frontend with an accessible shell, honest predefined tutor demo, sample dashboard, automated tests, CI, and setup documentation.

**Architecture:** A single strict TypeScript Vite SPA uses feature-focused React modules and bundled immutable demo data. React Router owns client routes; no API, authentication, database, AI provider, persistence, or execution boundary is introduced in this phase.

**Tech Stack:** React, TypeScript, Vite, React Router, Tailwind CSS, Lucide React, Vitest, React Testing Library, Playwright, ESLint, Prettier, GitHub Actions.

**Spec:** `docs/project-plan.md`

## Global Constraints

- Phase 1 only; no Supabase, Vercel Functions, OpenAI/model SDK, paid service, AI usage infrastructure, code execution, or external resource.
- Demo mode performs no external service calls and does not simulate streaming or imply analysis of arbitrary input.
- Every tutor view displays exactly `Demo — predefined responses` as an always-visible status.
- Dashboard data is explicitly sample content and must not imply persistence or authenticated progress.
- Use strict TypeScript, accessible semantics, visible focus, reduced-motion-safe styling, and responsive layouts.
- Do not commit, push, provision, or deploy.

## Review Focus

- An unsupported or free-form tutor question must explain that live AI is unavailable, without claiming it was analyzed; pin in Task 3 component tests.
- Repeated hint requests must reveal at most the three curated levels and then remain stable; pin in Task 3 component tests.
- Direct navigation to `/tutor` and an unknown route must render the correct page; pin in Task 5 Playwright tests.
- Mobile navigation must expose the same destinations with an accessible control; pin in Task 2 component tests and Task 5 Playwright tests.
- The app must make no fetch/XHR requests during the demo journey; pin in Task 5 Playwright tests.

---

### Task 1: Toolchain and Test Harness

**Files:**

- Create: `package.json`, `package-lock.json`, TypeScript/Vite/Tailwind/ESLint/Prettier/Playwright configuration, `.gitignore`, `.env.example`, `index.html`
- Create: `src/test/setup.ts`, `src/main.tsx`, `src/styles.css`
- Test: `src/app/App.test.tsx`

**Interfaces:**

- Produces: scripts `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:run`, `test:e2e`; `render(<App />)` test environment.

- [ ] Create the strict toolchain and minimal failing app smoke test.
- [ ] Run the smoke test and verify it fails because `App` does not exist.
- [ ] Add the minimal `App` shell and global Tailwind entry so the test passes.
- [ ] Run the focused test, typecheck, and build.

### Task 2: Accessible Application Shell and Routes

**Files:**

- Create: `src/app/App.tsx`, `src/app/router.tsx`, `src/components/AppLayout.tsx`, `src/components/BrandMark.tsx`
- Create: `src/features/landing/LandingPage.tsx`, `src/features/dashboard/DashboardPage.tsx`, `src/features/not-found/NotFoundPage.tsx`
- Test: `src/components/AppLayout.test.tsx`, `src/app/router.test.tsx`

**Interfaces:**

- Produces: routes `/`, `/tutor`, `/dashboard`, `*`; desktop/mobile navigation with `aria-label="Primary navigation"`.

- [ ] Write failing navigation, landmark, route, and mobile-menu tests.
- [ ] Run them and confirm the missing components/routes fail.
- [ ] Implement the shell and honest landing/dashboard/not-found content.
- [ ] Run focused tests and accessibility-oriented assertions.

### Task 3: Curated Tutor Demo and Progressive Hints

**Files:**

- Create: `src/features/tutor-demo/demo-content.ts`, `src/features/tutor-demo/TutorPage.tsx`, `src/features/tutor-demo/TutorPage.test.tsx`
- Modify: `src/app/router.tsx`

**Interfaces:**

- Produces: immutable `DemoQuestion` records with `id`, `question`, `answer`, and exactly three `hints`; selectable supported prompts; unsupported-question disclosure; no network calls.

- [ ] Write failing tests for the permanent demo label, question selection, deterministic answers, progressive hint bounds, reset, and unsupported-question disclosure.
- [ ] Run them and confirm failure for missing tutor behavior.
- [ ] Implement synchronous predefined responses and hints without timers, artificial streaming, or arbitrary-input analysis.
- [ ] Run the focused tests and full component suite.

### Task 4: Visual System and Responsive Page Content

**Files:**

- Modify: `src/styles.css`, landing, dashboard, tutor, shell, and not-found components
- Test: relevant existing component tests

**Interfaces:**

- Consumes: Task 2 routes and Task 3 tutor behavior.
- Produces: dark-first responsive UI, restrained blue/violet accents, skip link, focus styles, reduced-motion rules, and sample-content dashboard disclosure.

- [ ] Add assertions for critical labels, headings, and accessible controls before styling changes.
- [ ] Implement responsive Tailwind classes and semantic page content.
- [ ] Run component tests, lint, typecheck, and production build.

### Task 5: Playwright Smoke Coverage and CI

**Files:**

- Create: `e2e/smoke.spec.ts`, `.github/workflows/ci.yml`
- Modify: `playwright.config.ts`, `package.json`

**Interfaces:**

- Consumes: all public routes and tutor controls.
- Produces: Chromium smoke tests for landing-to-tutor, direct routes, mobile navigation, keyboard focus, not-found behavior, and zero demo network requests; standard Ubuntu GitHub Actions workflow.

- [ ] Write E2E tests and run them against the production preview.
- [ ] Correct only failures within the approved Phase 1 behavior.
- [ ] Add CI steps for install, formatting, lint, typecheck, unit tests, build, browser install, and E2E with no unnecessary artifact retention.
- [ ] Run the complete local verification sequence.

### Task 6: Setup, Architecture, Security, and Progress Documentation

**Files:**

- Create: `README.md`, `docs/architecture.md`, `docs/security.md`, `docs/progress.md`
- Modify: `docs/project-plan.md`

**Interfaces:**

- Consumes: verified commands and implemented Phase 1 behavior.
- Produces: credential-free setup instructions, honest limitations, architecture/trust boundaries, actual verification ledger, and Phase 1 completion status.

- [ ] Document installation, local development, checks, demo behavior, and exclusions.
- [ ] Record actual command results and known limitations in `docs/progress.md`.
- [ ] Search dependencies and source for prohibited services/execution patterns.
- [ ] Run the final formatting, lint, typecheck, test, build, and E2E checks and record exact results.
