-- Public Comment Module: RLS policies

-- Helper: is the current authenticated user the admin?
create or replace function public.is_public_input_admin()
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

alter table public.topics enable row level security;
alter table public.topic_positions enable row level security;
alter table public.concern_themes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_questions enable row level security;
alter table public.comment_concern_themes enable row level security;

-- topics: public can read every topic (active AND closed — archive page needs closed ones too)
create policy topics_public_select on public.topics
  for select to anon, authenticated
  using (true);
create policy topics_admin_write on public.topics
  for all to authenticated
  using (public.is_public_input_admin())
  with check (public.is_public_input_admin());

-- topic_positions: public read, admin write
create policy topic_positions_public_select on public.topic_positions
  for select to anon, authenticated
  using (true);
create policy topic_positions_admin_write on public.topic_positions
  for all to authenticated
  using (public.is_public_input_admin())
  with check (public.is_public_input_admin());

-- concern_themes: public read (needed to render the submit-form checkboxes), admin write
create policy concern_themes_public_select on public.concern_themes
  for select to anon, authenticated
  using (true);
create policy concern_themes_admin_write on public.concern_themes
  for all to authenticated
  using (public.is_public_input_admin())
  with check (public.is_public_input_admin());

-- comments: anon can insert only as status='pending' (can't self-approve) and only
-- while the parent topic's comment window is open (server-side enforcement of the
-- close-time cutoff, not just a hidden button in the UI). anon can only ever SELECT
-- approved comments; admin sees/updates everything, including after the window closes.
create policy comments_public_insert on public.comments
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.topics t
      where t.id = topic_id
        and t.status = 'active'
        and now() between t.comment_opens_at and t.comment_closes_at
    )
  );
create policy comments_public_select_approved on public.comments
  for select to anon, authenticated
  using (status = 'approved' or public.is_public_input_admin());
create policy comments_admin_update on public.comments
  for update to authenticated
  using (public.is_public_input_admin())
  with check (public.is_public_input_admin());

-- comment_questions: anon can insert (tied to the comment they just created);
-- NOT publicly readable — the public topic-detail page never displays per-comment
-- questions, only the admin moderation queue does.
create policy comment_questions_public_insert on public.comment_questions
  for insert to anon, authenticated
  with check (true);
create policy comment_questions_admin_select on public.comment_questions
  for select to authenticated
  using (public.is_public_input_admin());

-- comment_concern_themes: anon can insert; SELECT is needed publicly too, because
-- the topic-detail page's "concern themes ranked by frequency" sidebar is computed
-- client-side from this join table filtered to approved comments.
create policy comment_concern_themes_public_insert on public.comment_concern_themes
  for insert to anon, authenticated
  with check (true);
create policy comment_concern_themes_select on public.comment_concern_themes
  for select to anon, authenticated
  using (
    public.is_public_input_admin()
    or exists (
      select 1 from public.comments c
      where c.id = comment_concern_themes.comment_id
        and c.status = 'approved'
    )
  );
