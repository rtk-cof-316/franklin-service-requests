-- "City Manager (Direct)": a department for cases that need the City Manager himself, as
-- distinct from the existing "City Manager" department, which is the City Manager's Office
-- (the cmoffice@ / cityhall@ admins).
--
-- It is NOT renamed from or merged with "City Manager": historical audit-log text and the
-- department-performance statistics match departments by name, so renaming would orphan history.
-- No issue type routes here; cases reach it only by being assigned or referred to it. Its
-- notification recipient (citymgr@) is set in supabase/functions/_shared/departmentRecipients.ts.

insert into public.departments (name, is_active)
select 'City Manager (Direct)', true
where not exists (select 1 from public.departments where name = 'City Manager (Direct)');
