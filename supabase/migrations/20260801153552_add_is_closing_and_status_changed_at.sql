-- Schema gap fixes ahead of department routing/escalation work:
-- 1. "Closed" was only ever a hardcoded lowercase status-name array duplicated
--    across ~8 places in the frontend. Add a real, queryable boolean instead.
-- 2. There was no timestamp for "when did this case's (or department
--    assignment's) status last change" — only free-text audit log entries.
--    Add real columns, backfilled from the closest existing proxy for
--    pre-existing rows; going forward the app writes these explicitly.

alter table public.statuses add column is_closing boolean not null default false;

update public.statuses set is_closing = true
where lower(name) in (
  'closed',
  'unfounded',
  'referred to another department',
  'lacks resources to resolve',
  'request abandoned'
);

alter table public.cases add column status_changed_at timestamptz;
update public.cases set status_changed_at = coalesce(date_submitted, created_at);

alter table public.case_departments add column status_changed_at timestamptz;
update public.case_departments set status_changed_at = created_at;
