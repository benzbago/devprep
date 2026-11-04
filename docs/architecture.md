# Phase 2 Architecture

## Runtime shape

Public routes remain a static client-side React application. Optional account routes add a Supabase browser client whose requests are authorized by PostgreSQL RLS.

```text
Browser
  ├─ React application shell
  ├─ React Router routes
  ├─ bundled challenge and tutor demo records
  ├─ in-memory public interaction state
  └─ optional Supabase Auth session and owner-scoped draft requests

Local Supabase
  ├─ Auth users and sessions
  └─ PostgreSQL code_drafts table with explicit grants and RLS
```

There is no custom server API, model provider, streaming connection, quiz service, or code runner. Normal draft CRUD goes directly through Supabase's Data API because RLS is the enforcement boundary.

## Key boundaries

- `src/app/` owns routing and composition.
- `src/components/` owns reusable shell elements.
- `src/features/` keeps each page and its behavior together.
- `src/features/tutor-demo/demo-content.ts` is the sole curated tutor data source.
- Tutor state is ephemeral React state. Reloading resets it.
- The dashboard is explicitly sample content and does not read tutor state.
- `src/features/auth/` owns optional session state and configuration fallback.
- `src/features/drafts/` owns draft validation, persistence, and stale-request protection.
- Draft text is capped at 50,000 characters in both client validation and PostgreSQL constraints.
- Public routes do not require Supabase configuration.

## Demo contract

The tutor accepts selection only from visible curated controls. It returns the exact matching local response synchronously. The “different question” control explains that live AI is unavailable; it does not inspect or classify user text. No artificial streaming or delay is used.

## Future routing

Vercel deployment and SPA rewrites are deferred to Phase 5. Before deployment, routing must preserve `/api/*` for future Functions and use the SPA fallback only for non-API paths. Current Playwright tests verify direct client routes through Vite preview, not Vercel production rewrites.
