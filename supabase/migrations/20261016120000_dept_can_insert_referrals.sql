-- Let department users refer a case to another department.
--
-- case_departments only had SELECT/UPDATE policies for department users, so the INSERT that
-- referCaseToDepartment() makes when a department (not admin) refers a case was silently
-- rejected by RLS. The app still logged "Referred from X to Y" and emailed Y, then auto-closed
-- the case because the referring department's own row was the only one left and it was in a
-- closing status — so Y got an email for a case that never showed up on their dashboard.
--
-- Scope: a department user may add a row for a *different* department, only on a case their
-- own department is already assigned to.

create or replace function public.my_department_is_on_case(p_case_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from case_departments
    where case_id = p_case_id and department_id = get_my_department_id()
  )
$$;

revoke all on function public.my_department_is_on_case(bigint) from public, anon;
grant execute on function public.my_department_is_on_case(bigint) to authenticated, service_role;

create policy "dept can refer their cases"
  on public.case_departments
  for insert
  to authenticated
  with check (
    get_my_role() = 'department'
    and department_id <> get_my_department_id()
    and public.my_department_is_on_case(case_id)
  );
