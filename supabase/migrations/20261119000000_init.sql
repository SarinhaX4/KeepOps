-- KeepOps — initial schema
-- Paste this whole file in Supabase > SQL Editor > New query > Run.
-- Safe to run only once on an empty project.

-- =========================================================
-- Enums
-- =========================================================
create type public.user_role as enum ('plantonista', 'analista');
create type public.app_criticality as enum ('alta', 'media', 'baixa');
create type public.step_kind as enum ('manual', 'http_check');
create type public.change_status as enum (
  'agendada', 'aguardando_liberacao', 'em_validacao', 'validada',
  'validada_com_ressalvas', 'reprovada', 'cancelada'
);
create type public.validation_result as enum ('pendente', 'aprovado', 'reprovado', 'na');
create type public.health_phase as enum ('baseline', 'pos', 'avulso');
create type public.incident_severity as enum ('sev1', 'sev2', 'sev3', 'sev4');
create type public.incident_status as enum ('aberta', 'em_acompanhamento', 'resolvida');
create type public.incident_event_kind as enum ('nota', 'acionamento', 'atualizacao', 'resolucao');
create type public.shift_kind as enum ('noturno', 'diurno', 'fim_de_semana');
create type public.shift_status as enum ('aberto', 'encerrado', 'recebido');
create type public.follow_up_source as enum ('change', 'incident', 'validation', 'manual');
create type public.follow_up_status as enum ('aberta', 'em_andamento', 'concluida');

-- =========================================================
-- Tables
-- =========================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  avatar_color text not null default '#10BFA5',
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  short_name text not null,
  description text,
  criticality public.app_criticality not null default 'media',
  health_url text,
  created_at timestamptz not null default now()
);

create table public.validation_steps (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  position int not null,
  title text not null,
  kind public.step_kind not null default 'manual',
  created_at timestamptz not null default now()
);

create table public.changes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  change_number text not null,
  title text not null,
  description text,
  window_start timestamptz not null,
  window_end timestamptz not null,
  executor_team text,
  executor_contact text,
  status public.change_status not null default 'agendada',
  conclusion_note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint changes_window_check check (window_end > window_start),
  constraint changes_number_unique unique (team_id, change_number)
);

create table public.change_applications (
  change_id uuid not null references public.changes (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  primary key (change_id, application_id)
);

create table public.validations (
  id uuid primary key default gen_random_uuid(),
  change_id uuid not null references public.changes (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  step_id uuid references public.validation_steps (id) on delete set null,
  step_title text not null,
  position int not null default 0,
  result public.validation_result not null default 'pendente',
  note text,
  evidence_path text,
  performed_by uuid references public.profiles (id) on delete set null,
  performed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.health_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  change_id uuid references public.changes (id) on delete cascade,
  phase public.health_phase not null,
  http_status int,
  latency_ms int,
  ok boolean not null,
  error_message text,
  checked_by uuid references public.profiles (id) on delete set null,
  checked_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  change_id uuid references public.changes (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  validation_id uuid references public.validations (id) on delete set null,
  title text not null,
  severity public.incident_severity not null,
  status public.incident_status not null default 'aberta',
  external_ticket text,
  opened_by uuid references public.profiles (id) on delete set null,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  kind public.incident_event_kind not null,
  description text not null,
  channel text,
  contact text,
  responded_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  kind public.shift_kind not null,
  status public.shift_status not null default 'aberto',
  notes text,
  next_steps text,
  handover_snapshot jsonb,
  received_by uuid references public.profiles (id) on delete set null,
  received_at timestamptz
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  title text not null,
  description text,
  source_type public.follow_up_source not null default 'manual',
  source_id uuid,
  application_id uuid references public.applications (id) on delete set null,
  created_in_shift_id uuid references public.shifts (id) on delete set null,
  status public.follow_up_status not null default 'aberta',
  assigned_to uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz,
  resolution_note text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint follow_ups_resolution_note check (status <> 'concluida' or resolution_note is not null)
);

-- Indexes for the most common filters
create index on public.changes (team_id, window_start desc);
create index on public.validations (change_id, application_id, position);
create index on public.health_checks (application_id, checked_at desc);
create index on public.incidents (team_id, opened_at desc);
create index on public.incident_events (incident_id, created_at);
create index on public.shifts (team_id, started_at desc);
create index on public.follow_ups (team_id, status);

-- =========================================================
-- Helpers and triggers
-- =========================================================

-- Team of the logged-in user (used by every RLS policy).
create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger changes_touch_updated_at
before update on public.changes
for each row execute function public.touch_updated_at();

-- Linking an application to a change copies its validation script as a checklist.
create or replace function public.create_validations_for_change_app()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.validations (change_id, application_id, step_id, step_title, position)
  select new.change_id, new.application_id, s.id, s.title, s.position
  from public.validation_steps s
  where s.application_id = new.application_id
  order by s.position;
  return new;
end;
$$;

create trigger change_applications_create_validations
after insert on public.change_applications
for each row execute function public.create_validations_for_change_app();

-- Unlinking removes only the checklist items still pending.
create or replace function public.remove_pending_validations_for_change_app()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.validations
  where change_id = old.change_id
    and application_id = old.application_id
    and result = 'pendente';
  return old;
end;
$$;

create trigger change_applications_remove_validations
after delete on public.change_applications
for each row execute function public.remove_pending_validations_for_change_app();

-- =========================================================
-- Row Level Security: users only see their own team
-- =========================================================
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.validation_steps enable row level security;
alter table public.changes enable row level security;
alter table public.change_applications enable row level security;
alter table public.validations enable row level security;
alter table public.health_checks enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_events enable row level security;
alter table public.shifts enable row level security;
alter table public.follow_ups enable row level security;

create policy teams_select on public.teams
  for select to authenticated using (id = public.current_team_id());

create policy profiles_select on public.profiles
  for select to authenticated using (team_id = public.current_team_id());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (team_id = public.current_team_id());

-- Tables that carry team_id directly
create policy applications_all on public.applications
  for all to authenticated
  using (team_id = public.current_team_id()) with check (team_id = public.current_team_id());
create policy changes_all on public.changes
  for all to authenticated
  using (team_id = public.current_team_id()) with check (team_id = public.current_team_id());
create policy incidents_all on public.incidents
  for all to authenticated
  using (team_id = public.current_team_id()) with check (team_id = public.current_team_id());
create policy shifts_all on public.shifts
  for all to authenticated
  using (team_id = public.current_team_id()) with check (team_id = public.current_team_id());
create policy follow_ups_all on public.follow_ups
  for all to authenticated
  using (team_id = public.current_team_id()) with check (team_id = public.current_team_id());

-- Child tables: access follows the parent row
create policy validation_steps_all on public.validation_steps
  for all to authenticated
  using (exists (select 1 from public.applications a
                 where a.id = application_id and a.team_id = public.current_team_id()))
  with check (exists (select 1 from public.applications a
                      where a.id = application_id and a.team_id = public.current_team_id()));

create policy change_applications_all on public.change_applications
  for all to authenticated
  using (exists (select 1 from public.changes c
                 where c.id = change_id and c.team_id = public.current_team_id()))
  with check (exists (select 1 from public.changes c
                      where c.id = change_id and c.team_id = public.current_team_id()));

create policy validations_all on public.validations
  for all to authenticated
  using (exists (select 1 from public.changes c
                 where c.id = change_id and c.team_id = public.current_team_id()))
  with check (exists (select 1 from public.changes c
                      where c.id = change_id and c.team_id = public.current_team_id()));

create policy health_checks_all on public.health_checks
  for all to authenticated
  using (exists (select 1 from public.applications a
                 where a.id = application_id and a.team_id = public.current_team_id()))
  with check (exists (select 1 from public.applications a
                      where a.id = application_id and a.team_id = public.current_team_id()));

create policy incident_events_all on public.incident_events
  for all to authenticated
  using (exists (select 1 from public.incidents i
                 where i.id = incident_id and i.team_id = public.current_team_id()))
  with check (exists (select 1 from public.incidents i
                      where i.id = incident_id and i.team_id = public.current_team_id()));

-- =========================================================
-- Grants (explicit, so the Data API works regardless of project defaults)
-- =========================================================
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant execute on function public.current_team_id() to authenticated;

-- =========================================================
-- Storage: private bucket for evidence photos (used in P2)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('evidences', 'evidences', false)
on conflict (id) do nothing;
