-- Splits "Assessing" work out of the PZA department bucket into its own department,
-- renames PZA to PZ, and relabels/adds issue types.
--
-- Real-data investigation before this migration found department id 3 ("PZA") already
-- had three user_profiles under it: dchunn@franklinnh.gov, pzadmin@franklinnh.gov, and
-- assessingdept@franklinnh.gov — the latter is Assessing work that had nowhere else to go
-- before this migration. Moving that one profile to a new Assessing department leaves
-- PZA/PZ with exactly the two people it's supposed to have, with no removals needed.

update public.departments set name = 'PZ' where name = 'PZA';

insert into public.departments (name) values ('Assessing');

update public.user_profiles
set department_id = (select id from public.departments where name = 'Assessing')
where user_id = (select id from auth.users where email = 'assessingdept@franklinnh.gov');

update public.issue_types
set name = 'Zoning /Land Use Violation'
where name = 'Zoning / Land Use';

insert into public.issue_types (name, default_department_id)
values ('Property Assessment / Valuation', (select id from public.departments where name = 'Assessing'));
