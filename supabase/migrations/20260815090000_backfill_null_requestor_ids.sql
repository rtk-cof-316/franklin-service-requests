-- Backfill requestor_id for cases where it was never assigned. Root cause: RLS has always
-- blocked the anon role from inserting into requestor_registry and from updating
-- cases.requestor_id, so the public submission form's direct client-side write silently
-- no-op'd for ~80% of submissions since launch (it only ever "worked" when a repeat
-- requestor's name happened to already exist in the registry from the original historical
-- import). Fixed going forward by moving assignment into the assign_requestor_id edge
-- function (service role key, bypasses RLS) -- this migration is the one-time catch-up for
-- everything that already went in null.
--
-- Same matching rule the live code has always used: case-insensitive exact name match
-- against requestor_registry, reusing an existing ID or minting the next sequential one.
-- Processed oldest-first so repeat names within this same backfill consolidate onto a
-- single new ID rather than each getting their own.

do $$
declare
  case_row record;
  matched_rid text;
  next_num int;
  new_rid text;
begin
  for case_row in
    select id, submitter_name
    from public.cases
    where requestor_id is null
      and submitter_name is not null
      and trim(submitter_name) <> ''
    order by date_submitted asc
  loop
    select requestor_id into matched_rid
    from public.requestor_registry
    where lower(requestor_name) = lower(trim(case_row.submitter_name))
    limit 1;

    if matched_rid is not null then
      update public.cases set requestor_id = matched_rid where id = case_row.id;
    else
      select coalesce(max(cast(substring(requestor_id from 4) as int)), 0) + 1
        into next_num
      from public.requestor_registry;
      new_rid := 'RID' || lpad(next_num::text, 4, '0');

      insert into public.requestor_registry (requestor_name, requestor_id)
      values (trim(case_row.submitter_name), new_rid);

      update public.cases set requestor_id = new_rid where id = case_row.id;
    end if;
  end loop;

  -- Cases with no submitter name at all get the same shared anonymous placeholder the
  -- live submission flow already assigns for blank names.
  update public.cases
  set requestor_id = 'RID0050'
  where requestor_id is null
    and (submitter_name is null or trim(submitter_name) = '');
end $$;
