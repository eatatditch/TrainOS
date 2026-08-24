-- Durable per-user limits for authenticated search and AI endpoints.
-- The service-role-only function performs the increment atomically so limits
-- remain effective across Vercel regions and concurrent function instances.

begin;

create table if not exists public."ApiRateLimit" (
  "key" text primary key,
  "windowStart" timestamptz not null default now(),
  "count" integer not null default 0 check ("count" >= 0),
  "updatedAt" timestamptz not null default now()
);

alter table public."ApiRateLimit" enable row level security;
revoke all privileges on public."ApiRateLimit" from public, anon, authenticated;
grant all privileges on public."ApiRateLimit" to service_role;

create index if not exists "ApiRateLimit_updatedAt_idx"
  on public."ApiRateLimit" ("updatedAt");

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if p_key is null or length(p_key) > 250 or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public."ApiRateLimit" as limits
    ("key", "windowStart", "count", "updatedAt")
  values (p_key, now(), 1, now())
  on conflict ("key") do update set
    "windowStart" = case
      when limits."windowStart" <= now() - make_interval(secs => p_window_seconds)
        then now()
      else limits."windowStart"
    end,
    "count" = case
      when limits."windowStart" <= now() - make_interval(secs => p_window_seconds)
        then 1
      else limits."count" + 1
    end,
    "updatedAt" = now()
  returning "count" <= p_limit into allowed;

  return allowed;
end;
$$;

revoke execute on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

commit;
