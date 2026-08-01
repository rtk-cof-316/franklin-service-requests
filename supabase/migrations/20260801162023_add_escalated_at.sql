-- Guards the 2-week escalation check from re-firing every day once triggered.
alter table public.case_departments add column escalated_at timestamptz;
