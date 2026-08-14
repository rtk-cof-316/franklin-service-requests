-- MOU Module: RLS policies + storage bucket
--
-- Org-side access (submission creation, field edits, comments, resubmit) goes entirely
-- through the mou-submit / mou-org-action Edge Functions using SERVICE_ROLE_KEY, which
-- bypasses RLS — same pattern as auto_assign_department. No anon policies are granted on
-- mou_submissions, mou_submission_field_values, mou_submission_section_comments, or
-- mou_activity_log because of this. mou_supporting_documents and the storage bucket are
-- the one exception, mirroring the existing case-files/case_files pattern where the
-- public client uploads directly.

create or replace function public.is_mou_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.role = 'admin'
  );
$$;

alter table public.mou_templates enable row level security;
alter table public.mou_template_sections enable row level security;
alter table public.mou_submissions enable row level security;
alter table public.mou_submission_field_values enable row level security;
alter table public.mou_submission_section_comments enable row level security;
alter table public.mou_review_comments enable row level security;
alter table public.mou_supporting_documents enable row level security;
alter table public.mou_activity_log enable row level security;

-- mou_templates: public can read the current version (needed to render the submission
-- form); admin can read/write every version (template editor, versioning).
create policy mou_templates_public_select on public.mou_templates
  for select to anon, authenticated
  using (is_current or public.is_mou_admin());
create policy mou_templates_admin_write on public.mou_templates
  for all to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());

-- mou_template_sections: same shape — public reads sections of the current template,
-- admin reads/writes everything.
create policy mou_template_sections_public_select on public.mou_template_sections
  for select to anon, authenticated
  using (
    public.is_mou_admin()
    or exists (
      select 1 from public.mou_templates t
      where t.id = mou_template_sections.template_id and t.is_current
    )
  );
create policy mou_template_sections_admin_write on public.mou_template_sections
  for all to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());

-- mou_submissions: admin (Brenda/Mitch) reads and updates directly, same convention as
-- CaseDetail.jsx's direct .update() calls. No anon policy — org access is PIN-gated
-- through the mou-org-action Edge Function, which uses the service role key.
create policy mou_submissions_admin_all on public.mou_submissions
  for all to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());

-- mou_submission_field_values: admin can read (review UI); writes only ever happen via
-- the Edge Function (org fills/edits its own fields under PIN gating).
create policy mou_submission_field_values_admin_select on public.mou_submission_field_values
  for select to authenticated
  using (public.is_mou_admin());

-- mou_submission_section_comments: admin can read; org writes go through the Edge
-- Function only.
create policy mou_submission_section_comments_admin_select on public.mou_submission_section_comments
  for select to authenticated
  using (public.is_mou_admin());

-- mou_review_comments: admin-authored directly from the client (Brenda/Mitch commenting
-- while reviewing) — no Edge Function needed for this table. Org never reads this table
-- directly; curated (org_visible) comments are surfaced to the org through the
-- mou-org-action Edge Function's status-lookup response.
create policy mou_review_comments_admin_all on public.mou_review_comments
  for all to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());

-- mou_supporting_documents: mirrors the existing case_files pattern — anon can insert
-- (uploading during submission) and select (status page shows what's on file), admin
-- has full access.
create policy mou_supporting_documents_public_insert on public.mou_supporting_documents
  for insert to anon, authenticated
  with check (true);
create policy mou_supporting_documents_select on public.mou_supporting_documents
  for select to anon, authenticated
  using (true);
create policy mou_supporting_documents_admin_write on public.mou_supporting_documents
  for update to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());
create policy mou_supporting_documents_admin_delete on public.mou_supporting_documents
  for delete to authenticated
  using (public.is_mou_admin());

-- mou_activity_log: admin reads/writes directly for admin-side actions; the Edge
-- Functions write org-side/system entries using the service role key.
create policy mou_activity_log_admin_all on public.mou_activity_log
  for all to authenticated
  using (public.is_mou_admin())
  with check (public.is_mou_admin());

-- Storage bucket for supporting documents, mirroring the existing case-files bucket.
insert into storage.buckets (id, name, public)
values ('mou-documents', 'mou-documents', true)
on conflict (id) do nothing;

create policy mou_documents_public_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'mou-documents');
create policy mou_documents_public_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'mou-documents');
create policy mou_documents_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'mou-documents' and public.is_mou_admin());
