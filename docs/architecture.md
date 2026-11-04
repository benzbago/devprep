# Phase 1 Architecture

## Runtime shape

Phase 1 is a static client-side React application. Vite compiles TypeScript, React Router maps browser routes, Tailwind generates the visual system, and all tutor content is bundled as immutable TypeScript data.

```text
Browser
  ├─ React application shell
  ├─ React Router routes
  ├─ bundled challenge and tutor demo records
  └─ in-memory interaction state
```

There is no API, database, authentication service, model provider, streaming connection, persistence layer, or code runner in Phase 1.

## Key boundaries

- `src/app/` owns routing and composition.
- `src/components/` owns reusable shell elements.
- `src/features/` keeps each page and its behavior together.
- `src/features/tutor-demo/demo-content.ts` is the sole curated tutor data source.
- Tutor state is ephemeral React state. Reloading resets it.
- The dashboard is explicitly sample content and does not read tutor state.

## Demo contract

The tutor accepts selection only from visible curated controls. It returns the exact matching local response synchronously. The “different question” control explains that live AI is unavailable; it does not inspect or classify user text. No artificial streaming or delay is used.

## Future routing

Vercel deployment and SPA rewrites are deferred to Phase 5. Before deployment, routing must preserve `/api/*` for future Functions and use the SPA fallback only for non-API paths. Current Playwright tests verify direct client routes through Vite preview, not Vercel production rewrites.
