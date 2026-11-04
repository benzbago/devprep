create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.code_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null check (char_length(btrim(challenge_id)) between 1 and 100),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  code text not null default '' check (char_length(code) <= 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index code_drafts_user_updated_idx
  on public.code_drafts (user_id, updated_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger code_drafts_set_updated_at
before update on public.code_drafts
for each row execute function private.set_updated_at();

revoke all on table public.code_drafts from public, anon, authenticated;
grant select, insert, update, delete on table public.code_drafts to authenticated;

alter table public.code_drafts enable row level security;

create policy "Users can read their own drafts"
on public.code_drafts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own drafts"
on public.code_drafts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own drafts"
on public.code_drafts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own drafts"
on public.code_drafts for delete
to authenticated
using ((select auth.uid()) = user_id);
