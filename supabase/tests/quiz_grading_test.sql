begin;

create extension if not exists pgtap with schema extensions;
select plan(45);

select has_table('public', 'quizzes', 'versioned quizzes exist');
select has_table('public', 'quiz_questions', 'quiz questions exist');
select has_table('private', 'quiz_answer_keys', 'private answer keys exist');
select has_table('public', 'quiz_attempts', 'authoritative attempts exist');
select has_function(
  'public',
  'grade_quiz_attempt',
  array['uuid', 'text', 'integer', 'uuid', 'jsonb'],
  'grading function exists with the server contract'
);

select ok((select relrowsecurity from pg_class where oid = 'public.quizzes'::regclass), 'quiz RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.quiz_questions'::regclass), 'question RLS is enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.quiz_attempts'::regclass), 'attempt RLS is enabled');

select is(
  (select array_agg(privilege_type::text order by privilege_type)
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'quizzes' and grantee = 'authenticated'),
  array['SELECT']::text[],
  'authenticated receives read-only quiz access'
);
select is(
  (select array_agg(privilege_type::text order by privilege_type)
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'quiz_questions' and grantee = 'authenticated'),
  array['SELECT']::text[],
  'authenticated receives read-only question access'
);
select is(
  (select array_agg(privilege_type::text order by privilege_type)
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'quiz_attempts' and grantee = 'authenticated'),
  array['SELECT']::text[],
  'authenticated receives read-only attempt access'
);
select is(
  (select count(*)::integer from information_schema.role_table_grants
   where table_schema in ('public', 'private')
     and table_name in ('quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_answer_keys')
     and grantee = 'anon'),
  0,
  'anonymous receives no authenticated quiz table grants'
);
select is(
  (select count(*)::integer from information_schema.role_table_grants
   where table_schema = 'private' and table_name = 'quiz_answer_keys'
     and grantee = 'authenticated'),
  0,
  'authenticated cannot read private answers'
);
select ok(
  has_function_privilege('service_role', 'public.grade_quiz_attempt(uuid,text,integer,uuid,jsonb)', 'EXECUTE'),
  'service role can execute grading'
);
select ok(
  not exists (
    select 1
    from pg_proc as procedure
    cross join lateral aclexplode(
      coalesce(procedure.proacl, acldefault('f', procedure.proowner))
    ) as privilege
    where procedure.oid = 'public.grade_quiz_attempt(uuid,text,integer,uuid,jsonb)'::regprocedure
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute grading'
);
select ok(
  not has_function_privilege('anon', 'public.grade_quiz_attempt(uuid,text,integer,uuid,jsonb)', 'EXECUTE'),
  'anonymous cannot execute grading'
);
select ok(
  not has_function_privilege('authenticated', 'public.grade_quiz_attempt(uuid,text,integer,uuid,jsonb)', 'EXECUTE'),
  'authenticated cannot execute grading directly'
);
select ok(has_schema_privilege('service_role', 'private', 'USAGE'), 'service role can use private schema');
select ok(has_table_privilege('service_role', 'private.quiz_answer_keys', 'SELECT'), 'service role can read answer keys');
select ok(not has_schema_privilege('authenticated', 'private', 'USAGE'), 'authenticated cannot use private schema');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quiz-one@example.test', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quiz-two@example.test', '', now(), now(), now());

set local role anon;
select throws_ok($$ select * from public.quizzes $$, '42501', null, 'anonymous cannot read authenticated quizzes');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select results_eq($$ select count(*)::integer from public.quizzes $$, array[1], 'authenticated sees published quiz versions');
select results_eq($$ select count(*)::integer from public.quiz_questions $$, array[3], 'authenticated sees published questions without answers');
select throws_ok(
  $$ insert into public.quiz_attempts (user_id, quiz_id, quiz_version, submission_id, selected_answers, correct_count, question_count, score_percent)
     values ('11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1, gen_random_uuid(), '[]', 99, 3, 100) $$,
  '42501', null, 'clients cannot insert authoritative scores'
);
select throws_ok(
  $$ select * from public.grade_quiz_attempt('11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1, gen_random_uuid(), '[]') $$,
  '42501', null, 'authenticated clients cannot invoke grading'
);

reset role;
set local role service_role;
select lives_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '[{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":1},{"questionId":"10000000-0000-4000-8000-000000000002","optionIndex":2},{"questionId":"10000000-0000-4000-8000-000000000003","optionIndex":0}]'
  ) $$,
  'service role grades a complete submission'
);
select results_eq(
  $$ select correct_count, question_count, score_percent from public.quiz_attempts
     where submission_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' $$,
  $$ values (3, 3, 100) $$,
  'database assigns the authoritative score'
);
select is(
  (select count(*)::integer from public.quiz_attempts where submission_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1,
  'one authoritative attempt is stored'
);
select lives_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '[{"questionId":"10000000-0000-4000-8000-000000000003","optionIndex":0},{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":1},{"questionId":"10000000-0000-4000-8000-000000000002","optionIndex":2}]'
  ) $$,
  'an identical retry is idempotent regardless of answer order'
);
select is(
  (select count(*)::integer from public.quiz_attempts where submission_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  1,
  'sequential retry creates no second attempt'
);
select throws_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '[{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":0},{"questionId":"10000000-0000-4000-8000-000000000002","optionIndex":2},{"questionId":"10000000-0000-4000-8000-000000000003","optionIndex":0}]'
  ) $$,
  'P0001', 'IDEMPOTENCY_CONFLICT', 'changed content cannot reuse a submission UUID'
);
select throws_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1,
    gen_random_uuid(),
    '[{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":1},{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":1},{"questionId":"10000000-0000-4000-8000-000000000003","optionIndex":0}]'
  ) $$,
  'P0001', 'INVALID_SUBMISSION', 'duplicate question IDs are rejected'
);
select throws_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1,
    gen_random_uuid(),
    '[{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":1},{"questionId":"10000000-0000-4000-8000-000000000002","optionIndex":2}]'
  ) $$,
  'P0001', 'INVALID_SUBMISSION', 'missing questions are rejected'
);
select throws_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 1,
    gen_random_uuid(),
    '[{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":9},{"questionId":"10000000-0000-4000-8000-000000000002","optionIndex":2},{"questionId":"10000000-0000-4000-8000-000000000003","optionIndex":0}]'
  ) $$,
  'P0001', 'INVALID_SUBMISSION', 'out-of-range option indexes are rejected'
);
select throws_ok(
  $$ select * from public.grade_quiz_attempt(
    '11111111-1111-4111-8111-111111111111', 'javascript-foundations', 99,
    gen_random_uuid(),
    '[{"questionId":"10000000-0000-4000-8000-000000000001","optionIndex":1}]'
  ) $$,
  'P0001', 'QUIZ_NOT_FOUND', 'unknown quiz versions are rejected'
);

reset role;
select lives_ok($$ update public.quizzes set title = title where false $$, 'empty updates are harmless');
select throws_ok(
  $$ update public.quizzes set title = 'Changed' where id = 'javascript-foundations' and version = 1 $$,
  'P0001', 'PUBLISHED_QUIZ_IMMUTABLE', 'published quiz versions are immutable'
);
select throws_ok(
  $$ delete from public.quiz_questions where quiz_id = 'javascript-foundations' and quiz_version = 1 $$,
  'P0001', 'PUBLISHED_QUIZ_IMMUTABLE', 'published questions are immutable'
);
select throws_ok(
  $$ insert into public.quiz_questions (id, quiz_id, quiz_version, position, prompt, options)
     values (gen_random_uuid(), 'javascript-foundations', 1, 4, 'Added later?', '["No","Yes"]') $$,
  'P0001', 'PUBLISHED_QUIZ_IMMUTABLE', 'questions cannot be added to published versions'
);
select throws_ok(
  $$ insert into private.quiz_answer_keys (question_id, quiz_id, quiz_version, correct_option)
     values (gen_random_uuid(), 'javascript-foundations', 1, 0) $$,
  'P0001', 'PUBLISHED_QUIZ_IMMUTABLE', 'answer keys cannot be added to published versions'
);
insert into public.quizzes (id, version, title, description, topic, question_count)
values ('draft-quiz', 1, 'Draft quiz', 'Draft only.', 'JavaScript', 1);
insert into public.quiz_questions (id, quiz_id, quiz_version, position, prompt, options)
values ('30000000-0000-4000-8000-000000000001', 'draft-quiz', 1, 1, 'Draft?', '["No","Yes"]');
insert into private.quiz_answer_keys (question_id, quiz_id, quiz_version, correct_option)
values ('30000000-0000-4000-8000-000000000001', 'draft-quiz', 1, 1);
select throws_ok(
  $$ update public.quiz_questions set quiz_id = 'javascript-foundations', quiz_version = 1, position = 4
     where id = '30000000-0000-4000-8000-000000000001' $$,
  'P0001', 'PUBLISHED_QUIZ_IMMUTABLE', 'draft questions cannot move into published versions'
);
select throws_ok(
  $$ update private.quiz_answer_keys set quiz_id = 'javascript-foundations', quiz_version = 1
     where question_id = '30000000-0000-4000-8000-000000000001' $$,
  'P0001', 'PUBLISHED_QUIZ_IMMUTABLE', 'draft answer keys cannot move into published versions'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select results_eq($$ select count(*)::integer from public.quiz_attempts $$, array[1], 'owner reads their attempt');
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select results_eq($$ select count(*)::integer from public.quiz_attempts $$, array[0], 'another user cannot read the attempt');

reset role;
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
select is(
  (select count(*)::integer from public.quiz_attempts where user_id = '11111111-1111-4111-8111-111111111111'),
  0,
  'deleting an account cascades to quiz attempts'
);

select * from finish();
rollback;
