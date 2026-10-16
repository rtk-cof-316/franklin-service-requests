-- Log in the activity log when a case is created already flagged as 91-A.
--
-- The public form sets cases.is_91a straight from its "Right-to-Know request" checkbox, but
-- nothing recorded that in case_audit_log (the anon role can't write there), so a case submitted
-- with the box ticked looked like it had become 91-A on its own (e.g. 376-26). Converting an
-- existing case from the admin screen already logs "Case converted to 91-A Right-to-Know
-- request"; this covers the at-creation path, whatever inserted the row.

create or replace function public.log_91a_at_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into case_audit_log (case_id, action, performed_by, created_at)
  values (new.id, 'Submitted as a Right-to-Know (91-A) request', 'System (submission)', now());
  return new;
end;
$$;

revoke all on function public.log_91a_at_submission() from public, anon, authenticated;

create trigger log_91a_at_submission
  after insert on public.cases
  for each row
  when (new.is_91a)
  execute function public.log_91a_at_submission();
