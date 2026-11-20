-- KeepOps — GMUD status history (feeds the change timeline).
-- Paste in Supabase > SQL Editor > New query > Run. Run once, after 20261119000000_init.sql.

create table public.change_events (
  id uuid primary key default gen_random_uuid(),
  change_id uuid not null references public.changes (id) on delete cascade,
  from_status public.change_status,
  to_status public.change_status not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index on public.change_events (change_id, changed_at);

-- Logs creation and every status change automatically.
create or replace function public.log_change_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.change_events (change_id, from_status, to_status, changed_by, changed_at)
    values (new.id, null, new.status, coalesce(auth.uid(), new.created_by), new.created_at);
  elsif new.status is distinct from old.status then
    insert into public.change_events (change_id, from_status, to_status, note, changed_by)
    values (new.id, old.status, new.status, new.conclusion_note, auth.uid());
  end if;
  return new;
end;
$$;

create trigger changes_log_status
after insert or update of status on public.changes
for each row execute function public.log_change_status();

alter table public.change_events enable row level security;

create policy change_events_select on public.change_events
  for select to authenticated
  using (exists (select 1 from public.changes c
                 where c.id = change_id and c.team_id = public.current_team_id()));

grant select on public.change_events to authenticated;
grant all on public.change_events to service_role;

-- Backfill: one "created" event for changes that already exist.
insert into public.change_events (change_id, from_status, to_status, changed_by, changed_at)
select id, null, status, created_by, created_at from public.changes;
