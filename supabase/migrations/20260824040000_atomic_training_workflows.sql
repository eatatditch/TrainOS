-- Atomic path/provenance and practical-certification workflows.
-- All functions are service-role only; browser roles retain no direct execute.

begin;

alter table public."UserTrainingPath"
  add column if not exists "isActive" boolean not null default true;

alter table public."ModuleAssignment"
  add column if not exists "isActive" boolean not null default true;

create index if not exists "UserTrainingPath_user_active_idx"
  on public."UserTrainingPath" ("userId", "isActive");

create index if not exists "ModuleAssignment_user_active_idx"
  on public."ModuleAssignment" ("userId", "isActive");

alter table public."PracticalSignoff"
  add column if not exists "currentCycleId" text;

update public."PracticalSignoff"
set "currentCycleId" = gen_random_uuid()::text
where status = 'PASSED' and "currentCycleId" is null;

alter table public."PracticalSignoff"
  drop constraint if exists "PracticalSignoff_passed_cycle_check";

alter table public."PracticalSignoff"
  add constraint "PracticalSignoff_passed_cycle_check"
  check (status <> 'PASSED' or "currentCycleId" is not null);

create or replace function public.assign_training_path_atomic(
  p_user_id text,
  p_training_path_id text,
  p_assigned_by_id text default null,
  p_start_at timestamp default current_timestamp,
  p_requested_due_at timestamp default null,
  p_reason text default 'manual'
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_interval integer;
  v_module_count integer;
  v_path_due timestamp;
  v_paths_added integer := 0;
  v_modules_touched integer := 0;
  v_path_already_assigned boolean := false;
begin
  perform 1
  from public."User"
  where id = p_user_id and "isActive" = true
  for no key update;
  if not found then raise exception 'Employee not found or inactive'; end if;

  select greatest(coalesce("moduleIntervalDays", 7), 1)
  into v_interval
  from public."TrainingPath"
  where id = p_training_path_id and "isActive" = true
  for update;
  if not found then raise exception 'Training path not found or inactive'; end if;

  perform 1
  from public."TrainingPathModule" membership
  join public."Module" m
    on m.id = membership."moduleId" and m."isActive" = true
  where membership."trainingPathId" = p_training_path_id
  order by m.id
  for share of m;

  perform 1
  from public."Section" s
  where s."isActive" = true
    and exists (
      select 1
      from public."TrainingPathModule" membership
      join public."Module" m on m.id = membership."moduleId" and m."isActive" = true
      where membership."trainingPathId" = p_training_path_id
        and m."sectionId" = s.id
    )
  order by s.id
  for share of s;

  select count(*)::integer
  into v_module_count
  from public."TrainingPathModule" membership
  join public."Module" m
    on m.id = membership."moduleId" and m."isActive" = true
  join public."Section" s
    on s.id = m."sectionId" and s."isActive" = true
  where membership."trainingPathId" = p_training_path_id;

  v_path_due := coalesce(
    p_requested_due_at,
    p_start_at + make_interval(days => v_interval * v_module_count)
  );

  select exists (
    select 1
    from public."UserTrainingPath"
    where "userId" = p_user_id
      and "trainingPathId" = p_training_path_id
      and "isActive" = true
  ) into v_path_already_assigned;

  insert into public."UserTrainingPath" as current_path
    ("userId", "trainingPathId", "dueDate", "assignedReason", "isActive")
  values
    (p_user_id, p_training_path_id, v_path_due, coalesce(nullif(p_reason, ''), 'manual'), true)
  on conflict ("userId", "trainingPathId") do update set
    "dueDate" = case
      when current_path."isActive" = false then excluded."dueDate"
      else current_path."dueDate"
    end,
    "isActive" = true,
    "assignedReason" = case
      when current_path."isActive" = false then excluded."assignedReason"
      when excluded."assignedReason" = 'manual' then 'manual'
      else current_path."assignedReason"
    end;
  v_paths_added := case when v_path_already_assigned then 0 else 1 end;

  with desired as (
    select
      tpm."moduleId",
      tpm."isRequired",
      row_number() over (order by tpm."sortOrder", tpm."moduleId")::integer as sequence
    from public."TrainingPathModule" tpm
    join public."Module" m on m.id = tpm."moduleId" and m."isActive" = true
    join public."Section" s on s.id = m."sectionId" and s."isActive" = true
    where tpm."trainingPathId" = p_training_path_id
  )
  insert into public."ModuleAssignment" as current_assignment
    ("userId", "moduleId", "assignedById", "isRequired", "dueDate", "isDirect", "sourcePathIds", "isActive")
  select
    p_user_id,
    desired."moduleId",
    p_assigned_by_id,
    desired."isRequired",
    p_start_at + make_interval(days => v_interval * desired.sequence),
    false,
    array[p_training_path_id]::text[],
    true
  from desired
  on conflict ("userId", "moduleId") do update set
    "isRequired" = case
      when current_assignment."isActive" = false then excluded."isRequired"
      else current_assignment."isRequired" or excluded."isRequired"
    end,
    "dueDate" = case
      when current_assignment."isActive" = false then excluded."dueDate"
      when current_assignment."dueDate" is null then excluded."dueDate"
      when excluded."dueDate" is null then current_assignment."dueDate"
      else least(current_assignment."dueDate", excluded."dueDate")
    end,
    "isActive" = true,
    "sourcePathIds" = case
      when current_assignment."isActive" = false then excluded."sourcePathIds"
      else (
        select array_agg(distinct source_id)
        from unnest(
          current_assignment."sourcePathIds" || excluded."sourcePathIds"
        ) as source_id
      )
    end;
  get diagnostics v_modules_touched = row_count;

  return jsonb_build_object(
    'pathsAdded', v_paths_added,
    'modulesAdded', v_modules_touched,
    'alreadyAssigned', v_paths_added = 0
  );
end;
$$;

create or replace function public.remove_training_path_atomic(
  p_user_id text,
  p_training_path_id text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_links_removed integer := 0;
  v_assignments_removed integer := 0;
  v_assignment_ids text[] := '{}'::text[];
begin
  perform 1 from public."User" where id = p_user_id for no key update;
  if not found then raise exception 'Employee not found'; end if;
  perform 1 from public."TrainingPath" where id = p_training_path_id for update;
  if not found then raise exception 'Training path not found'; end if;

  perform 1
  from public."ModuleAssignment"
  where "userId" = p_user_id
    and "isActive" = true
    and "sourcePathIds" @> array[p_training_path_id]::text[]
  order by id
  for update;

  select coalesce(array_agg(id), '{}'::text[])
  into v_assignment_ids
  from public."ModuleAssignment"
  where "userId" = p_user_id
    and "isActive" = true
    and "sourcePathIds" @> array[p_training_path_id]::text[];

  update public."ModuleAssignment"
  set "sourcePathIds" = array_remove("sourcePathIds", p_training_path_id),
      "isActive" = "isDirect"
        or cardinality(array_remove("sourcePathIds", p_training_path_id)) > 0
  where id = any(v_assignment_ids);
  get diagnostics v_assignments_removed = row_count;

  update public."UserTrainingPath"
  set "isActive" = false
  where "userId" = p_user_id
    and "trainingPathId" = p_training_path_id
    and "isActive" = true;
  get diagnostics v_links_removed = row_count;

  return jsonb_build_object(
    'pathsRemoved', v_links_removed,
    'assignmentsRemoved', v_assignments_removed
  );
end;
$$;

create or replace function public.reconcile_training_path_atomic(
  p_training_path_id text,
  p_assigned_by_id text default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_interval integer;
  v_users integer := 0;
  v_touched integer := 0;
  v_obsolete_assignment_ids text[] := '{}'::text[];
begin
  select greatest(coalesce("moduleIntervalDays", 7), 1)
  into v_interval
  from public."TrainingPath"
  where id = p_training_path_id and "isActive" = true
  for update;
  if not found then raise exception 'Training path not found or inactive'; end if;

  perform 1
  from public."TrainingPathModule" membership
  join public."Module" m
    on m.id = membership."moduleId" and m."isActive" = true
  where membership."trainingPathId" = p_training_path_id
  order by m.id
  for share of m;

  perform 1
  from public."Section" s
  where s."isActive" = true
    and exists (
      select 1
      from public."TrainingPathModule" membership
      join public."Module" m on m.id = membership."moduleId" and m."isActive" = true
      where membership."trainingPathId" = p_training_path_id
        and m."sectionId" = s.id
    )
  order by s.id
  for share of s;

  perform 1
  from public."UserTrainingPath"
  where "trainingPathId" = p_training_path_id and "isActive" = true
  order by id
  for update;

  select count(*)::integer into v_users
  from public."UserTrainingPath"
  where "trainingPathId" = p_training_path_id and "isActive" = true;

  perform 1
  from public."ModuleAssignment"
  where "isActive" = true
    and "sourcePathIds" @> array[p_training_path_id]::text[]
  order by id
  for update;

  select coalesce(array_agg(assignment.id), '{}'::text[])
  into v_obsolete_assignment_ids
  from public."ModuleAssignment" assignment
  where assignment."isActive" = true
    and assignment."sourcePathIds" @> array[p_training_path_id]::text[]
    and not exists (
      select 1
      from public."TrainingPathModule" membership
      join public."Module" m
        on m.id = membership."moduleId" and m."isActive" = true
      join public."Section" s
        on s.id = m."sectionId" and s."isActive" = true
      where membership."trainingPathId" = p_training_path_id
        and membership."moduleId" = assignment."moduleId"
    );

  update public."ModuleAssignment" assignment
  set "sourcePathIds" = array_remove(assignment."sourcePathIds", p_training_path_id),
      "isActive" = assignment."isDirect"
        or cardinality(array_remove(assignment."sourcePathIds", p_training_path_id)) > 0
  where assignment.id = any(v_obsolete_assignment_ids);

  with desired as (
    select
      link."userId",
      membership."moduleId",
      membership."isRequired",
      row_number() over (
        partition by link."userId"
        order by membership."sortOrder", membership."moduleId"
      )::integer as sequence
    from public."UserTrainingPath" link
    join public."TrainingPathModule" membership
      on membership."trainingPathId" = link."trainingPathId"
    join public."Module" m on m.id = membership."moduleId" and m."isActive" = true
    join public."Section" s on s.id = m."sectionId" and s."isActive" = true
    where link."trainingPathId" = p_training_path_id
      and link."isActive" = true
  )
  insert into public."ModuleAssignment" as current_assignment
    ("userId", "moduleId", "assignedById", "isRequired", "dueDate", "isDirect", "sourcePathIds", "isActive")
  select
    desired."userId",
    desired."moduleId",
    p_assigned_by_id,
    desired."isRequired",
    current_timestamp + make_interval(days => v_interval * desired.sequence),
    false,
    array[p_training_path_id]::text[],
    true
  from desired
  on conflict ("userId", "moduleId") do update set
    "isRequired" = case
      when current_assignment."isActive" = false then excluded."isRequired"
      else current_assignment."isRequired" or excluded."isRequired"
    end,
    "dueDate" = case
      when current_assignment."isActive" = false then excluded."dueDate"
      when current_assignment."dueDate" is null then excluded."dueDate"
      when excluded."dueDate" is null then current_assignment."dueDate"
      else least(current_assignment."dueDate", excluded."dueDate")
    end,
    "isActive" = true,
    "sourcePathIds" = case
      when current_assignment."isActive" = false then excluded."sourcePathIds"
      else (
        select array_agg(distinct source_id)
        from unnest(
          current_assignment."sourcePathIds" || excluded."sourcePathIds"
        ) as source_id
      )
    end;
  get diagnostics v_touched = row_count;

  return jsonb_build_object('usersReconciled', v_users, 'modulesTouched', v_touched);
end;
$$;

create or replace function public.archive_training_path_atomic(
  p_training_path_id text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_links_removed integer := 0;
  v_assignments_removed integer := 0;
  v_assignment_ids text[] := '{}'::text[];
begin
  perform 1
  from public."TrainingPath"
  where id = p_training_path_id
  for update;
  if not found then raise exception 'Training path not found'; end if;

  perform 1
  from public."ModuleAssignment"
  where "isActive" = true
    and "sourcePathIds" @> array[p_training_path_id]::text[]
  order by id
  for update;

  select coalesce(array_agg(id), '{}'::text[])
  into v_assignment_ids
  from public."ModuleAssignment"
  where "isActive" = true
    and "sourcePathIds" @> array[p_training_path_id]::text[];

  update public."ModuleAssignment"
  set "sourcePathIds" = array_remove("sourcePathIds", p_training_path_id),
      "isActive" = "isDirect"
        or cardinality(array_remove("sourcePathIds", p_training_path_id)) > 0
  where id = any(v_assignment_ids);
  get diagnostics v_assignments_removed = row_count;

  update public."UserTrainingPath"
  set "isActive" = false
  where "trainingPathId" = p_training_path_id
    and "isActive" = true;
  get diagnostics v_links_removed = row_count;

  update public."TrainingPath"
  set "isActive" = false, "updatedAt" = current_timestamp
  where id = p_training_path_id;

  return jsonb_build_object(
    'archived', true,
    'pathsRemoved', v_links_removed,
    'assignmentsRemoved', v_assignments_removed
  );
end;
$$;

create or replace function public.update_training_path_atomic(
  p_training_path_id text,
  p_title text,
  p_description text,
  p_is_active boolean,
  p_target_role text,
  p_target_positions text[],
  p_module_ids text[] default null,
  p_assigned_by_id text default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_path public."TrainingPath"%rowtype;
  v_requested integer;
  v_valid integer;
begin
  if nullif(btrim(p_title), '') is null then raise exception 'Title is required'; end if;

  select * into v_path
  from public."TrainingPath"
  where id = p_training_path_id
  for update;
  if not found then raise exception 'Training path not found'; end if;

  if p_module_ids is not null then
    perform 1
    from public."Module" m
    where m.id = any(p_module_ids) and m."isActive" = true
    order by m.id
    for share of m;

    perform 1
    from public."Section" s
    where s."isActive" = true
      and s.id in (
        select m."sectionId" from public."Module" m
        where m.id = any(p_module_ids) and m."isActive" = true
      )
    order by s.id
    for share of s;

    select count(distinct module_id)::integer
    into v_requested
    from unnest(p_module_ids) as module_id;

    select count(*)::integer
    into v_valid
    from public."Module" m
    join public."Section" s on s.id = m."sectionId" and s."isActive" = true
    where m.id = any(p_module_ids) and m."isActive" = true;

    if v_requested <> v_valid then
      raise exception 'One or more selected modules is missing or inactive';
    end if;
  end if;

  update public."TrainingPath"
  set title = btrim(p_title),
      description = coalesce(p_description, ''),
      "isActive" = coalesce(p_is_active, true),
      "targetRole" = coalesce(p_target_role, ''),
      "targetPositions" = coalesce(p_target_positions, '{}'::text[]),
      "updatedAt" = current_timestamp
  where id = p_training_path_id;

  if coalesce(p_is_active, true) = false then
    return public.archive_training_path_atomic(p_training_path_id);
  end if;

  if p_module_ids is not null then
    insert into public."TrainingPathModule"
      ("trainingPathId", "moduleId", "sortOrder", "isRequired")
    select p_training_path_id, module_id, ordinality::integer - 1, true
    from unnest(p_module_ids) with ordinality as desired(module_id, ordinality)
    on conflict ("trainingPathId", "moduleId") do update set
      "sortOrder" = excluded."sortOrder",
      "isRequired" = true;

    delete from public."TrainingPathModule"
    where "trainingPathId" = p_training_path_id
      and not ("moduleId" = any(p_module_ids));

    perform public.reconcile_training_path_atomic(
      p_training_path_id,
      p_assigned_by_id
    );
  end if;

  select * into v_path from public."TrainingPath" where id = p_training_path_id;
  return to_jsonb(v_path);
end;
$$;

create or replace function public.create_training_path_atomic(
  p_title text,
  p_description text default '',
  p_target_role text default '',
  p_target_positions text[] default '{}'::text[],
  p_module_ids text[] default '{}'::text[]
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_path public."TrainingPath"%rowtype;
  v_requested integer;
  v_valid integer;
begin
  if nullif(btrim(p_title), '') is null then raise exception 'Title is required'; end if;

  select count(distinct module_id)::integer into v_requested
  from unnest(coalesce(p_module_ids, '{}'::text[])) as module_id;

  perform 1
  from public."Module" m
  where m.id = any(coalesce(p_module_ids, '{}'::text[])) and m."isActive" = true
  order by m.id
  for share of m;

  perform 1
  from public."Section" s
  where s."isActive" = true
    and s.id in (
      select m."sectionId" from public."Module" m
      where m.id = any(coalesce(p_module_ids, '{}'::text[])) and m."isActive" = true
    )
  order by s.id
  for share of s;

  select count(*)::integer into v_valid
  from public."Module" m
  join public."Section" s on s.id = m."sectionId" and s."isActive" = true
  where m.id = any(coalesce(p_module_ids, '{}'::text[])) and m."isActive" = true;
  if v_requested <> v_valid then
    raise exception 'One or more selected modules is missing or inactive';
  end if;

  insert into public."TrainingPath"
    (title, description, "targetRole", "targetPositions", "isActive")
  values
    (btrim(p_title), coalesce(p_description, ''), coalesce(p_target_role, ''), coalesce(p_target_positions, '{}'::text[]), true)
  returning * into v_path;

  insert into public."TrainingPathModule"
    ("trainingPathId", "moduleId", "sortOrder", "isRequired")
  select v_path.id, module_id, ordinality::integer - 1, true
  from unnest(coalesce(p_module_ids, '{}'::text[])) with ordinality as desired(module_id, ordinality);

  return to_jsonb(v_path);
end;
$$;

create or replace function public.assign_paths_for_position_atomic(
  p_user_id text,
  p_assigned_by_id text default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_position text;
  v_hire_date timestamp;
  v_path record;
  v_result jsonb;
  v_paths integer := 0;
  v_paths_removed integer := 0;
  v_modules integer := 0;
begin
  select position, "hireDate"
  into v_position, v_hire_date
  from public."User"
  where id = p_user_id and "isActive" = true
  for no key update;
  if not found then raise exception 'Employee not found or inactive'; end if;

  -- Remove only automatically assigned paths that no longer match the
  -- employee's current position. Manual assignments remain an explicit
  -- manager decision and are never revoked by this synchronization.
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
          or coalesce(v_position = any(path."targetPositions"), false)
        )
      )
    order by link."trainingPathId"
  loop
    v_result := public.remove_training_path_atomic(p_user_id, v_path.id);
    v_paths_removed := v_paths_removed + coalesce((v_result->>'pathsRemoved')::integer, 0);
  end loop;

  for v_path in
    select id
    from public."TrainingPath"
    where "isActive" = true
      and (
        cardinality("targetPositions") = 0
        or v_position = any("targetPositions")
      )
    order by id
  loop
    v_result := public.assign_training_path_atomic(
      p_user_id,
      v_path.id,
      p_assigned_by_id,
      greatest(coalesce(v_hire_date, current_timestamp), current_timestamp),
      null,
      'position'
    );
    v_paths := v_paths + coalesce((v_result->>'pathsAdded')::integer, 0);
    v_modules := v_modules + coalesce((v_result->>'modulesAdded')::integer, 0);
  end loop;

  return jsonb_build_object(
    'pathsAdded', v_paths,
    'pathsRemoved', v_paths_removed,
    'modulesAdded', v_modules
  );
end;
$$;

create or replace function public.assign_training_module_direct_atomic(
  p_user_id text,
  p_module_id text,
  p_assigned_by_id text,
  p_is_required boolean default false,
  p_due_at timestamp default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_assignment public."ModuleAssignment"%rowtype;
  v_section_id text;
begin
  perform 1 from public."User"
  where id = p_user_id and "isActive" = true
  for no key update;
  if not found then raise exception 'Employee not found or inactive'; end if;

  select "sectionId" into v_section_id
  from public."Module"
  where id = p_module_id and "isActive" = true
  for share;
  if not found then raise exception 'Module not found or inactive'; end if;

  perform 1
  from public."Section"
  where id = v_section_id and "isActive" = true
  for share;
  if not found then raise exception 'Module section not found or inactive'; end if;

  insert into public."ModuleAssignment" as current_assignment
    ("userId", "moduleId", "assignedById", "isRequired", "dueDate", "isDirect", "isActive")
  values
    (p_user_id, p_module_id, p_assigned_by_id, coalesce(p_is_required, false), p_due_at, true, true)
  on conflict ("userId", "moduleId") do update set
    "isDirect" = true,
    "isActive" = true,
    "isRequired" = case
      when current_assignment."isActive" = false then excluded."isRequired"
      else current_assignment."isRequired" or excluded."isRequired"
    end,
    "dueDate" = case
      when current_assignment."isActive" = false then excluded."dueDate"
      else coalesce(excluded."dueDate", current_assignment."dueDate")
    end
  returning * into v_assignment;

  return to_jsonb(v_assignment);
end;
$$;

create or replace function public.archive_training_module_atomic(
  p_module_id text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_archived integer := 0;
begin
  perform 1
  from public."Module"
  where id = p_module_id
  for no key update;
  if not found then raise exception 'Module not found'; end if;

  update public."Module"
  set "isActive" = false, "updatedAt" = current_timestamp
  where id = p_module_id and "isActive" = true;
  get diagnostics v_archived = row_count;

  return jsonb_build_object('archived', true, 'changed', v_archived = 1);
end;
$$;

create or replace function public.archive_training_section_atomic(
  p_section_id text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_modules integer := 0;
  v_section integer := 0;
begin
  perform 1
  from public."Module"
  where "sectionId" = p_section_id
  order by id
  for no key update;

  perform 1
  from public."Section"
  where id = p_section_id
  for no key update;
  if not found then raise exception 'Section not found'; end if;

  update public."Module"
  set "isActive" = false, "updatedAt" = current_timestamp
  where "sectionId" = p_section_id and "isActive" = true;
  get diagnostics v_modules = row_count;

  update public."Section"
  set "isActive" = false, "updatedAt" = current_timestamp
  where id = p_section_id and "isActive" = true;
  get diagnostics v_section = row_count;

  return jsonb_build_object(
    'archived', true,
    'sectionChanged', v_section = 1,
    'modulesChanged', v_modules
  );
end;
$$;

create or replace function public.record_practical_signoff_atomic(
  p_user_id text,
  p_module_id text,
  p_status text,
  p_verified_by_id text,
  p_evidence text,
  p_critical_checks text[],
  p_notes text,
  p_audit_schedule_days integer[]
) returns setof public."PracticalSignoff"
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_cycle_id text := gen_random_uuid()::text;
  v_next_audit timestamptz;
  v_event jsonb;
  v_required_quizzes integer;
  v_passed_quizzes integer;
  v_existing public."PracticalSignoff"%rowtype;
  v_has_existing boolean := false;
  v_event_cycle_id text;
  v_module_section_id text;
  v_target_active boolean;
  v_verifier_active boolean;
begin
  if p_status not in ('PASSED', 'NEEDS_COACHING', 'REVOKED') then
    raise exception 'Invalid practical status';
  end if;
  if p_status = 'PASSED' and (
    length(btrim(coalesce(p_evidence, ''))) < 12
    or not coalesce(p_critical_checks, '{}'::text[]) @> array['standard', 'safety', 'live']::text[]
    or cardinality(coalesce(p_audit_schedule_days, '{}'::integer[])) = 0
  ) then
    raise exception 'A pass requires evidence, critical checks, and an audit schedule';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_audit_schedule_days, '{}'::integer[])) as audit_day
    where audit_day is null or audit_day <= 0
  ) then
    raise exception 'Audit schedule days must be positive';
  end if;
  if cardinality(coalesce(p_audit_schedule_days, '{}'::integer[])) > 0 and (
    cardinality(p_audit_schedule_days) <> (
      select count(distinct audit_day)::integer
      from unnest(p_audit_schedule_days) as audit_day
    )
    or p_audit_schedule_days <> (
      select array_agg(audit_day order by audit_day)
      from unnest(p_audit_schedule_days) as audit_day
    )
  ) then
    raise exception 'Audit schedule days must be unique and strictly increasing';
  end if;

  -- User rows always exist before the first signoff row. Lock target and
  -- verifier in one deterministic order so first certifications serialize
  -- without creating reciprocal verifier/target deadlocks.
  perform 1
  from public."User"
  where id in (p_user_id, p_verified_by_id)
  order by id
  for no key update;

  select "isActive" into v_verifier_active
  from public."User"
  where id = p_verified_by_id;
  if not found or v_verifier_active = false then
    raise exception 'Verifier not found or inactive';
  end if;

  select "isActive" into v_target_active
  from public."User"
  where id = p_user_id;
  if not found then raise exception 'Employee not found'; end if;

  select * into v_existing
  from public."PracticalSignoff"
  where "userId" = p_user_id and "moduleId" = p_module_id
  for update;
  v_has_existing := found;

  if p_status = 'REVOKED' then
    if length(btrim(coalesce(p_notes, ''))) < 3 then
      raise exception 'Revocation notes are required';
    end if;
    if not v_has_existing
      or v_existing.status <> 'PASSED'
      or v_existing."currentCycleId" is null
    then
      raise exception 'Only a current passed certification can be revoked';
    end if;

    v_event := jsonb_build_object(
      'type', 'REVOKED',
      'cycleId', v_existing."currentCycleId",
      'at', v_now,
      'verifiedById', p_verified_by_id,
      'status', p_status,
      'evidence', coalesce(p_evidence, ''),
      'notes', btrim(p_notes)
    );

    return query
    update public."PracticalSignoff"
    set status = 'REVOKED',
        "verifiedById" = p_verified_by_id,
        notes = btrim(p_notes),
        "nextAuditAt" = null,
        "auditLog" = "auditLog" || jsonb_build_array(v_event),
        "currentCycleId" = null,
        "updatedAt" = v_now
    where id = v_existing.id
    returning *;
    return;
  end if;

  if v_target_active = false then
    raise exception 'Employee not found or inactive';
  end if;

  select "sectionId" into v_module_section_id
  from public."Module"
  where id = p_module_id
    and "isActive" = true
    and tags @> array['practical-required']::text[]
  for share;
  if not found then raise exception 'Practical module not found or inactive'; end if;

  perform 1
  from public."Section"
  where id = v_module_section_id and "isActive" = true
  for share;
  if not found then raise exception 'Practical module section not found or inactive'; end if;

  perform 1 from public."ModuleAssignment"
  where "userId" = p_user_id and "moduleId" = p_module_id and "isActive" = true
  for share;
  if not found then raise exception 'Employee is not assigned this practical'; end if;

  perform 1 from public."ModuleCompletion"
  where "userId" = p_user_id and "moduleId" = p_module_id
  for share;
  if not found then raise exception 'Lesson review is not complete'; end if;

  select count(*)::integer into v_required_quizzes
  from public."Quiz"
  where "moduleId" = p_module_id and "isRequired" = true;
  select count(distinct attempt."quizId")::integer into v_passed_quizzes
  from public."QuizAttempt" attempt
  join public."Quiz" quiz on quiz.id = attempt."quizId"
  where attempt."userId" = p_user_id
    and attempt.passed = true
    and quiz."moduleId" = p_module_id
    and quiz."isRequired" = true;
  if v_required_quizzes <> v_passed_quizzes then
    raise exception 'Every required knowledge check must be passed';
  end if;

  if p_status = 'PASSED'
    and v_has_existing
    and v_existing.status = 'PASSED'
    and v_existing."auditStep" < cardinality(v_existing."auditScheduleDays")
  then
    raise exception 'Complete the current certification audits before starting a new cycle';
  end if;

  v_event_cycle_id := case
    when p_status = 'PASSED' then v_cycle_id
    when v_has_existing and v_existing."currentCycleId" is not null
      then v_existing."currentCycleId"
    else v_cycle_id
  end;

  if p_status = 'PASSED' then
    v_next_audit := v_now + make_interval(days => p_audit_schedule_days[1]);
  end if;
  v_event := jsonb_build_object(
    'type', case
      when p_status = 'PASSED' then 'CERTIFIED'
      else 'STATUS'
    end,
    'cycleId', v_event_cycle_id,
    'at', v_now,
    'verifiedById', p_verified_by_id,
    'status', p_status,
    'evidence', coalesce(p_evidence, ''),
    'notes', coalesce(p_notes, ''),
    'auditScheduleDays', coalesce(to_jsonb(p_audit_schedule_days), '[]'::jsonb)
  );

  return query
  insert into public."PracticalSignoff" as signoff
    ("userId", "moduleId", status, "verifiedById", evidence, "criticalChecks", notes,
     "signedAt", "nextAuditAt", "auditScheduleDays", "auditStep", "auditLog",
     "currentCycleId", "updatedAt")
  values
    (p_user_id, p_module_id, p_status, p_verified_by_id, coalesce(p_evidence, ''),
     to_jsonb(coalesce(p_critical_checks, '{}'::text[])), coalesce(p_notes, ''),
     case when p_status = 'PASSED' then v_now else null end,
     v_next_audit,
     case when p_status = 'PASSED' then p_audit_schedule_days else '{}'::integer[] end,
     0, jsonb_build_array(v_event),
     case when p_status = 'PASSED' then v_cycle_id else null end, v_now)
  on conflict ("userId", "moduleId") do update set
    status = excluded.status,
    "verifiedById" = excluded."verifiedById",
    evidence = excluded.evidence,
    "criticalChecks" = excluded."criticalChecks",
    notes = excluded.notes,
    "signedAt" = excluded."signedAt",
    "nextAuditAt" = excluded."nextAuditAt",
    "auditScheduleDays" = excluded."auditScheduleDays",
    "auditStep" = 0,
    "auditLog" = signoff."auditLog" || jsonb_build_array(v_event),
    "currentCycleId" = excluded."currentCycleId",
    "updatedAt" = v_now
  returning *;
end;
$$;

create or replace function public.record_practical_audit_atomic(
  p_signoff_id text,
  p_result text,
  p_verified_by_id text,
  p_notes text
) returns setof public."PracticalSignoff"
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current public."PracticalSignoff"%rowtype;
  v_now timestamptz := now();
  v_next_step integer;
  v_next_audit timestamptz;
  v_event jsonb;
begin
  if p_result not in ('PASSED', 'NEEDS_COACHING') then
    raise exception 'Invalid audit result';
  end if;
  if length(btrim(coalesce(p_notes, ''))) < 3 then
    raise exception 'Audit evidence or coaching notes are required';
  end if;

  perform 1 from public."User"
  where id = p_verified_by_id and "isActive" = true
  for share;
  if not found then raise exception 'Verifier not found or inactive'; end if;

  select * into v_current
  from public."PracticalSignoff"
  where id = p_signoff_id
  for update;
  if not found or v_current.status <> 'PASSED' then
    raise exception 'Only passed certifications can be audited';
  end if;
  if v_current."nextAuditAt" is null or v_current."nextAuditAt" > v_now then
    raise exception 'This audit is not due yet';
  end if;
  if v_current."currentCycleId" is null
     or v_current."auditStep" >= cardinality(v_current."auditScheduleDays") then
    raise exception 'This certification cycle has no remaining audits';
  end if;

  v_event := jsonb_build_object(
    'type', 'AUDIT',
    'cycleId', v_current."currentCycleId",
    'at', v_now,
    'verifiedById', p_verified_by_id,
    'result', p_result,
    'notes', btrim(p_notes),
    'scheduleDay', v_current."auditScheduleDays"[v_current."auditStep" + 1]
  );
  v_next_step := v_current."auditStep" + 1;
  if p_result = 'PASSED' and v_next_step < cardinality(v_current."auditScheduleDays") then
    v_next_audit := v_current."signedAt" + make_interval(
      days => v_current."auditScheduleDays"[v_next_step + 1]
    );
  end if;

  return query
  update public."PracticalSignoff"
  set "auditLog" = "auditLog" || jsonb_build_array(v_event),
      "auditStep" = v_next_step,
      "nextAuditAt" = v_next_audit,
      status = case when p_result = 'NEEDS_COACHING' then 'NEEDS_COACHING' else 'PASSED' end,
      notes = btrim(p_notes),
      "verifiedById" = p_verified_by_id,
      "updatedAt" = v_now
  where id = p_signoff_id
  returning *;
end;
$$;

revoke execute on function public.assign_training_path_atomic(text, text, text, timestamp, timestamp, text) from public, anon, authenticated;
revoke execute on function public.remove_training_path_atomic(text, text) from public, anon, authenticated;
revoke execute on function public.reconcile_training_path_atomic(text, text) from public, anon, authenticated;
revoke execute on function public.archive_training_path_atomic(text) from public, anon, authenticated;
revoke execute on function public.update_training_path_atomic(text, text, text, boolean, text, text[], text[], text) from public, anon, authenticated;
revoke execute on function public.create_training_path_atomic(text, text, text, text[], text[]) from public, anon, authenticated;
revoke execute on function public.assign_paths_for_position_atomic(text, text) from public, anon, authenticated;
revoke execute on function public.assign_training_module_direct_atomic(text, text, text, boolean, timestamp) from public, anon, authenticated;
revoke execute on function public.archive_training_module_atomic(text) from public, anon, authenticated;
revoke execute on function public.archive_training_section_atomic(text) from public, anon, authenticated;
revoke execute on function public.record_practical_signoff_atomic(text, text, text, text, text, text[], text, integer[]) from public, anon, authenticated;
revoke execute on function public.record_practical_audit_atomic(text, text, text, text) from public, anon, authenticated;

grant execute on function public.assign_training_path_atomic(text, text, text, timestamp, timestamp, text) to service_role;
grant execute on function public.remove_training_path_atomic(text, text) to service_role;
grant execute on function public.reconcile_training_path_atomic(text, text) to service_role;
grant execute on function public.archive_training_path_atomic(text) to service_role;
grant execute on function public.update_training_path_atomic(text, text, text, boolean, text, text[], text[], text) to service_role;
grant execute on function public.create_training_path_atomic(text, text, text, text[], text[]) to service_role;
grant execute on function public.assign_paths_for_position_atomic(text, text) to service_role;
grant execute on function public.assign_training_module_direct_atomic(text, text, text, boolean, timestamp) to service_role;
grant execute on function public.archive_training_module_atomic(text) to service_role;
grant execute on function public.archive_training_section_atomic(text) to service_role;
grant execute on function public.record_practical_signoff_atomic(text, text, text, text, text, text[], text, integer[]) to service_role;
grant execute on function public.record_practical_audit_atomic(text, text, text, text) to service_role;

commit;
