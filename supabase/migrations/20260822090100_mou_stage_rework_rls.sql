-- MOU Module Rework: RLS for mou_submission_section_text.
--
-- Admin-only, no anon policy — mirrors mou_review_comments exactly. The org never writes
-- to this table directly; it only ever sees the resolved text indirectly, through
-- mou-org-action's service-role-key lookup response (which bypasses RLS entirely, same as
-- every other org-facing read in this module).
alter table public.mou_submission_section_text enable row level security;

create policy mou_submission_section_text_admin_all on public.mou_submission_section_text
  for all to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());
