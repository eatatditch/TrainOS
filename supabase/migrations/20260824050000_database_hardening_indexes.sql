-- Final production hardening after all TrainOS functions and tables exist.
--
-- The legacy http/pg_net extensions were installed before the application
-- security baseline and can restore default EXECUTE ACLs owned by
-- supabase_admin. TrainOS does not call those helpers from the Data API, so
-- client roles must not be able to invoke them.

begin;

revoke execute on all functions in schema public
  from public, anon, authenticated;

grant execute on all functions in schema public to service_role;

-- Cover the remaining foreign keys reported by the Supabase performance
-- advisor. These tables are small today, but certification and assignment
-- history will grow steadily once the rebuilt curriculum launches.
create index if not exists "ModuleAssignment_assignedById_idx"
  on public."ModuleAssignment" ("assignedById");

create index if not exists "PracticalSignoff_moduleId_idx"
  on public."PracticalSignoff" ("moduleId");

create index if not exists "PracticalSignoff_verifiedById_idx"
  on public."PracticalSignoff" ("verifiedById");

commit;
