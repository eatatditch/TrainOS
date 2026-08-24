begin;

alter table public."ModuleAssignment"
  add column if not exists "isDirect" boolean not null default true,
  add column if not exists "sourcePathIds" text[] not null default '{}'::text[];

create index if not exists "ModuleAssignment_source_paths_idx"
  on public."ModuleAssignment" using gin ("sourcePathIds");

create table if not exists public."PracticalSignoff" (
  id text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User"(id) on delete cascade,
  "moduleId" text not null references public."Module"(id) on delete restrict,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PASSED', 'NEEDS_COACHING', 'REVOKED')),
  "verifiedById" text references public."User"(id) on delete set null,
  evidence text not null default '',
  "criticalChecks" jsonb not null default '[]'::jsonb,
  notes text not null default '',
  "signedAt" timestamptz,
  "nextAuditAt" timestamptz,
  "auditScheduleDays" integer[] not null default '{}'::integer[],
  "auditStep" integer not null default 0 check ("auditStep" >= 0),
  "auditLog" jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp,
  unique ("userId", "moduleId"),
  check (jsonb_typeof("criticalChecks") = 'array'),
  check (jsonb_typeof("auditLog") = 'array'),
  check (cardinality("auditScheduleDays") <= 12),
  check ("auditStep" <= cardinality("auditScheduleDays")),
  check (
    status <> 'PASSED'
    or (
      "signedAt" is not null
      and length(btrim(evidence)) >= 12
      and cardinality("auditScheduleDays") > 0
    )
  )
);

create index if not exists "PracticalSignoff_user_status_idx"
  on public."PracticalSignoff" ("userId", status);
create index if not exists "PracticalSignoff_audit_idx"
  on public."PracticalSignoff" ("nextAuditAt")
  where "nextAuditAt" is not null;

alter table public."PracticalSignoff" enable row level security;
revoke all on table public."PracticalSignoff" from anon, authenticated;
grant all on table public."PracticalSignoff" to service_role;

commit;
