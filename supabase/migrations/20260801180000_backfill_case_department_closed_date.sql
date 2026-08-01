-- case_departments.closed_date has existed since the initial schema but nothing has ever
-- written to it -- the department performance dashboard needs it to measure each
-- department's own dwell time (closed_date - created_at) on a case, independent of the
-- master case's overall lifespan. Backfill already-closed rows using status_changed_at as
-- the best available proxy for when that closure happened, so historical data isn't blank
-- once the new stats ship. Going forward, the app sets this explicitly on close/reopen.
update public.case_departments cd
set closed_date = cd.status_changed_at
from public.statuses s
where s.id = cd.status_id
  and s.is_closing
  and cd.closed_date is null;
