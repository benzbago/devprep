# Data deletion

DevPrep stores only the email needed by Supabase Auth and user-owned code drafts.

## Delete drafts

Signed-in users can delete individual drafts from `/drafts`. RLS ensures the request can affect only the current user's records.

## Delete an account

Self-service Auth-user deletion is deliberately not implemented in Phase 2 because it requires a privileged server operation. Before any public hosted signup is enabled, the project owner must publish a contact route and deletion procedure.

For local development, remove the test user through local Supabase Studio. For a future hosted project, the owner must:

1. Verify the requester's identity outside the public client.
2. Delete the user from Supabase Dashboard → Authentication → Users.
3. Confirm the user's `code_drafts` rows were removed by the `ON DELETE CASCADE` foreign key.

Never send a service-role key to a user or ask them to paste credentials into chat. Database space may not be reclaimed immediately because PostgreSQL vacuuming is asynchronous.
