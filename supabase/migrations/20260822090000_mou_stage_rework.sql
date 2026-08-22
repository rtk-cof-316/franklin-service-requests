-- MOU Module Rework: new stage vocabulary, org decision fields, admin-editable section
-- text, retirement of per-section org comments.
--
-- Replaces the 9-value mou_stage enum with 8 values matching the new intake/review flow:
-- org_intake, missing_information, manager_review_brenda, manager_review_city_manager,
-- submitter_needs_review, ready_for_council, approved, denied. Both current_stage and
-- return_to_stage use this enum. council_decision/council_decision_date/finalized_at/
-- exported_at are dropped — approved/denied now ARE the decision, and print/export is no
-- longer a stage-mutating action. council_date is kept (still used once a submission
-- reaches ready_for_council).
--
-- Verified against real data before writing this: the one live submission (MOU-2026-1,
-- id 835b3239-e193-4298-b4e1-03180ef5526b) has current_stage='org_revision',
-- return_to_stage='brenda_review', and zero mou_submission_section_comments rows.

create type public.mou_stage_new as enum (
  'org_intake',
  'missing_information',
  'manager_review_brenda',
  'manager_review_city_manager',
  'submitter_needs_review',
  'ready_for_council',
  'approved',
  'denied'
);

create type public.mou_org_review_decision as enum ('looks_good', 'accept_with_changes', 'do_not_like');

alter table public.mou_submissions add column current_stage_new public.mou_stage_new;
alter table public.mou_submissions add column return_to_stage_new public.mou_stage_new;

update public.mou_submissions set current_stage_new = case
  when current_stage = 'org_drafting' then 'org_intake'
  when current_stage in ('submitted', 'brenda_review') then 'manager_review_brenda'
  when current_stage = 'city_manager_review' then 'manager_review_city_manager'
  when current_stage = 'org_revision' then 'missing_information'
  when current_stage in ('finalized', 'exported', 'scheduled_council') then 'ready_for_council'
  when current_stage = 'council_decided' and council_decision = 'approved' then 'approved'
  when current_stage = 'council_decided' and council_decision = 'disapproved' then 'denied'
  when current_stage = 'council_decided' and council_decision = 'sent_back_for_edits' then 'manager_review_city_manager'
  else 'org_intake'
end::public.mou_stage_new;

update public.mou_submissions set return_to_stage_new = case
  when return_to_stage = 'brenda_review' then 'manager_review_brenda'
  when return_to_stage = 'city_manager_review' then 'manager_review_city_manager'
  else null
end::public.mou_stage_new;

drop index if exists public.mou_submissions_stage_idx;

alter table public.mou_submissions drop column current_stage;
alter table public.mou_submissions drop column return_to_stage;
alter table public.mou_submissions drop column council_decision;
alter table public.mou_submissions drop column council_decision_date;
alter table public.mou_submissions drop column finalized_at;
alter table public.mou_submissions drop column exported_at;

drop type public.mou_stage;
drop type public.mou_council_decision;

alter type public.mou_stage_new rename to mou_stage;

alter table public.mou_submissions rename column current_stage_new to current_stage;
alter table public.mou_submissions rename column return_to_stage_new to return_to_stage;

alter table public.mou_submissions alter column current_stage set not null;
alter table public.mou_submissions alter column current_stage set default 'org_intake';

create index mou_submissions_stage_idx on public.mou_submissions(current_stage);

alter table public.mou_submissions add column org_review_decision public.mou_org_review_decision;
alter table public.mou_submissions add column org_review_comment text;
alter table public.mou_submissions add column org_review_decided_at timestamptz;

-- Admin-editable per-section agreement text. Written lazily — only once an admin actually
-- edits a section. Absent a row, every render (admin textarea seed, org's page-2 review,
-- print) falls back to token-substituting locked_text + the org's field values, via the
-- single shared resolveSectionText() helper (src/mouTextRender.js) — never three parallel
-- copies of that fallback logic.
create table public.mou_submission_section_text (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.mou_submissions(id) on delete cascade,
  template_section_id uuid not null references public.mou_template_sections(id),
  edited_text text not null,
  edited_by text not null,
  edited_at timestamptz not null default now(),
  unique (submission_id, template_section_id)
);
create index mou_submission_section_text_submission_id_idx on public.mou_submission_section_text(submission_id);

-- Retire the org's per-section "suggest a change" comments (replaced by one decision-level
-- comment on page 2). Preserve any existing rows as activity log entries first, so real
-- org input is never silently discarded, before dropping the table.
insert into public.mou_activity_log (submission_id, actor_type, actor_name, action_type, field_or_section, notes, created_at)
select c.submission_id, 'org', s.org_contact_name, 'section_comment_retired', c.template_section_id::text, c.comment_text, c.created_at
from public.mou_submission_section_comments c
join public.mou_submissions s on s.id = c.submission_id;

drop table public.mou_submission_section_comments;
