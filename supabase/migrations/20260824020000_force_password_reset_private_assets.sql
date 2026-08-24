-- Force replacement of historical/default credentials and preserve existing
-- training assets while moving their bucket behind authenticated app routes.

begin;

alter table public."User"
  add column if not exists "mustResetPassword" boolean;

update public."User"
set "mustResetPassword" = true
where "mustResetPassword" is null;

alter table public."User"
  alter column "mustResetPassword" set default true,
  alter column "mustResetPassword" set not null;

alter table public."ModuleAsset"
  add column if not exists "storagePath" text;

-- Match legacy public URLs to the authoritative object name. Existing asset
-- filenames include spaces encoded as %20; the join deliberately handles both
-- encoded and unencoded paths without inventing or moving any object.
update public."ModuleAsset" as asset
set "storagePath" = object.name
from storage.objects as object
where object.bucket_id = 'training-assets'
  and asset."storagePath" is null
  and regexp_replace(asset."fileUrl", '^.*/training-assets/', '') in (
    object.name,
    replace(object.name, ' ', '%20')
  );

-- Fail closed instead of making the bucket private while any live asset lacks
-- a resolvable object. The transaction rollback leaves both data and bucket
-- visibility unchanged so the unmatched row can be repaired safely.
do $$
begin
  if exists (
    select 1
    from public."ModuleAsset"
    where "storagePath" is null
  ) then
    raise exception 'Cannot privatize training-assets: unresolved ModuleAsset storage path';
  end if;
end
$$;

alter table public."ModuleAsset"
  alter column "storagePath" set not null;

-- Persistent database URLs now point at the authenticated application route.
update public."ModuleAsset"
set "fileUrl" = '/api/assets/' || id
where "storagePath" is not null
  and "fileUrl" is distinct from '/api/assets/' || id;

-- Object reads now require a server-generated time-limited signed URL. The
-- preceding security migration already restricts writes to service_role.
update storage.buckets
set public = false,
    updated_at = now()
where id = 'training-assets';

commit;
