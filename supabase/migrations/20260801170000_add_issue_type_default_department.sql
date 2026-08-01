-- Auto-routing: each issue type now maps to the department a new case should
-- be assigned to on submission, closing the gap where cases sat unassigned
-- until a staff member manually picked a department. Noise/Nuisance/Animal/Crime
-- is intentionally left unmapped (NULL) since that issue type is already blocked
-- from submission entirely and referred to the police non-emergency line instead.
alter table public.issue_types add column default_department_id integer references public.departments(id);

update public.issue_types it
set default_department_id = d.id
from public.departments d
where d.name = 'MSD'
  and it.name in (
    'Pothole', 'Crack / Pavement', 'Drainage', 'Heave', 'Signage / Traffic',
    'Trash / Sanitation', 'Plowing / Sanding', 'Public Property / Structure', 'Water / Utility'
  );

update public.issue_types it
set default_department_id = d.id
from public.departments d
where d.name = 'Fire/Code'
  and it.name = 'Code Violation';

update public.issue_types it
set default_department_id = d.id
from public.departments d
where d.name = 'IT'
  and it.name = 'Website / Communications';

update public.issue_types it
set default_department_id = d.id
from public.departments d
where d.name = 'City Manager'
  and it.name in ('Other', 'Right to Know Request');
