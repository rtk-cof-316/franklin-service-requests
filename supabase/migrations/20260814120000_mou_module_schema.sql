-- MOU Module: enums, tables, indexes

create type public.mou_stage as enum (
  'org_drafting',
  'submitted',
  'brenda_review',
  'city_manager_review',
  'org_revision',
  'finalized',
  'exported',
  'scheduled_council',
  'council_decided'
);

create type public.mou_council_decision as enum (
  'approved',
  'disapproved',
  'sent_back_for_edits'
);

create type public.mou_actor_type as enum ('org', 'admin', 'council', 'system');

create table public.mou_templates (
  id uuid primary key default gen_random_uuid(),
  version_number int not null,
  is_current boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now()
);
create unique index mou_templates_one_current_idx on public.mou_templates(is_current) where is_current;

create table public.mou_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.mou_templates(id) on delete cascade,
  section_order int not null,
  title text not null,
  locked_text text not null default '',
  field_definitions jsonb not null default '[]'::jsonb,
  allow_section_comment boolean not null default true
);
create index mou_template_sections_template_id_idx on public.mou_template_sections(template_id, section_order);

create table public.mou_submissions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.mou_templates(id),
  org_name text not null,
  org_contact_name text not null,
  org_email text not null,
  submission_number text not null unique,
  pin_hash text not null,
  pin_failed_attempts int not null default 0,
  pin_locked_until timestamptz,
  current_stage public.mou_stage not null default 'org_drafting',
  return_to_stage public.mou_stage,
  council_date date,
  council_decision public.mou_council_decision,
  council_decision_date date,
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  exported_at timestamptz
);
create index mou_submissions_stage_idx on public.mou_submissions(current_stage);
create index mou_submissions_number_idx on public.mou_submissions(submission_number);

create table public.mou_submission_field_values (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mou_submissions(id) on delete cascade,
  template_section_id uuid not null references public.mou_template_sections(id),
  field_key text not null,
  value text,
  updated_at timestamptz not null default now(),
  unique (submission_id, field_key)
);
create index mou_submission_field_values_submission_id_idx on public.mou_submission_field_values(submission_id);

create table public.mou_submission_section_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mou_submissions(id) on delete cascade,
  template_section_id uuid not null references public.mou_template_sections(id),
  comment_text text not null,
  created_at timestamptz not null default now()
);
create index mou_submission_section_comments_submission_id_idx on public.mou_submission_section_comments(submission_id);

create table public.mou_review_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mou_submissions(id) on delete cascade,
  template_section_id uuid references public.mou_template_sections(id),
  author_email text not null,
  author_name text not null,
  comment_text text not null,
  org_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index mou_review_comments_submission_id_idx on public.mou_review_comments(submission_id);

create table public.mou_supporting_documents (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mou_submissions(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  uploaded_by text not null,
  uploaded_at timestamptz not null default now()
);
create index mou_supporting_documents_submission_id_idx on public.mou_supporting_documents(submission_id);

create table public.mou_activity_log (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mou_submissions(id) on delete cascade,
  actor_type public.mou_actor_type not null,
  actor_name text not null,
  action_type text not null,
  field_or_section text,
  old_value text,
  new_value text,
  notes text,
  created_at timestamptz not null default now()
);
create index mou_activity_log_submission_id_idx on public.mou_activity_log(submission_id, created_at);
