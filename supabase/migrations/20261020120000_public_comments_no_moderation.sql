-- Public Comment: remove moderation. A submitted comment is published immediately.
--
-- Previously anon could only insert comments as status = 'pending' (so nobody could
-- self-approve) and an admin approved or rejected each one. Now the only status the public
-- may insert is 'approved', and only while the topic's comment window is open (that
-- server-side cutoff is unchanged). anon still cannot insert 'pending' or 'rejected'.
--
-- The comment_status enum and comments.status column are intentionally kept: setting a
-- row to 'rejected' (admin UPDATE, or SQL) still hides it everywhere the public reads from,
-- which is the only way to take down a comment after the fact now that there is no queue.

drop policy comments_public_insert on public.comments;

create policy comments_public_insert on public.comments
  for insert to anon, authenticated
  with check (
    status = 'approved'
    and exists (
      select 1 from public.topics t
      where t.id = topic_id
        and t.status = 'active'
        and now() between t.comment_opens_at and t.comment_closes_at
    )
  );

alter table public.comments alter column status set default 'approved';
