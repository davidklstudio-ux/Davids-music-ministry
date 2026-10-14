create table if not exists public.ministry_site_stats (
  key text primary key,
  total bigint not null default 0 check (total >= 0)
);

insert into public.ministry_site_stats (key, total)
values ('signed_in_visits', 0)
on conflict (key) do nothing;

alter table public.ministry_site_stats enable row level security;
revoke all on table public.ministry_site_stats from anon, authenticated;

create or replace function public.get_signed_in_visits()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select total from public.ministry_site_stats where key = 'signed_in_visits';
$$;

revoke all on function public.get_signed_in_visits() from public;
grant execute on function public.get_signed_in_visits() to anon, authenticated;

create or replace function public.increment_signed_in_visits()
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_total bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.ministry_site_stats
  set total = total + 1
  where key = 'signed_in_visits'
  returning total into updated_total;

  return updated_total;
end;
$$;

revoke all on function public.increment_signed_in_visits() from public;
grant execute on function public.increment_signed_in_visits() to authenticated;
