-- System Feedback: staff report issues with, or request features for, this system.
--
-- Internal only: nothing here is reachable without logging in.
--   * Any logged-in staff member submits through the system-feedback-submit Edge Function
--     (which validates the session, rate-limits, saves, and emails the superuser) and can read
--     their OWN submissions plus the status/response the superuser gives them.
--   * Only a "system superuser" can see everyone's submissions and change status/response.
--
-- Superusers live in their own table, deliberately NOT a flag on user_profiles: user_profiles'
-- existing "admin full access" policy would let any admin set the flag on themselves.
-- system_superusers has no client privileges at all; rows are added only by SQL / the dashboard.

create table public.system_superusers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_system_superuser()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.system_superusers s where s.user_id = auth.uid());
$$;
revoke all on function public.is_system_superuser() from public, anon;
grant execute on function public.is_system_superuser() to authenticated, service_role;

create table public.system_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_type text not null check (feedback_type in ('issue', 'feature')),
  title text not null check (char_length(btrim(title)) between 1 and 150),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  screen text check (screen is null or char_length(screen) <= 150),
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_by_email text not null,
  status text not null default 'new'
    check (status in ('new', 'in_review', 'planned', 'in_progress', 'done', 'wont_do')),
  response text check (response is null or char_length(response) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index system_feedback_status_idx on public.system_feedback (status, created_at desc);
create index system_feedback_submitter_idx on public.system_feedback (submitted_by, created_at desc);

create table public.system_feedback_log (
  id bigint generated always as identity primary key,
  feedback_id uuid not null references public.system_feedback (id) on delete cascade,
  action_type text not null,
  field_name text,
  old_value text,
  new_value text,
  actor_label text not null,
  created_at timestamptz not null default now()
);
create index system_feedback_log_idx on public.system_feedback_log (feedback_id, created_at desc);

------------------------------------------------------------------------------------------
-- Triggers (search_path pinned; EXECUTE revoked below since only triggers call them)
------------------------------------------------------------------------------------------
create or replace function public.system_feedback_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_system_feedback_touch
  before update on public.system_feedback
  for each row execute function public.system_feedback_touch();

create or replace function public.system_feedback_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := coalesce(nullif(auth.jwt() ->> 'email', ''), 'system');
begin
  if tg_op = 'INSERT' then
    insert into public.system_feedback_log (feedback_id, action_type, new_value, actor_label)
    values (new.id, 'submitted', new.feedback_type, new.submitted_by_email);
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.system_feedback_log (feedback_id, action_type, field_name, old_value, new_value, actor_label)
    values (new.id, 'status_changed', 'status', old.status, new.status, actor);
  end if;
  if new.response is distinct from old.response then
    insert into public.system_feedback_log (feedback_id, action_type, field_name, old_value, new_value, actor_label)
    values (new.id, 'response_updated', 'response', old.response, new.response, actor);
  end if;
  return new;
end;
$$;
create trigger trg_system_feedback_audit
  after insert or update on public.system_feedback
  for each row execute function public.system_feedback_audit();

revoke all on function public.system_feedback_touch() from public, anon, authenticated;
revoke all on function public.system_feedback_audit() from public, anon, authenticated;

------------------------------------------------------------------------------------------
-- Privileges + RLS. anon gets nothing. Clients never INSERT (the Edge Function does) or DELETE.
------------------------------------------------------------------------------------------
revoke all on public.system_superusers, public.system_feedback, public.system_feedback_log from anon, authenticated;

grant select on public.system_feedback to authenticated;
grant update (status, response) on public.system_feedback to authenticated;
grant select on public.system_feedback_log to authenticated;

alter table public.system_superusers enable row level security;
alter table public.system_feedback enable row level security;
alter table public.system_feedback_log enable row level security;

create policy system_feedback_select on public.system_feedback
  for select to authenticated
  using (submitted_by = auth.uid() or public.is_system_superuser());

create policy system_feedback_superuser_update on public.system_feedback
  for update to authenticated
  using (public.is_system_superuser())
  with check (public.is_system_superuser());

create policy system_feedback_log_select on public.system_feedback_log
  for select to authenticated
  using (public.is_system_superuser());

-- system_superusers: RLS on, no policies, no grants = service role / SQL editor only.
