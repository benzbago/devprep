begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_table('public', 'code_drafts', 'code_drafts exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.code_drafts'::regclass),
  'RLS is enabled'
);
select is(
  (select array_agg(privilege_type::text order by privilege_type)
   from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name = 'code_drafts'
     and grantee = 'authenticated'),
  array['DELETE', 'INSERT', 'SELECT', 'UPDATE']::text[],
  'authenticated receives exactly the four draft CRUD grants'
);
select is(
  (select count(*)::integer
   from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name = 'code_drafts'
     and grantee = 'anon'),
  0,
  'anonymous receives no draft table grants'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', '', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', '', now(), now(), now());

set local role anon;
select throws_ok(
  $$ select * from public.code_drafts $$,
  '42501',
  null,
  'anonymous users have no table privileges'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select lives_ok(
  $$ insert into public.code_drafts (user_id, challenge_id, title, code)
     values ('11111111-1111-1111-1111-111111111111', 'reverse-string', 'Owner draft', 'const answer = 1;') $$,
  'an owner can create a draft'
);
select results_eq(
  $$ select count(*)::integer from public.code_drafts $$,
  array[1],
  'an owner can read their draft'
);
select lives_ok(
  $$ update public.code_drafts set title = 'Updated draft' where title = 'Owner draft' $$,
  'an owner can update their draft'
);
select throws_ok(
  $$ insert into public.code_drafts (user_id, challenge_id, title, code)
     values ('22222222-2222-2222-2222-222222222222', 'reverse-string', 'Spoofed', '') $$,
  '42501',
  null,
  'a user cannot create a draft for another user'
);
select throws_ok(
  $$ update public.code_drafts set user_id = '22222222-2222-2222-2222-222222222222' $$,
  '42501',
  null,
  'a user cannot transfer draft ownership'
);
select throws_ok(
  $$ insert into public.code_drafts (user_id, challenge_id, title, code)
     values ('11111111-1111-1111-1111-111111111111', 'reverse-string', '   ', '') $$,
  '23514',
  null,
  'blank titles fail the database constraint'
);
select throws_ok(
  $$ insert into public.code_drafts (user_id, challenge_id, title, code)
     values ('11111111-1111-1111-1111-111111111111', 'reverse-string', 'Too large', repeat('x', 50001)) $$,
  '23514',
  null,
  'oversized code fails the database constraint'
);

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select results_eq(
  $$ select count(*)::integer from public.code_drafts $$,
  array[0],
  'another user cannot read the owner draft'
);
select results_eq(
  $$ update public.code_drafts set title = 'Stolen' returning 1 $$,
  array[]::integer[],
  'another user cannot update the owner draft'
);
select results_eq(
  $$ delete from public.code_drafts returning 1 $$,
  array[]::integer[],
  'another user cannot delete the owner draft'
);

reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::integer from public.code_drafts where user_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'deleting an auth user cascades to their drafts'
);

select * from finish();
rollback;
