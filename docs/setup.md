# Phase 3 local setup

Public demo routes require only Node.js 24+ and npm 11+. Supabase is optional unless you are developing or testing accounts, drafts, or authenticated quizzes.

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
```

Do not put a service-role key in any `VITE_` variable. Vite exposes all `VITE_` values to the browser.

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
