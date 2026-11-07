create table public.quizzes (
  id text not null check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 80),
  version integer not null check (version > 0),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  topic text not null check (char_length(btrim(topic)) between 1 and 80),
  question_count integer not null check (question_count between 1 and 20),
  published_at timestamptz,
  primary key (id, version)
);

create table public.quiz_questions (
  id uuid primary key,
  quiz_id text not null,
  quiz_version integer not null,
  position integer not null check (position between 1 and 20),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  options jsonb not null,
  foreign key (quiz_id, quiz_version) references public.quizzes (id, version),
  unique (quiz_id, quiz_version, position),
  unique (id, quiz_id, quiz_version)
);

create function private.valid_quiz_options(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select
    jsonb_typeof(candidate) = 'array'
    and jsonb_array_length(candidate) between 2 and 6
    and not exists (
      select 1
      from jsonb_array_elements(candidate) as option(value)
      where jsonb_typeof(option.value) <> 'string'
        or char_length(btrim(option.value #>> '{}')) not between 1 and 300
    );
$$;

alter table public.quiz_questions
  add constraint quiz_questions_options_valid check (private.valid_quiz_options(options));

create table private.quiz_answer_keys (
  question_id uuid primary key,
  quiz_id text not null,
  quiz_version integer not null,
  correct_option integer not null check (correct_option between 0 and 5),
  foreign key (question_id, quiz_id, quiz_version)
    references public.quiz_questions (id, quiz_id, quiz_version)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id text not null,
  quiz_version integer not null,
  submission_id uuid not null,
  selected_answers jsonb not null check (jsonb_typeof(selected_answers) = 'array'),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count between 1 and 20),
  score_percent integer not null check (score_percent between 0 and 100),
  submitted_at timestamptz not null default now(),
  foreign key (quiz_id, quiz_version) references public.quizzes (id, version),
  unique (user_id, submission_id),
  check (correct_count <= question_count)
);

create index quiz_attempts_user_submitted_idx
  on public.quiz_attempts (user_id, submitted_at desc);

create index quiz_attempts_user_quiz_idx
  on public.quiz_attempts (user_id, quiz_id, quiz_version);

create function private.prevent_published_quiz_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_schema = 'public' and tg_table_name = 'quizzes' then
    if old.published_at is not null then
      raise exception using errcode = 'P0001', message = 'PUBLISHED_QUIZ_IMMUTABLE';
    end if;
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    if exists (
      select 1
      from public.quizzes as quiz
      where quiz.id = old.quiz_id
        and quiz.version = old.quiz_version
        and quiz.published_at is not null
    ) then
      raise exception using errcode = 'P0001', message = 'PUBLISHED_QUIZ_IMMUTABLE';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if exists (
      select 1
      from public.quizzes as quiz
      where quiz.id = new.quiz_id
        and quiz.version = new.quiz_version
        and quiz.published_at is not null
    ) then
      raise exception using errcode = 'P0001', message = 'PUBLISHED_QUIZ_IMMUTABLE';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger quizzes_immutable_after_publish
before update or delete on public.quizzes
for each row execute function private.prevent_published_quiz_change();

create trigger quiz_questions_immutable_after_publish
before insert or update or delete on public.quiz_questions
for each row execute function private.prevent_published_quiz_change();

create trigger quiz_answer_keys_immutable_after_publish
before insert or update or delete on private.quiz_answer_keys
for each row execute function private.prevent_published_quiz_change();

insert into public.quizzes (
  id, version, title, description, topic, question_count
) values (
  'javascript-foundations',
  1,
  'JavaScript foundations',
  'Check your understanding of arrays, transformations, and strict equality.',
  'JavaScript fundamentals',
  3
);

insert into public.quiz_questions (
  id, quiz_id, quiz_version, position, prompt, options
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'javascript-foundations', 1, 1,
    'After const values = [1, 2]; values.push(3); what is values.length?',
    '["1", "3", "An error is thrown"]'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'javascript-foundations', 1, 2,
    'What does Array.prototype.map return?',
    '["The original array after mutation", "A sorted copy", "A new array of transformed values", "One matching value"]'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'javascript-foundations', 1, 3,
    'What does the === operator compare?',
    '["Value and type without coercion", "Value after coercion", "Object contents recursively"]'
  );

insert into private.quiz_answer_keys (
  question_id, quiz_id, quiz_version, correct_option
) values
  ('10000000-0000-4000-8000-000000000001', 'javascript-foundations', 1, 1),
  ('10000000-0000-4000-8000-000000000002', 'javascript-foundations', 1, 2),
  ('10000000-0000-4000-8000-000000000003', 'javascript-foundations', 1, 0);

update public.quizzes
set published_at = now()
where id = 'javascript-foundations' and version = 1;

create function public.grade_quiz_attempt(
  p_user_id uuid,
  p_quiz_id text,
  p_quiz_version integer,
  p_submission_id uuid,
  p_answers jsonb
)
returns table (
  id uuid,
  quiz_id text,
  quiz_version integer,
  correct_count integer,
  question_count integer,
  score_percent integer,
  submitted_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_question_count integer;
  v_matched_count integer;
  v_correct_count integer;
  v_canonical_answers jsonb;
  v_existing public.quiz_attempts%rowtype;
  v_created public.quiz_attempts%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  if jsonb_typeof(p_answers) <> 'array'
    or jsonb_array_length(p_answers) not between 1 and 20
    or exists (
      select 1
      from jsonb_array_elements(p_answers) as answer(value)
      where jsonb_typeof(answer.value) <> 'object'
        or jsonb_typeof(answer.value -> 'questionId') <> 'string'
        or not pg_catalog.pg_input_is_valid(answer.value ->> 'questionId', 'uuid')
        or jsonb_typeof(answer.value -> 'optionIndex') <> 'number'
        or (answer.value ->> 'optionIndex') !~ '^[0-9]+$'
        or (answer.value ->> 'optionIndex')::integer not between 0 and 5
    )
  then
    raise exception using errcode = 'P0001', message = 'INVALID_SUBMISSION';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'questionId', answer.value ->> 'questionId',
      'optionIndex', (answer.value ->> 'optionIndex')::integer
    )
    order by answer.value ->> 'questionId'
  )
  into v_canonical_answers
  from jsonb_array_elements(p_answers) as answer(value);

  select attempt.*
  into v_existing
  from public.quiz_attempts as attempt
  where attempt.user_id = p_user_id
    and attempt.submission_id = p_submission_id;

  if found then
    if v_existing.quiz_id <> p_quiz_id
      or v_existing.quiz_version <> p_quiz_version
      or v_existing.selected_answers <> v_canonical_answers
    then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;

    return query select
      v_existing.id,
      v_existing.quiz_id,
      v_existing.quiz_version,
      v_existing.correct_count,
      v_existing.question_count,
      v_existing.score_percent,
      v_existing.submitted_at;
    return;
  end if;

  select quiz.question_count
  into v_question_count
  from public.quizzes as quiz
  where quiz.id = p_quiz_id
    and quiz.version = p_quiz_version
    and quiz.published_at is not null;

  if not found then
    raise exception using errcode = 'P0001', message = 'QUIZ_NOT_FOUND';
  end if;

  if jsonb_array_length(v_canonical_answers) <> v_question_count
    or (
      select count(distinct answer.value ->> 'questionId')
      from jsonb_array_elements(v_canonical_answers) as answer(value)
    ) <> v_question_count
  then
    raise exception using errcode = 'P0001', message = 'INVALID_SUBMISSION';
  end if;

  select count(*)::integer
  into v_matched_count
  from jsonb_array_elements(v_canonical_answers) as answer(value)
  join public.quiz_questions as question
    on question.id = (answer.value ->> 'questionId')::uuid
    and question.quiz_id = p_quiz_id
    and question.quiz_version = p_quiz_version
    and (answer.value ->> 'optionIndex')::integer < jsonb_array_length(question.options);

  if v_matched_count <> v_question_count then
    raise exception using errcode = 'P0001', message = 'INVALID_SUBMISSION';
  end if;

  if (
    select count(*)
    from public.quiz_attempts as recent
    where recent.user_id = p_user_id
      and recent.submitted_at > pg_catalog.clock_timestamp() - interval '1 minute'
  ) >= 5 then
    raise exception using errcode = 'P0001', message = 'RATE_LIMITED';
  end if;

  select count(*)::integer
  into v_correct_count
  from jsonb_array_elements(v_canonical_answers) as answer(value)
  join private.quiz_answer_keys as answer_key
    on answer_key.question_id = (answer.value ->> 'questionId')::uuid
    and answer_key.quiz_id = p_quiz_id
    and answer_key.quiz_version = p_quiz_version
    and answer_key.correct_option = (answer.value ->> 'optionIndex')::integer;

  insert into public.quiz_attempts (
    user_id,
    quiz_id,
    quiz_version,
    submission_id,
    selected_answers,
    correct_count,
    question_count,
    score_percent
  ) values (
    p_user_id,
    p_quiz_id,
    p_quiz_version,
    p_submission_id,
    v_canonical_answers,
    v_correct_count,
    v_question_count,
    round((v_correct_count::numeric / v_question_count::numeric) * 100)::integer
  )
  returning * into v_created;

  return query select
    v_created.id,
    v_created.quiz_id,
    v_created.quiz_version,
    v_created.correct_count,
    v_created.question_count,
    v_created.score_percent,
    v_created.submitted_at;
end;
$$;

revoke all on table public.quizzes from public, anon, authenticated;
revoke all on table public.quiz_questions from public, anon, authenticated;
revoke all on table public.quiz_attempts from public, anon, authenticated;
revoke all on table private.quiz_answer_keys from public, anon, authenticated;
revoke all on schema private from public, anon, authenticated;

grant select on table public.quizzes to authenticated;
grant select on table public.quiz_questions to authenticated;
grant select on table public.quiz_attempts to authenticated;

grant select on table public.quizzes to service_role;
grant select on table public.quiz_questions to service_role;
grant select, insert on table public.quiz_attempts to service_role;
grant usage on schema private to service_role;
grant select on table private.quiz_answer_keys to service_role;

revoke all on function private.valid_quiz_options(jsonb) from public, anon, authenticated;
revoke all on function private.prevent_published_quiz_change() from public, anon, authenticated;
revoke all on function public.grade_quiz_attempt(uuid, text, integer, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.grade_quiz_attempt(uuid, text, integer, uuid, jsonb) to service_role;

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "Authenticated users can read published quizzes"
on public.quizzes for select
to authenticated
using (published_at is not null);

create policy "Authenticated users can read published quiz questions"
on public.quiz_questions for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes as quiz
    where quiz.id = quiz_questions.quiz_id
      and quiz.version = quiz_questions.quiz_version
      and quiz.published_at is not null
  )
);

create policy "Users can read their own quiz attempts"
on public.quiz_attempts for select
to authenticated
using ((select auth.uid()) = user_id);
