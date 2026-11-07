# Security Notes

## Phase 3 attack surface

Public demo routes remain static and credential-free. Optional account routes use Supabase Auth and the Data API. Authenticated grading adds one bounded Vercel Function and one service-role-only PostgreSQL function. Browser code receives only the public URL and publishable key.

## Enforced exclusions

- No OpenAI or other model SDK.
- No service-role or server secret in browser code.
- No fetch/XHR request in the tutor demo; component and browser tests enforce this behavior.
- No `eval`, `new Function`, worker-based execution, subprocess, or third-party runner.
- No raw HTML or model-generated Markdown rendering.
- Saved drafts are labeled “Not executed or verified.”
- Separate SELECT, INSERT, UPDATE, and DELETE policies bind `auth.uid()` to `user_id`.
- Request generations prevent a late response from a previous account repopulating private state.
- Grading accepts at most 16 KiB, 20 unique questions, bounded option indexes, and five new attempts per user per rolling minute.
- Supabase Auth verifies bearer tokens server-side; a client-supplied identity or score is never accepted.
- Published quiz versions, questions, and answer keys are immutable.
- Browser roles cannot use the private schema, execute grading, or insert/update/delete attempts.
- Exact retries are idempotent under concurrent requests; changed content cannot reuse a submission UUID.

## Environment files

`.env`, `.env.*`, and `*.local` are ignored. `.env.example` contains names and warnings only. `VITE_` values are public. `SUPABASE_SECRET_KEY` or the local legacy service-role key exists only in server/test processes and must never use a `VITE_` prefix.

## Answer-key threat model

Authenticated answer keys are absent from frontend modules, API responses, and production browser assets. They are stored in a non-exposed private schema and reached only inside the server-authorized grading transaction.

The repository is intended for a public portfolio, so committed SQL seed values remain visible to repository readers. The application protects answers from ordinary browser/API access; it does not claim secrecy from someone who can inspect repository history.

## Still excluded

Recommendations remain Phase 4 work. Live AI and code execution remain excluded from Version 1.
