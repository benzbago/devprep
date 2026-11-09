# Data deletion

DevPrep stores only the email needed by Supabase Auth, user-owned code drafts, and authoritative quiz attempts.

Study recommendations are computed when the signed-in dashboard loads. They are not stored as a profile or separate record, so deleting the underlying account and attempts also removes their evidence.

## Delete drafts

Signed-in users can delete individual drafts from `/drafts`. RLS ensures the request can affect only the current user's records.

## Delete an account

Self-service Auth-user deletion is deliberately not implemented in Phase 2 because it requires a privileged server operation. Before any public hosted signup is enabled, the project owner must publish a contact route and deletion procedure.

For local development, remove the test user through local Supabase Studio or the Auth admin API used by the authenticated browser suite. For a future hosted project, the owner must use the supported Supabase Dashboard Auth-user deletion flow:

1. Verify the requester's identity outside the public client.
2. Delete the user from Supabase Dashboard → Authentication → Users.
3. Confirm the user's `code_drafts` and `quiz_attempts` rows were removed by their `ON DELETE CASCADE` foreign keys.

The hosted release test must create a confirmed user through the Auth admin flow, create one draft and one quiz attempt, delete that Auth user through the supported admin deletion flow, and verify both owner-row counts are zero. Do not delete rows directly as a substitute for this cascade check.

The local pgTAP suites verify both cascades against real PostgreSQL. Quiz attempts are intentionally immutable to browser users; account deletion is their deletion path.

Never send a service-role key to a user or ask them to paste credentials into chat. Database space may not be reclaimed immediately because PostgreSQL vacuuming is asynchronous.
