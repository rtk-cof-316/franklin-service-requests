-- CAR / Agenda / Packet Module: enums, tables, indexes

create type public.car_submitter_type as enum ('staff', 'council', 'public');

create type public.car_status as enum (
  'submitted',
  'under_review',
  'rejected',
  'pending_work_session_assignment',
  'scheduled_for_work_session',
  'answer_due',
  'answer_submitted',
  'pushed_to_reassignment',
  'included_in_packet',
  'packet_published',
  'decided_at_meeting'
);

create type public.car_review_decision as enum ('rejected', 'approved_normal', 'approved_hot');

create type public.car_cycle_status as enum (
  'open_for_submissions', 'in_review', 'active', 'packet_published', 'closed'
);

create table public.meeting_cycles (
  id uuid primary key default gen_random_uuid(),
  meeting_type text not null default 'regular_council_meeting',
  meeting_date date not null,
  meeting_time text,
  meeting_location text,
  meeting_zoom_link text,
  meeting_zoom_phone text,

  review_date_default date not null,
  review_date_override date,
  packet_publish_date_default date not null,
  packet_publish_date_override date,
  car_submission_close_default date not null,
  car_submission_close_override date,

  status public.car_cycle_status not null default 'open_for_submissions',
  standard_sections text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meeting_cycles_status_idx on public.meeting_cycles(status);
create index meeting_cycles_date_idx on public.meeting_cycles(meeting_date);

create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  meeting_cycle_id uuid not null references public.meeting_cycles(id) on delete cascade,
  session_date date not null,
  answers_due_default date not null,
  answers_due_override date,
  created_at timestamptz not null default now()
);
create index work_sessions_cycle_idx on public.work_sessions(meeting_cycle_id);

create table public.car_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_number text not null unique,
  sequence_number int,
  year int,
  pin_hash text not null,
  pin_failed_attempts int not null default 0,
  pin_locked_until timestamptz,

  submitter_type public.car_submitter_type not null,
  submitter_name text not null,
  submitter_email text not null,
  submitter_phone text,

  from_field text,
  subject text,
  history text,
  recommendation text,
  suggested_motion text,
  discussion text,
  alternatives text,

  requires_resolution boolean not null default false,
  requires_public_hearing boolean not null default false,

  submitter_confirmed_at timestamptz,

  status public.car_status not null default 'submitted',
  meeting_cycle_id uuid not null references public.meeting_cycles(id),
  work_session_id uuid references public.work_sessions(id),

  review_decision public.car_review_decision,
  review_note text,
  reviewed_at timestamptz,
  reviewed_by text,

  answer_text text,
  answer_submitted_at timestamptz,
  answer_signed_off_at timestamptz,
  answer_signed_off_by text,

  agenda_position int,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index car_submissions_status_idx on public.car_submissions(status);
create index car_submissions_cycle_idx on public.car_submissions(meeting_cycle_id);
create index car_submissions_number_idx on public.car_submissions(submission_number);
create index car_submissions_year_sequence_idx on public.car_submissions(year, sequence_number);

create table public.car_attachments (
  id uuid primary key default gen_random_uuid(),
  car_submission_id uuid not null references public.car_submissions(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);
create index car_attachments_submission_idx on public.car_attachments(car_submission_id);

create table public.car_reassignment_history (
  id uuid primary key default gen_random_uuid(),
  car_submission_id uuid not null references public.car_submissions(id) on delete cascade,
  from_meeting_cycle_id uuid references public.meeting_cycles(id),
  to_meeting_cycle_id uuid not null references public.meeting_cycles(id),
  from_status public.car_status,
  to_status public.car_status not null,
  reason text,
  reassigned_by text not null,
  created_at timestamptz not null default now()
);
create index car_reassignment_history_submission_idx on public.car_reassignment_history(car_submission_id);

create table public.car_activity_log (
  id uuid primary key default gen_random_uuid(),
  car_submission_id uuid not null references public.car_submissions(id) on delete cascade,
  actor_type text not null check (actor_type in ('submitter', 'admin', 'system')),
  actor_name text not null,
  action_type text not null,
  old_value text,
  new_value text,
  notes text,
  created_at timestamptz not null default now()
);
create index car_activity_log_submission_idx on public.car_activity_log(car_submission_id, created_at);
