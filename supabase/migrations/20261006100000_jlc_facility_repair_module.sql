-- JLC (Joint Loss Committee) Facility Repair Report module
--
-- An INTERNAL-ONLY intake and repair log for problems with City-owned buildings. Reports may
-- describe security weaknesses (a broken lock, etc.), so nothing here is ever publicly readable:
--   * anon has NO privileges on any of these tables or on the storage bucket
--   * public submissions go exclusively through the jlc-submit Edge Function (service role)
--   * only admins plus the MSD and City Manager departments (is_jlc_user()) can read/update
-- These tables are deliberately separate from `cases` and feed no public analytics/export.

------------------------------------------------------------------------------------------
-- Types
------------------------------------------------------------------------------------------
create type public.jlc_notified_via as enum ('Phone', 'Email');
create type public.jlc_report_status as enum ('open', 'completed');

------------------------------------------------------------------------------------------
-- Access helpers. SECURITY DEFINER so they work regardless of user_profiles' own RLS.
------------------------------------------------------------------------------------------
create or replace function public.is_jlc_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid()
      and (
        up.role = 'admin'
        or (
          up.role = 'department'
          and up.department_id in (
            select d.id from public.departments d where d.name in ('MSD', 'City Manager')
          )
        )
      )
  );
$$;

create or replace function public.is_jlc_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  );
$$;

revoke all on function public.is_jlc_user() from public, anon;
revoke all on function public.is_jlc_admin() from public, anon;
grant execute on function public.is_jlc_user() to authenticated, service_role;
grant execute on function public.is_jlc_admin() to authenticated, service_role;

create or replace function public.jlc_actor_label()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'email', ''),
    case when auth.uid() is null then 'Public form / system' else 'Unknown user' end
  );
$$;

------------------------------------------------------------------------------------------
-- city_facilities: admin-managed lookup of buildings. Soft-delete only (is_active).
------------------------------------------------------------------------------------------
create table public.city_facilities (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 150),
  address text not null default '' check (char_length(address) <= 250),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index city_facilities_active_name_uniq
  on public.city_facilities (lower(btrim(name))) where is_active;

insert into public.city_facilities (name, address) values
  ('Police Station', '5 Hancock Terrace'),
  ('Proulx Community Center', '124 Memorial St'),
  ('City Hall', '316 Central St'),
  ('Public Library', '310 Central St'),
  ('Fire Station', '59 W Bow St'),
  ('MSD', '43 W Bow St'),
  ('Bessie Rowell Community Center', '12 Rowell Dr');

------------------------------------------------------------------------------------------
-- Confirmation numbers: JLC-<year>-<4+ digit counter>, atomic, resetting each year.
-- Callable only by the service role (the submit Edge Function).
------------------------------------------------------------------------------------------
create table public.facility_repair_counters (
  year integer primary key,
  last_value integer not null default 0
);

create or replace function public.next_jlc_confirmation_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yr integer := extract(year from (now() at time zone 'America/New_York'))::integer;
  n integer;
begin
  insert into public.facility_repair_counters (year, last_value) values (yr, 1)
  on conflict (year) do update set last_value = public.facility_repair_counters.last_value + 1
  returning last_value into n;
  return 'JLC-' || yr || '-' || lpad(n::text, 4, '0');
end;
$$;
revoke all on function public.next_jlc_confirmation_number() from public, anon, authenticated;
grant execute on function public.next_jlc_confirmation_number() to service_role;

------------------------------------------------------------------------------------------
-- facility_repair_reports
------------------------------------------------------------------------------------------
create table public.facility_repair_reports (
  id uuid primary key default gen_random_uuid(),
  confirmation_number text not null unique,

  -- Request half (public form)
  facility_id bigint references public.city_facilities (id),
  facility_other_name text,
  department text not null,
  issue_location text not null,
  reported_date date not null default ((now() at time zone 'America/New_York')::date),
  problem_description text not null,
  reported_by_name text not null,
  reporter_email text not null,
  reporter_phone text,
  submitted_at timestamptz not null default now(),

  -- Repair half (internal) -- all six required before status can be 'completed'
  repaired_by text,
  work_description text,
  completed_date date,
  parts_used text,
  reporter_notified_date date,
  reporter_notified_via public.jlc_notified_via,

  status public.jlc_report_status not null default 'open',
  completed_by_user_id uuid,
  completed_logged_at timestamptz,

  constraint jlc_facility_or_other check (
    facility_id is not null
    or nullif(btrim(coalesce(facility_other_name, '')), '') is not null
  ),
  constraint jlc_required_text_nonblank check (
    char_length(btrim(department)) > 0
    and char_length(btrim(issue_location)) > 0
    and char_length(btrim(problem_description)) > 0
    and char_length(btrim(reported_by_name)) > 0
  ),
  constraint jlc_text_lengths check (
    char_length(department) <= 150
    and char_length(issue_location) <= 250
    and char_length(problem_description) <= 4000
    and char_length(reported_by_name) <= 150
    and char_length(coalesce(facility_other_name, '')) <= 150
    and char_length(coalesce(reporter_phone, '')) <= 40
    and char_length(coalesce(repaired_by, '')) <= 150
    and char_length(coalesce(work_description, '')) <= 4000
    and char_length(coalesce(parts_used, '')) <= 1000
  ),
  -- Domain rule enforced at the database level too: exact @franklinnh.gov, no lookalikes.
  constraint jlc_reporter_email_domain check (
    reporter_email ~* '^[^@[:space:]]+@franklinnh\.gov$' and char_length(reporter_email) <= 254
  ),
  -- "All six required to mark Completed", enforced here and not only in the UI.
  constraint jlc_completed_requires_repair_fields check (
    status = 'open'
    or (
      nullif(btrim(coalesce(repaired_by, '')), '') is not null
      and nullif(btrim(coalesce(work_description, '')), '') is not null
      and completed_date is not null
      and nullif(btrim(coalesce(parts_used, '')), '') is not null
      and reporter_notified_date is not null
      and reporter_notified_via is not null
    )
  )
);
create index facility_repair_reports_status_idx on public.facility_repair_reports (status);
create index facility_repair_reports_reported_date_idx on public.facility_repair_reports (reported_date desc);
create index facility_repair_reports_facility_idx on public.facility_repair_reports (facility_id);

------------------------------------------------------------------------------------------
-- facility_repair_attachments (max 3 per report, 5 MB each, images only)
------------------------------------------------------------------------------------------
create table public.facility_repair_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.facility_repair_reports (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  content_type text not null check (
    content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')
  ),
  uploaded_at timestamptz not null default now()
);
create index facility_repair_attachments_report_idx on public.facility_repair_attachments (report_id);

create or replace function public.jlc_limit_attachments()
returns trigger
language plpgsql
as $$
begin
  -- Lock the parent row so two concurrent inserts can't both slip past the cap.
  perform 1 from public.facility_repair_reports where id = new.report_id for update;
  if (select count(*) from public.facility_repair_attachments where report_id = new.report_id) >= 3 then
    raise exception 'A report can have at most 3 attachments';
  end if;
  return new;
end;
$$;
create trigger trg_jlc_attachments_limit
  before insert on public.facility_repair_attachments
  for each row execute function public.jlc_limit_attachments();

------------------------------------------------------------------------------------------
-- facility_repair_activity_log: field-level audit trail, written only by triggers/RPC below
-- so it can't be skipped or forged from the client.
------------------------------------------------------------------------------------------
create table public.facility_repair_activity_log (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('report', 'facility')),
  report_id uuid references public.facility_repair_reports (id) on delete cascade,
  facility_id bigint references public.city_facilities (id),
  action_type text not null,
  field_name text,
  old_value text,
  new_value text,
  actor_user_id uuid,
  actor_label text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index facility_repair_activity_log_report_idx
  on public.facility_repair_activity_log (report_id, created_at desc);

------------------------------------------------------------------------------------------
-- Per-IP throttle for the public endpoint (hashed IPs only), service role only.
------------------------------------------------------------------------------------------
create table public.facility_repair_rate_limits (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index facility_repair_rate_limits_lookup_idx
  on public.facility_repair_rate_limits (ip_hash, created_at);

------------------------------------------------------------------------------------------
-- Guard + derived fields on report updates
------------------------------------------------------------------------------------------
create or replace function public.jlc_guard_report_update()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.confirmation_number is distinct from old.confirmation_number
     or new.submitted_at is distinct from old.submitted_at
     or new.reported_date is distinct from old.reported_date then
    raise exception 'The confirmation number, submission time, and reported date cannot be changed';
  end if;

  -- The request half is locked after submission except for admins (every change is logged).
  -- auth.uid() is null only for the service role / server code, which is trusted.
  if auth.uid() is not null and not public.is_jlc_admin() then
    if new.facility_id is distinct from old.facility_id
       or new.facility_other_name is distinct from old.facility_other_name
       or new.department is distinct from old.department
       or new.issue_location is distinct from old.issue_location
       or new.problem_description is distinct from old.problem_description
       or new.reported_by_name is distinct from old.reported_by_name
       or new.reporter_email is distinct from old.reporter_email
       or new.reporter_phone is distinct from old.reporter_phone then
      raise exception 'Only administrators can change the original report details';
    end if;
  end if;

  if new.status = 'completed' and old.status <> 'completed' then
    new.completed_by_user_id := auth.uid();
    new.completed_logged_at := now();
  elsif new.status = 'open' then
    new.completed_by_user_id := null;
    new.completed_logged_at := null;
  else
    new.completed_by_user_id := old.completed_by_user_id;
    new.completed_logged_at := old.completed_logged_at;
  end if;

  return new;
end;
$$;
create trigger trg_jlc_reports_guard
  before update on public.facility_repair_reports
  for each row execute function public.jlc_guard_report_update();

------------------------------------------------------------------------------------------
-- Audit triggers
------------------------------------------------------------------------------------------
create or replace function public.jlc_audit_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  o jsonb;
  n jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.facility_repair_activity_log
      (entity_type, report_id, action_type, actor_user_id, actor_label, notes)
    values
      ('report', new.id, 'created', auth.uid(), public.jlc_actor_label(),
       'Report ' || new.confirmation_number || ' submitted');
    return new;
  end if;

  o := to_jsonb(old);
  n := to_jsonb(new);
  for k in select jsonb_object_keys(n) loop
    if k in ('completed_by_user_id', 'completed_logged_at') then
      continue;
    end if;
    if (o -> k) is distinct from (n -> k) then
      insert into public.facility_repair_activity_log
        (entity_type, report_id, action_type, field_name, old_value, new_value, actor_user_id, actor_label)
      values
        ('report', new.id,
         case when k = 'status' then 'status_changed' else 'field_updated' end,
         k, o ->> k, n ->> k, auth.uid(), public.jlc_actor_label());
    end if;
  end loop;
  return new;
end;
$$;
create trigger trg_jlc_reports_audit
  after insert or update on public.facility_repair_reports
  for each row execute function public.jlc_audit_report();

create or replace function public.jlc_audit_attachment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.facility_repair_activity_log
      (entity_type, report_id, action_type, new_value, actor_user_id, actor_label)
    values ('report', new.report_id, 'attachment_added', new.file_name, auth.uid(), public.jlc_actor_label());
    return new;
  end if;
  insert into public.facility_repair_activity_log
    (entity_type, report_id, action_type, old_value, actor_user_id, actor_label)
  select 'report', old.report_id, 'attachment_removed', old.file_name, auth.uid(), public.jlc_actor_label()
  where exists (select 1 from public.facility_repair_reports r where r.id = old.report_id);
  return old;
end;
$$;
create trigger trg_jlc_attachments_audit
  after insert or delete on public.facility_repair_attachments
  for each row execute function public.jlc_audit_attachment();

create or replace function public.jlc_audit_facility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  o jsonb;
  n jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.facility_repair_activity_log
      (entity_type, facility_id, action_type, new_value, actor_user_id, actor_label)
    values ('facility', new.id, 'facility_added', new.name, auth.uid(), public.jlc_actor_label());
    return new;
  end if;
  o := to_jsonb(old);
  n := to_jsonb(new);
  for k in select jsonb_object_keys(n) loop
    if (o -> k) is distinct from (n -> k) then
      insert into public.facility_repair_activity_log
        (entity_type, facility_id, action_type, field_name, old_value, new_value, actor_user_id, actor_label)
      values ('facility', new.id, 'facility_updated', k, o ->> k, n ->> k, auth.uid(), public.jlc_actor_label());
    end if;
  end loop;
  return new;
end;
$$;
create trigger trg_jlc_facilities_audit
  after insert or update on public.city_facilities
  for each row execute function public.jlc_audit_facility();

-- Print events: the client can't write the log directly, so it calls this RPC.
create or replace function public.log_jlc_print(p_report_ids uuid[], p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_jlc_user() then
    raise exception 'Not authorized';
  end if;
  insert into public.facility_repair_activity_log
    (entity_type, report_id, action_type, notes, actor_user_id, actor_label)
  select 'report', r.id, 'printed', 'Printed (' || coalesce(p_mode, 'form') || ')', auth.uid(), public.jlc_actor_label()
  from public.facility_repair_reports r
  where r.id = any (p_report_ids);
end;
$$;
revoke all on function public.log_jlc_print(uuid[], text) from public, anon;
grant execute on function public.log_jlc_print(uuid[], text) to authenticated, service_role;

------------------------------------------------------------------------------------------
-- Privileges + RLS. anon gets nothing at all; authenticated gets only what the UI needs and
-- only through is_jlc_user().
------------------------------------------------------------------------------------------
revoke all on
  public.city_facilities,
  public.facility_repair_reports,
  public.facility_repair_attachments,
  public.facility_repair_activity_log,
  public.facility_repair_counters,
  public.facility_repair_rate_limits
from anon, authenticated;

grant select, insert, update on public.city_facilities to authenticated;
grant select on public.facility_repair_reports to authenticated;
-- Column-level UPDATE: ids, confirmation number, dates, and completion metadata are never
-- client-writable (the guard trigger derives completed_by/logged_at itself).
grant update (
  facility_id, facility_other_name, department, issue_location, problem_description,
  reported_by_name, reporter_email, reporter_phone,
  repaired_by, work_description, completed_date, parts_used,
  reporter_notified_date, reporter_notified_via, status
) on public.facility_repair_reports to authenticated;
grant select on public.facility_repair_attachments to authenticated;
grant select on public.facility_repair_activity_log to authenticated;

alter table public.city_facilities enable row level security;
alter table public.facility_repair_reports enable row level security;
alter table public.facility_repair_attachments enable row level security;
alter table public.facility_repair_activity_log enable row level security;
alter table public.facility_repair_counters enable row level security;
alter table public.facility_repair_rate_limits enable row level security;

create policy city_facilities_jlc_select on public.city_facilities
  for select to authenticated using (public.is_jlc_user());
create policy city_facilities_jlc_insert on public.city_facilities
  for insert to authenticated with check (public.is_jlc_user());
create policy city_facilities_jlc_update on public.city_facilities
  for update to authenticated using (public.is_jlc_user()) with check (public.is_jlc_user());

create policy facility_repair_reports_jlc_select on public.facility_repair_reports
  for select to authenticated using (public.is_jlc_user());
create policy facility_repair_reports_jlc_update on public.facility_repair_reports
  for update to authenticated using (public.is_jlc_user()) with check (public.is_jlc_user());

create policy facility_repair_attachments_jlc_select on public.facility_repair_attachments
  for select to authenticated using (public.is_jlc_user());

create policy facility_repair_activity_log_jlc_select on public.facility_repair_activity_log
  for select to authenticated using (public.is_jlc_user());

-- facility_repair_counters / facility_repair_rate_limits: RLS on, no policies, no grants =
-- reachable by the service role (Edge Function) only.

------------------------------------------------------------------------------------------
-- Storage: PRIVATE bucket. No anon access of any kind and no client-side uploads; the Edge
-- Function uploads with the service role. Authorized staff read through signed URLs.
------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jlc-facility-repair', 'jlc-facility-repair', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy jlc_facility_repair_staff_select on storage.objects
  for select to authenticated
  using (bucket_id = 'jlc-facility-repair' and public.is_jlc_user());
