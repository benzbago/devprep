# Security Notes

## Phase 1 attack surface

Phase 1 has no credentials, server APIs, database, authentication, user records, or code execution. The public app displays local static data and stores interaction state only in memory.

## Enforced exclusions

- No OpenAI or other model SDK.
- No environment secrets.
- No fetch/XHR request in the tutor demo; component and browser tests enforce this behavior.
- No `eval`, `new Function`, worker-based execution, subprocess, or third-party runner.
- No raw HTML or model-generated Markdown rendering.
- No saved drafts, authoritative scores, or claims of verified completion.

## Environment files

`.env`, `.env.*`, and `*.local` are ignored. `.env.example` is the only exception and contains no secret or required value.

## Later phases

Authentication, persistence, server validation, private quiz answers, explicit grants, RLS, ownership tests, and deletion behavior belong to Phases 2–4. Their presence in the project plan is not evidence that they are implemented.
