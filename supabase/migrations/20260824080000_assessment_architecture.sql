-- Multi-position assignment and versioned assessment architecture.
-- New public objects remain service-role only; browser roles receive no grants.

begin;

create table if not exists public."UserPosition" (
  id text primary key default gen_random_uuid()::text,
  "userId" text not null
    references public."User"(id) on update cascade on delete cascade,
  position text not null,
  "isPrimary" boolean not null default false,
  "isActive" boolean not null default true,
  "assignedById" text
    references public."User"(id) on update cascade on delete set null,
  "assignedAt" timestamptz not null default current_timestamp,
  "endedAt" timestamptz,
  "updatedAt" timestamptz not null default current_timestamp,
  constraint "UserPosition_position_check" check (
    position = any (array[
      'Server',
      'Bartender',
      'Support Staff',
      'Trainer',
      'Line Cook',
      'Prep Cook',
      'Dishwasher',
      'General Manager',
      'Assistant General Manager',
      'Bar Manager',
      'FOH Supervisor',
      'Kitchen Manager',
      'Assistant Kitchen Manager',
      'BOH Supervisor'
    ]::text[])
  ),
  constraint "UserPosition_primary_active_check" check (
    "isPrimary" = false or "isActive" = true
  ),
  constraint "UserPosition_active_period_check" check (
    ("isActive" = true and "endedAt" is null)
    or ("isActive" = false and "endedAt" is not null)
  )
);

alter table public."UserPosition" enable row level security;

create unique index if not exists "UserPosition_one_active_position_key"
  on public."UserPosition" ("userId", position)
  where "isActive" = true;

create unique index if not exists "UserPosition_one_active_primary_key"
  on public."UserPosition" ("userId")
  where "isActive" = true and "isPrimary" = true;

create index if not exists "UserPosition_user_active_idx"
  on public."UserPosition" ("userId", "isActive");

create index if not exists "UserPosition_position_active_idx"
  on public."UserPosition" (position, "userId")
  where "isActive" = true;

create index if not exists "UserPosition_assignedById_idx"
  on public."UserPosition" ("assignedById");

insert into public."UserPosition"
  ("userId", position, "isPrimary", "isActive")
select employee.id, employee.position, true, true
from public."User" employee
where employee.position is not null
  and nullif(btrim(employee.position), '') is not null
  and not exists (
    select 1
    from public."UserPosition" current_position
    where current_position."userId" = employee.id
      and current_position.position = employee.position
      and current_position."isActive" = true
  );

alter table public."Quiz"
  add column if not exists "quizType" text not null default 'MODULE',
  add column if not exists position text,
  add column if not exists "assessmentVersion" integer not null default 1,
  add column if not exists "isActive" boolean not null default true,
  add column if not exists "isSystemManaged" boolean not null default false;

update public."Quiz"
set "quizType" = case
  when "moduleId" is not null then 'MODULE'
  when "sectionId" is not null then 'SECTION'
  else 'STANDALONE'
end;

update public."Quiz" quiz
set "isActive" = false,
    "isRequired" = false
where (
    quiz."moduleId" is not null
    and exists (
      select 1
      from public."Module" training_module
      left join public."Section" section
        on section.id = training_module."sectionId"
      where training_module.id = quiz."moduleId"
        and (
          training_module."isActive" = false
          or coalesce(section."isActive", false) = false
        )
    )
  )
  or (
    quiz."sectionId" is not null
    and exists (
      select 1
      from public."Section" section
      where section.id = quiz."sectionId"
        and section."isActive" = false
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'Quiz_type_check'
      and conrelid = 'public."Quiz"'::regclass
  ) then
    alter table public."Quiz"
      add constraint "Quiz_type_check"
      check ("quizType" in ('MODULE', 'SECTION', 'POSITION_FINAL', 'STANDALONE'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'Quiz_assessment_version_check'
      and conrelid = 'public."Quiz"'::regclass
  ) then
    alter table public."Quiz"
      add constraint "Quiz_assessment_version_check"
      check ("assessmentVersion" > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'Quiz_position_check'
      and conrelid = 'public."Quiz"'::regclass
  ) then
    alter table public."Quiz"
      add constraint "Quiz_position_check"
      check (
        position is null
        or position = any (array[
          'Server',
          'Bartender',
          'Support Staff',
          'Trainer',
          'Line Cook',
          'Prep Cook',
          'Dishwasher',
          'General Manager',
          'Assistant General Manager',
          'Bar Manager',
          'FOH Supervisor',
          'Kitchen Manager',
          'Assistant Kitchen Manager',
          'BOH Supervisor'
        ]::text[])
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'Quiz_scope_check'
      and conrelid = 'public."Quiz"'::regclass
  ) then
    alter table public."Quiz"
      add constraint "Quiz_scope_check"
      check (
        ("quizType" = 'MODULE'
          and "moduleId" is not null
          and "sectionId" is null
          and position is null)
        or ("quizType" = 'SECTION'
          and "moduleId" is null
          and "sectionId" is not null
          and position is null)
        or ("quizType" = 'POSITION_FINAL'
          and "moduleId" is null
          and "sectionId" is null
          and position is not null)
        or ("quizType" = 'STANDALONE'
          and "moduleId" is null
          and "sectionId" is null
          and position is null)
      );
  end if;
end
$$;

create index if not exists "Quiz_type_active_idx"
  on public."Quiz" ("quizType", "isActive");

create unique index if not exists "Quiz_active_module_key"
  on public."Quiz" ("moduleId")
  where "isActive" = true and "quizType" = 'MODULE';

create unique index if not exists "Quiz_active_section_key"
  on public."Quiz" ("sectionId")
  where "isActive" = true and "quizType" = 'SECTION';

create unique index if not exists "Quiz_active_position_final_key"
  on public."Quiz" (position)
  where "isActive" = true and "quizType" = 'POSITION_FINAL';

alter table public."QuizQuestion"
  add column if not exists "sourceModuleId" text;

update public."QuizQuestion" question
set "sourceModuleId" = quiz."moduleId"
from public."Quiz" quiz
where quiz.id = question."quizId"
  and quiz."moduleId" is not null
  and question."sourceModuleId" is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'QuizQuestion_sourceModuleId_fkey'
      and conrelid = 'public."QuizQuestion"'::regclass
  ) then
    alter table public."QuizQuestion"
      add constraint "QuizQuestion_sourceModuleId_fkey"
      foreign key ("sourceModuleId")
      references public."Module"(id)
      on update cascade
      on delete restrict;
  end if;
end
$$;

create index if not exists "QuizQuestion_quiz_source_sort_idx"
  on public."QuizQuestion" ("quizId", "sourceModuleId", "sortOrder");

create table if not exists public."QuizModuleCoverage" (
  "quizId" text not null
    references public."Quiz"(id) on update cascade on delete cascade,
  "moduleId" text not null
    references public."Module"(id) on update cascade on delete restrict,
  "sortOrder" integer not null default 0,
  "questionsRequired" integer not null default 1,
  constraint "QuizModuleCoverage_pkey" primary key ("quizId", "moduleId"),
  constraint "QuizModuleCoverage_questions_required_check"
    check ("questionsRequired" between 1 and 20)
);

alter table public."QuizModuleCoverage" enable row level security;

create index if not exists "QuizModuleCoverage_moduleId_idx"
  on public."QuizModuleCoverage" ("moduleId");

alter table public."QuizAttempt"
  add column if not exists "assessmentVersion" integer not null default 1,
  add column if not exists "questionCount" integer not null default 0,
  add column if not exists "correctCount" integer;

update public."QuizAttempt"
set "questionCount" = case
      when jsonb_typeof(answers::jsonb) = 'object' then (
        select count(*)::integer from jsonb_object_keys(answers::jsonb)
      )
      else 0
    end,
    "correctCount" = case
      when jsonb_typeof(answers::jsonb) = 'object'
        then round(
          score::numeric * (
            select count(*)::integer from jsonb_object_keys(answers::jsonb)
          )::numeric / 100
        )::integer
      else null
    end
where "questionCount" = 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'QuizAttempt_assessment_version_check'
      and conrelid = 'public."QuizAttempt"'::regclass
  ) then
    alter table public."QuizAttempt"
      add constraint "QuizAttempt_assessment_version_check"
      check ("assessmentVersion" > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'QuizAttempt_question_counts_check'
      and conrelid = 'public."QuizAttempt"'::regclass
  ) then
    alter table public."QuizAttempt"
      add constraint "QuizAttempt_question_counts_check"
      check (
        "questionCount" >= 0
        and (
          "correctCount" is null
          or (
            "correctCount" >= 0
            and "correctCount" <= "questionCount"
          )
        )
      );
  end if;
end
$$;

create index if not exists "QuizAttempt_user_quiz_version_idx"
  on public."QuizAttempt" ("userId", "quizId", "assessmentVersion");

create or replace function public.assign_paths_for_position_atomic(
  p_user_id text,
  p_assigned_by_id text default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_positions text[] := '{}'::text[];
  v_legacy_position text;
  v_hire_date timestamp;
  v_path record;
  v_result jsonb;
  v_paths integer := 0;
  v_paths_removed integer := 0;
  v_modules integer := 0;
begin
  select position, "hireDate"
  into v_legacy_position, v_hire_date
  from public."User"
  where id = p_user_id and "isActive" = true
  for no key update;
  if not found then raise exception 'Employee not found or inactive'; end if;

  select coalesce(array_agg(user_position.position order by user_position.position), '{}'::text[])
  into v_positions
  from public."UserPosition" user_position
  where user_position."userId" = p_user_id
    and user_position."isActive" = true;

  if cardinality(v_positions) = 0 and v_legacy_position is not null then
    v_positions := array[v_legacy_position]::text[];
  end if;

  -- Automatic links follow the complete active position set. Manual links are
  -- an explicit manager decision and are never revoked by synchronization.
  for v_path in
    select link."trainingPathId" as id
    from public."UserTrainingPath" link
    join public."TrainingPath" path on path.id = link."trainingPathId"
    where link."userId" = p_user_id
      and link."isActive" = true
      and link."assignedReason" = 'position'
      and not (
        path."isActive" = true
        and (
          cardinality(path."targetPositions") = 0
          or path."targetPositions" && v_positions
        )
      )
    order by link."trainingPathId"
  loop
    v_result := public.remove_training_path_atomic(p_user_id, v_path.id);
    v_paths_removed := v_paths_removed
      + coalesce((v_result->>'pathsRemoved')::integer, 0);
  end loop;

  for v_path in
    select id
    from public."TrainingPath"
    where "isActive" = true
      and (
        cardinality("targetPositions") = 0
        or "targetPositions" && v_positions
      )
    order by id
  loop
    v_result := public.assign_training_path_atomic(
      p_user_id,
      v_path.id,
      p_assigned_by_id,
      greatest(
        coalesce(v_hire_date, current_timestamp::timestamp),
        current_timestamp::timestamp
      ),
      null::timestamp,
      'position'::text
    );
    v_paths := v_paths + coalesce((v_result->>'pathsAdded')::integer, 0);
    v_modules := v_modules + coalesce((v_result->>'modulesAdded')::integer, 0);
  end loop;

  return jsonb_build_object(
    'pathsAdded', v_paths,
    'pathsRemoved', v_paths_removed,
    'modulesAdded', v_modules,
    'positions', to_jsonb(v_positions)
  );
end;
$$;

create or replace function public.set_user_positions_atomic(
  p_user_id text,
  p_positions text[] default '{}'::text[],
  p_assigned_by_id text default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_positions text[] := '{}'::text[];
  v_position text;
  v_ordinality bigint;
  v_assignment_result jsonb := '{}'::jsonb;
  v_user_active boolean;
begin
  perform 1
  from public."User"
  where id = p_user_id
  for no key update;
  if not found then raise exception 'Employee not found'; end if;

  select "isActive"
  into v_user_active
  from public."User"
  where id = p_user_id;

  select coalesce(array_agg(normalized.position order by normalized.first_ordinality), '{}'::text[])
  into v_positions
  from (
    select btrim(requested.position) as position,
           min(requested.ordinality) as first_ordinality
    from unnest(coalesce(p_positions, '{}'::text[]))
      with ordinality as requested(position, ordinality)
    where nullif(btrim(requested.position), '') is not null
    group by btrim(requested.position)
  ) normalized;

  if exists (
    select 1
    from unnest(v_positions) requested(position)
    where requested.position <> all (array[
      'Server',
      'Bartender',
      'Support Staff',
      'Trainer',
      'Line Cook',
      'Prep Cook',
      'Dishwasher',
      'General Manager',
      'Assistant General Manager',
      'Bar Manager',
      'FOH Supervisor',
      'Kitchen Manager',
      'Assistant Kitchen Manager',
      'BOH Supervisor'
    ]::text[])
  ) then
    raise exception 'One or more positions is invalid';
  end if;

  perform 1
  from public."UserPosition"
  where "userId" = p_user_id and "isActive" = true
  order by position, id
  for update;

  -- Clear the former primary first so the partial unique index cannot conflict
  -- while a different active position is promoted.
  update public."UserPosition"
  set "isPrimary" = false,
      "updatedAt" = current_timestamp
  where "userId" = p_user_id
    and "isActive" = true
    and "isPrimary" = true;

  update public."UserPosition"
  set "isActive" = false,
      "isPrimary" = false,
      "endedAt" = current_timestamp,
      "updatedAt" = current_timestamp
  where "userId" = p_user_id
    and "isActive" = true
    and not (position = any(v_positions));

  for v_position, v_ordinality in
    select requested.position, requested.ordinality
    from unnest(v_positions) with ordinality as requested(position, ordinality)
    order by requested.ordinality
  loop
    update public."UserPosition"
    set "isPrimary" = (v_ordinality = 1),
        "assignedById" = p_assigned_by_id,
        "updatedAt" = current_timestamp
    where "userId" = p_user_id
      and position = v_position
      and "isActive" = true;

    if not found then
      insert into public."UserPosition"
        ("userId", position, "isPrimary", "isActive", "assignedById")
      values
        (p_user_id, v_position, v_ordinality = 1, true, p_assigned_by_id);
    end if;
  end loop;

  update public."User"
  set position = v_positions[1],
      "updatedAt" = current_timestamp
  where id = p_user_id;

  if v_user_active then
    v_assignment_result := public.assign_paths_for_position_atomic(
      p_user_id,
      p_assigned_by_id
    );
  end if;

  return jsonb_build_object(
    'positions', to_jsonb(v_positions),
    'primaryPosition', v_positions[1],
    'assignment', v_assignment_result
  );
end;
$$;

create or replace function public.record_quiz_attempt_atomic(
  p_user_id text,
  p_quiz_id text,
  p_answers jsonb,
  p_correct_count integer,
  p_started_at timestamp default current_timestamp
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_quiz public."Quiz"%rowtype;
  v_attempt public."QuizAttempt"%rowtype;
  v_question_count integer;
  v_attempts_before integer;
  v_attempts_after integer;
  v_attempts_remaining integer;
  v_score integer;
  v_passed boolean;
begin
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Quiz answers must be an object';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id || ':' || p_quiz_id, 0)
  );

  perform 1
  from public."User"
  where id = p_user_id and "isActive" = true
  for share;
  if not found then raise exception 'Employee not found or inactive'; end if;

  select *
  into v_quiz
  from public."Quiz"
  where id = p_quiz_id and "isActive" = true
  for share;
  if not found then raise exception 'Quiz not found or inactive'; end if;

  select count(*)::integer
  into v_question_count
  from public."QuizQuestion"
  where "quizId" = p_quiz_id;

  if v_question_count = 0 then raise exception 'Quiz has no questions'; end if;
  if (
    select count(*)::integer from jsonb_object_keys(p_answers)
  ) <> v_question_count then
    raise exception 'Every quiz question must be answered';
  end if;
  if p_correct_count < 0 or p_correct_count > v_question_count then
    raise exception 'Correct answer count is invalid';
  end if;

  select count(*)::integer
  into v_attempts_before
  from public."QuizAttempt"
  where "userId" = p_user_id
    and "quizId" = p_quiz_id
    and "assessmentVersion" = v_quiz."assessmentVersion";

  if v_quiz."retryLimit" > 0
    and v_attempts_before >= v_quiz."retryLimit"
  then
    raise exception 'Maximum attempts reached';
  end if;

  v_score := round(
    p_correct_count::numeric * 100 / v_question_count::numeric
  )::integer;
  v_passed := v_score >= v_quiz."passingScore";

  insert into public."QuizAttempt"
    ("quizId", "userId", score, passed, answers, "startedAt", "completedAt",
     "assessmentVersion", "questionCount", "correctCount")
  values
    (p_quiz_id, p_user_id, v_score, v_passed, p_answers,
     coalesce(p_started_at, current_timestamp), current_timestamp,
     v_quiz."assessmentVersion", v_question_count, p_correct_count)
  returning * into v_attempt;

  v_attempts_after := v_attempts_before + 1;
  v_attempts_remaining := case
    when v_quiz."retryLimit" = 0 then null
    else greatest(v_quiz."retryLimit" - v_attempts_after, 0)
  end;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'score', v_score,
    'passed', v_passed,
    'attemptsRemaining', v_attempts_remaining,
    'canRetry', not v_passed
      and (v_attempts_remaining is null or v_attempts_remaining > 0)
  );
end;
$$;

revoke all privileges on table public."UserPosition"
  from public, anon, authenticated;
revoke all privileges on table public."QuizModuleCoverage"
  from public, anon, authenticated;
grant select, insert, update, delete on table public."UserPosition"
  to service_role;
grant select, insert, update, delete on table public."QuizModuleCoverage"
  to service_role;

revoke execute on function public.assign_paths_for_position_atomic(text, text)
  from public, anon, authenticated;
revoke execute on function public.set_user_positions_atomic(text, text[], text)
  from public, anon, authenticated;
revoke execute on function public.record_quiz_attempt_atomic(text, text, jsonb, integer, timestamp)
  from public, anon, authenticated;

grant execute on function public.assign_paths_for_position_atomic(text, text)
  to service_role;
grant execute on function public.set_user_positions_atomic(text, text[], text)
  to service_role;
grant execute on function public.record_quiz_attempt_atomic(text, text, jsonb, integer, timestamp)
  to service_role;

-- Reconcile established employees after the scalar-position backfill.
do $$
declare
  employee record;
begin
  for employee in
    select id from public."User" where "isActive" = true order by id
  loop
    perform public.assign_paths_for_position_atomic(employee.id, null);
  end loop;
end
$$;

commit;
