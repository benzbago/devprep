# Security Notes

## Phase 2 attack surface

Public demo routes remain static and credential-free. Optional account routes use Supabase Auth and the Data API. Browser code receives only the public URL and publishable key; PostgreSQL grants, constraints, and RLS are the authority for private drafts.

## Enforced exclusions

- No OpenAI or other model SDK.
- No service-role or server secret in browser code.
- No fetch/XHR request in the tutor demo; component and browser tests enforce this behavior.
- No `eval`, `new Function`, worker-based execution, subprocess, or third-party runner.
- No raw HTML or model-generated Markdown rendering.
- Saved drafts are labeled “Not executed or verified.”
- Separate SELECT, INSERT, UPDATE, and DELETE policies bind `auth.uid()` to `user_id`.
- Request generations prevent a late response from a previous account repopulating private state.

## Environment files

`.env`, `.env.*`, and `*.local` are ignored. `.env.example` contains names and warnings only. `VITE_` values are public; a service-role key must never use that prefix.

## Later phases

Private quiz answers, authoritative scores, recommendations, live AI, and code execution remain unimplemented future or excluded work.
