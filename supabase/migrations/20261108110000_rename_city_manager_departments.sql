-- Rename the two City Manager departments so the names say who they are:
--   "City Manager"          (id 10, the cityhall@ / cmoffice@ admins)  -> "City Manager's Office"
--   "City Manager (Direct)" (id 12, citymgr@, manual assignment only)  -> "City Manager"
--
-- Everything that points at a department does so by id (case_departments, issue types'
-- default_department_id), so existing cases follow their department automatically; the 126
-- cases already assigned to the Office now simply read "City Manager's Office". Free-text audit
-- log entries written earlier still say "City Manager" and are left as history.
-- Wrapped in a guard so re-running it can never rename the wrong row.

do $$
begin
  if not exists (select 1 from public.departments where name = 'City Manager''s Office') then
    update public.departments set name = 'City Manager''s Office' where name = 'City Manager';
    update public.departments set name = 'City Manager'           where name = 'City Manager (Direct)';
  end if;
end $$;

-- is_jlc_user() matched the old Office name; it must follow the rename or the Office's
-- department users would lose access to the JLC Facility Repairs tab. (Admins are unaffected.)
create or replace function public.is_jlc_user()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid()
      and (
        up.role = 'admin'
        or (
          up.role = 'department'
          and up.department_id in (
            select d.id from public.departments d where d.name in ('MSD', 'City Manager''s Office')
          )
        )
      )
  );
$$;
