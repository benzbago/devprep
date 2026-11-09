# DevPrep portfolio notes

## Accurate project description

DevPrep is a React and TypeScript developer-learning platform for curated JavaScript practice. It demonstrates accessible frontend flows, Supabase authentication and owner-scoped persistence, PostgreSQL grants and Row Level Security, private answer storage, authoritative server-side quiz grading, idempotent submissions, and deterministic recommendations.

> **Demo — predefined responses:** The tutor uses curated conversations and progressive hints. It does not call a model or analyze arbitrary questions or code.

## Safe claims

- Public challenges, tutor examples, and a sample quiz work without credentials.
- Authenticated drafts are private and always labeled “Not executed or verified.”
- Authenticated quizzes are graded by a bounded server handler; clients cannot assign scores.
- Study recommendations are explainable rules over the signed-in user's own authoritative attempts, not AI output.
- Real local PostgreSQL tests cover grants, RLS, cross-user denial, private answer isolation, grading, idempotency, rate limits, and account-deletion cascades.
- Automated accessibility checks supplement a planned manual Windows keyboard and screen-reader walkthrough.

## Claims to avoid

- Live AI, model integration, arbitrary-code analysis, or measured AI performance.
- Code execution, automated code verification, or execution-based completion.
- Secret answer protection from repository readers: SQL seed answers are visible in this public portfolio repository.
- Unlimited or permanently free hosting, a production SLA, or public signup readiness.
- Verified GitHub Actions or Vercel routing until those hosted checks actually run.

## Release evidence

Before publishing a portfolio link, record the checkpoint SHA, local and hosted test results, accessibility walkthrough results, architecture/security notes, and redacted screenshots. Screenshots must not contain email addresses, tokens, draft contents, user identifiers, or server keys.
