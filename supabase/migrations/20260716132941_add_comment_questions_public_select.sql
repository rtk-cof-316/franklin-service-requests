-- Public Comment Module: allow the public to read specific questions tied to
-- approved comments, so the topic analysis page can show a "Questions" section.
-- (Previously comment_questions had no public select policy — admin-only via
-- the moderation queue. This adds a second, additive permissive policy scoped
-- to approved comments, mirroring comment_concern_themes' existing pattern.)

create policy comment_questions_public_select on public.comment_questions
  for select to anon, authenticated
  using (
    public.is_public_input_admin()
    or exists (
      select 1 from public.comments c
      where c.id = comment_questions.comment_id
        and c.status = 'approved'
    )
  );
