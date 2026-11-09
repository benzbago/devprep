# Phase 5 local release setup

Public demo routes require only Node.js 24+ and npm 11+. Supabase is optional unless you are developing or testing accounts, drafts, or authenticated quizzes.

Run the public automated accessibility checks after building:

```powershell
npm run build
npm run test:e2e:a11y
```

The suite uses axe for serious/critical WCAG A/AA findings, checks 320-pixel layouts for horizontal overflow, and verifies the sample result receives keyboard focus without a second live-region announcement. Automated checks supplement rather than replace manual keyboard and screen-reader review.

## Prerequisites for account features

The local Supabase CLI requires a Docker-compatible container runtime. Check for an existing runtime before continuing; do not install or reconfigure system software merely for this project.

This runtime is a development/test prerequisite only. DevPrep does not ship or deploy containerized application infrastructure.

```powershell
$runtimeCommands = 'docker', 'podman', 'nerdctl'
foreach ($name in $runtimeCommands) {
  $command = Get-Command $name -ErrorAction SilentlyContinue
  if ($command) {
    & $name --version
    switch ($name) {
      'docker' { docker version }
      'podman' { podman info }
      'nerdctl' { nerdctl info }
    }
  } else {
    Write-Host "$name is not available on PATH"
  }
}

Get-Service -Name 'com.docker.service', 'podman*', 'rancher-desktop*' `
  -ErrorAction SilentlyContinue |
  Format-Table -AutoSize Name, Status, StartType

npx supabase --version
```

Run these commands in a normal VS Code PowerShell terminal opened at the repository root. If `npx supabase --version` works but none of the runtime commands or services exists, the CLI is installed but cannot start the local stack.

Install one compatible runtime manually before continuing. [Supabase recommends Docker Desktop on Windows](https://supabase.com/docs/guides/local-development), and the [official Docker Desktop Windows guide](https://docs.docker.com/desktop/setup/install/windows-install/) lists current system requirements and installation steps. Podman Desktop and Rancher Desktop are possible alternatives but can require extra configuration. Review the runtime's current license and system requirements yourself. Restart the terminal afterward and rerun the checks above. DevPrep does not install the runtime, change Windows features, start a paid trial, or alter system settings automatically.

Then start the checked-in local stack:

```powershell
npx supabase start
npx supabase status
npx supabase db reset
```

Copy only the local API URL and publishable/anonymous key into an untracked `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
VITE_ENABLE_SIGNUP=true
```

Do not put a service-role key in any `VITE_` variable. Vite exposes all `VITE_` values to the browser.

`VITE_ENABLE_SIGNUP` controls presentation only. Signup is hidden unless its exact value is `true`; this opt-in is intended for local Mailpit testing. It does not change Supabase authorization or Auth settings. A future hosted project must separately disable public registration in Supabase Auth and should leave the UI flag false.

For interactive authenticated quiz grading, provide the local server credential only to
the Vite process and enable the local API adapter:

```powershell
$localStatus = npx supabase status -o json | ConvertFrom-Json
$env:SUPABASE_SERVICE_ROLE_KEY = $localStatus.SERVICE_ROLE_KEY
$env:DEVPREP_LOCAL_API = '1'
npm run dev
```

Clear both variables when the development server stops. Without the adapter, public
pages and client-side account/draft features still work, but `/api/quizzes/grade` is not
served by Vite. Local confirmation emails are captured by Mailpit at the URL reported
by `npx supabase status`; they are not sent externally.

## Local routing verification

The routing suite accepts an explicitly started server so its evidence identifies the runtime under test. Start the Vite development server in the first PowerShell terminal:

```powershell
$localStatus = npx supabase status -o json | ConvertFrom-Json
$env:SUPABASE_URL = $localStatus.API_URL
$env:SUPABASE_PUBLISHABLE_KEY = $localStatus.PUBLISHABLE_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $localStatus.SERVICE_ROLE_KEY
$env:DEVPREP_LOCAL_API = '1'
npm run dev -- --host 127.0.0.1 --port 4173
```

Run the suite in a second PowerShell terminal:

```powershell
$env:DEVPREP_ROUTING_BASE_URL = 'http://127.0.0.1:4173'
$env:DEVPREP_ROUTING_RUNTIME = 'vite-adapter'
npm run test:e2e:routing
Remove-Item Env:DEVPREP_ROUTING_BASE_URL,Env:DEVPREP_ROUTING_RUNTIME `
  -ErrorAction SilentlyContinue
```

After the suite, stop Vite with `Ctrl+C` in the first terminal and clear its process-only values:

```powershell
Remove-Item Env:SUPABASE_URL,Env:SUPABASE_PUBLISHABLE_KEY,Env:SUPABASE_SERVICE_ROLE_KEY,Env:DEVPREP_LOCAL_API `
  -ErrorAction SilentlyContinue
```

With `DEVPREP_LOCAL_API=1`, the Vite adapter verifies SPA deep links, its real source module, grading-handler `405`/`401` responses, and JSON `404` responses for unknown `/api/*` paths (including paths beneath the grading route). The `405` assertion is deliberately platform-neutral because Vercel may reject unsupported methods before invoking the handler. This is not proof of `vercel.json` behavior. Vercel CLI 65.12.1 was downloaded and `vercel dev` was attempted without linking a project, but it refused to start without Vercel credentials. Actual Vercel-runtime and hosted routing checks remain pending until Stage 2 authorization.

## Database and authenticated browser tests

With the local stack running, reset it from the checked-in migrations and run the database suite:

```powershell
npm run test:db
```

`supabase db reset` deletes only the local Supabase database and rebuilds it from versioned migrations. Never run it against a linked or hosted project for this verification task.

For the authenticated Playwright test, build with the local public values and provide the local service-role key only to the Playwright process:

```powershell
$localStatus = npx supabase status -o json | ConvertFrom-Json
$env:VITE_SUPABASE_URL = $localStatus.API_URL
$env:VITE_SUPABASE_PUBLISHABLE_KEY = $localStatus.PUBLISHABLE_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $localStatus.SERVICE_ROLE_KEY
npm run test:e2e:auth
npm run test:integration:quiz
$env:DEVPREP_LOCAL_API = '1'
npm run test:e2e:quiz
Remove-Item Env:DEVPREP_LOCAL_API -ErrorAction SilentlyContinue
```

The dedicated commands fail before Vitest or Playwright if any required value is absent. Successful authenticated browser results must say `1 passed`; a skipped-only run is not verification. The quiz browser test uses an opt-in local Vite adapter around the real Web handler. It verifies local behavior but not deployed Vercel routing.

Clear all test values afterward:

```powershell
Remove-Item Env:VITE_SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:VITE_SUPABASE_PUBLISHABLE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_PUBLISHABLE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
```

Never commit these values or use a hosted service-role key for local tests.

For the grading Function, local tests accept `SUPABASE_SERVICE_ROLE_KEY` as the server credential. A future Vercel environment should use the server-only `SUPABASE_SECRET_KEY` name. Neither value may be prefixed with `VITE_`.

## Prove the database suite fails on an assertion

After the normal database suite passes, temporarily change one expected pgTAP result in `supabase/tests/code_drafts_rls_test.sql`, run `npm run test:db`, and confirm a non-zero exit code:

```powershell
npm run test:db
if ($LASTEXITCODE -eq 0) { throw 'Expected the intentionally broken pgTAP assertion to fail' }
```

Immediately undo only that temporary test edit, rerun `npm run test:db`, and require exit code zero. Do not weaken or replace the real policies.

## Hosted setup is deferred

No hosted project is required or provisioned in Phase 2. If hosted signup is later approved, apply migrations deliberately, configure allowed URLs, and review Auth email settings first.

Supabase's default hosted email sender is restricted to addresses belonging to the project's team and is also rate-limited. It is unsuitable for public signup. Phase 2 does not add an SMTP provider, disable email confirmation automatically, or claim that public production signup is ready. See [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords).

## Hosted Stage 2 runbook — not authorized yet

Do not execute this section during Stage 1.

1. Create one Supabase Free project without a payment method or paid add-on.
2. Link only after displaying and confirming the project reference.
3. Review `npx supabase migration list --remote` and `npx supabase db push --dry-run --remote`.
4. Apply `20261104000100_create_code_drafts.sql`, then `20261107000100_create_quizzes.sql` through `npx supabase db push --remote`. Never run a remote reset or copy migrations into the Dashboard SQL editor.
5. Create one confirmed test user through the supported Supabase Auth admin flow. Do not open public signup, add SMTP, or disable email confirmation globally.
6. Disable public email registration in hosted Supabase Auth settings. Keep `VITE_ENABLE_SIGNUP=false` in Vercel; the UI flag and Auth setting are separate controls.
7. Configure only these Vercel values:
   - Browser-visible: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ENABLE_SIGNUP=false`.
   - Server-only: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
   - Do not configure `SUPABASE_SERVICE_ROLE_KEY` or `DEVPREP_LOCAL_API` for hosted environments.
8. Verify the public demo while signed out, SPA deep-link refreshes, a non-HTML unknown-API `404`, grading-handler `405`/`401`, then authenticated draft and quiz persistence.
9. For cleanup, create a draft and graded attempt for the confirmed test user, delete the Auth user through the supported admin deletion flow, and verify both `code_drafts` and `quiz_attempts` contain zero rows for that user.
10. Roll back frontend defects by promoting the last known-good Vercel deployment. Correct database defects with a new forward migration; never edit an applied migration or reset a hosted database. Rotate a leaked secret before redeployment.
