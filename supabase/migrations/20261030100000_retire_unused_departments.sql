-- Retire departments that don't use the system (no real logins, never see their assignments).
--
-- They are marked inactive rather than deleted: case_departments, audit-log entries, and
-- reports all reference them by id, and past cases must keep showing who handled them.
-- The app hides inactive departments from every place a case can be assigned or referred
-- (Refer To Department, Add Department, the department-dashboard picker) and shows staff a
-- notice explaining how to hand a case to one of them by email instead.
--
-- To bring one back: update public.departments set is_active = true where name = '...';

alter table public.departments add column is_active boolean not null default true;

update public.departments
set is_active = false
where name in ('Legal', 'Police/Prosecutor', 'Parks & Rec', 'IT', 'Finance', 'Human Resources');

-- "Website / Communications" was the only issue type routed to one of these (IT). New cases
-- of that type now go to the City Manager's Office, which already received IT's notifications.
update public.issue_types
set default_department_id = (select id from public.departments where name = 'City Manager')
where default_department_id = (select id from public.departments where name = 'IT');
