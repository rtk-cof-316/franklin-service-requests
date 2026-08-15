-- CAR / Agenda / Packet Module: RLS policies + storage bucket
--
-- Deliberately different from is_mou_admin()/is_public_input_admin(), which check
-- user_profiles.role = 'admin' — any admin login passes those. This module's access rule
-- is stricter: reachable by no login except these two specific people, so the check reads
-- the JWT email directly rather than going through user_profiles at all.

create or replace function public.is_car_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.email(), '') in ('bdemers@franklinnh.gov', 'citymgr@franklinnh.gov');
$$;

alter table public.meeting_cycles enable row level security;
alter table public.work_sessions enable row level security;
alter table public.car_submissions enable row level security;
alter table public.car_attachments enable row level security;
alter table public.car_reassignment_history enable row level security;
alter table public.car_activity_log enable row level security;

-- meeting_cycles / work_sessions: admin-only, no anon policy at all. The public intake
-- flow never queries these directly — car-submit (service role key) resolves the
-- currently-open cycle server-side, same reasoning as mou-submit resolving the current
-- template server-side.
create policy meeting_cycles_admin_all on public.meeting_cycles
  for all to authenticated using (public.is_car_admin()) with check (public.is_car_admin());
create policy work_sessions_admin_all on public.work_sessions
  for all to authenticated using (public.is_car_admin()) with check (public.is_car_admin());

-- car_submissions: no anon policy — every submitter-side read/write goes through
-- car-submit / car-org-action (service role key), exactly like mou_submissions. Admin
-- reads/writes directly, gated to the two-email allowlist.
create policy car_submissions_admin_all on public.car_submissions
  for all to authenticated using (public.is_car_admin()) with check (public.is_car_admin());

-- car_attachments: mirrors mou_supporting_documents/case_files — anon inserts and selects
-- directly during upload/status-check (submission ids are non-enumerable UUIDs, same
-- accepted tradeoff already made for those tables).
create policy car_attachments_public_insert on public.car_attachments
  for insert to anon, authenticated with check (true);
create policy car_attachments_select on public.car_attachments
  for select to anon, authenticated using (true);
create policy car_attachments_admin_update on public.car_attachments
  for update to authenticated using (public.is_car_admin()) with check (public.is_car_admin());
create policy car_attachments_admin_delete on public.car_attachments
  for delete to authenticated using (public.is_car_admin());

-- car_reassignment_history / car_activity_log: admin-only direct read/write (admin
-- actions write these directly from the client, same as mou_review_comments); Edge
-- Functions write submitter-side/system activity entries using the service role key.
create policy car_reassignment_history_admin_all on public.car_reassignment_history
  for all to authenticated using (public.is_car_admin()) with check (public.is_car_admin());
create policy car_activity_log_admin_all on public.car_activity_log
  for all to authenticated using (public.is_car_admin()) with check (public.is_car_admin());

insert into storage.buckets (id, name, public)
values ('car-attachments', 'car-attachments', true)
on conflict (id) do nothing;

create policy car_attachments_bucket_public_insert on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'car-attachments');
create policy car_attachments_bucket_public_select on storage.objects
  for select to anon, authenticated using (bucket_id = 'car-attachments');
create policy car_attachments_bucket_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'car-attachments' and public.is_car_admin());
