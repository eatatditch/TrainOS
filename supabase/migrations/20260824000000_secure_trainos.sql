-- TrainOS production security baseline.
--
-- The Next.js server is the only database access layer and authenticates every
-- request before using its service-role client. Browser roles therefore need
-- no direct table access. This migration intentionally creates no anon or
-- authenticated policies.

begin;

-- Defense in depth for every table exposed through the public Data API schema.
alter table public."User" enable row level security;
alter table public."Section" enable row level security;
alter table public."Module" enable row level security;
alter table public."ModuleAsset" enable row level security;
alter table public."Quiz" enable row level security;
alter table public."QuizQuestion" enable row level security;
alter table public."QuizAttempt" enable row level security;
alter table public."TrainingPath" enable row level security;
alter table public."TrainingPathModule" enable row level security;
alter table public."UserTrainingPath" enable row level security;
alter table public."ModuleAssignment" enable row level security;
alter table public."ModuleCompletion" enable row level security;
alter table public."Announcement" enable row level security;
alter table public."SearchIndex" enable row level security;
alter table public."KitchenConfig" enable row level security;
alter table public."Ingredient" enable row level security;
alter table public."FoodItemIngredient" enable row level security;
alter table public."DietaryDefinition" enable row level security;

-- Remove the current blanket Data API grants. The service_role grant is kept
-- explicit so server-side application behavior does not depend on defaults.
revoke all privileges on all tables in schema public
  from public, anon, authenticated;
revoke all privileges on all sequences in schema public
  from public, anon, authenticated;
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- Prevent client roles from creating objects and from executing the public
-- pg_http helpers (http_get/http_post/etc.) as RPC endpoints.
revoke create on schema public from public, anon, authenticated;
revoke execute on all functions in schema public
  from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- New objects created by this migration owner stay private by default.
alter default privileges in schema public
  revoke all privileges on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke all privileges on sequences from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public
  grant execute on functions to service_role;

-- Storage writes are server-only. The ordered private-assets migration
-- backfills canonical object paths and then makes this bucket private.
drop policy if exists "Authenticated upload" on storage.objects;
drop policy if exists "Public read access" on storage.objects;
drop policy if exists "Service role full access" on storage.objects;
drop policy if exists "TrainOS server manages training assets" on storage.objects;

create policy "TrainOS server manages training assets"
on storage.objects
as permissive
for all
to service_role
using (bucket_id = 'training-assets')
with check (bucket_id = 'training-assets');

commit;
