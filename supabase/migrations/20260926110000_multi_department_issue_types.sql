-- Lets an issue type auto-route to more than one department. Until now every issue type
-- routed to exactly one department via issue_types.default_department_id (a single FK,
-- used only by SubmitForm.jsx's auto-assign-on-submit logic). Brenda wants "Property
-- Assessment / Valuation" to also reach Fire/Code, so this adds a plain array of EXTRA
-- department ids alongside the existing single FK, rather than a full many-to-many junction
-- table — same "plain array is the right level of complexity" call made for the CAR
-- module's meeting_cycles.standard_sections, since there's no per-row data to carry beyond
-- "also route here." default_department_id stays the primary/first department; the array
-- holds any additional ones.
alter table public.issue_types add column additional_department_ids integer[] not null default '{}';

update public.issue_types
set additional_department_ids = array[(select id from public.departments where name = 'Fire/Code')]
where name = 'Property Assessment / Valuation';
