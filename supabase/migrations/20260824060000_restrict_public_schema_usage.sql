-- The managed http extension is owned by supabase_admin, so the project
-- postgres role cannot remove the extension owner's legacy per-function ACLs.
-- TrainOS intentionally exposes no public-schema Data API surface to browser
-- roles; removing schema USAGE prevents those roles from resolving either the
-- extension helpers or application tables/functions.

begin;

revoke usage on schema public from public, anon, authenticated;
grant usage on schema public to service_role;

commit;
