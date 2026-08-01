-- One-time reset before the daily reminder/escalation check goes live.
-- status_changed_at was backfilled from historical dates in an earlier migration,
-- which would otherwise cause the very first automated run to immediately fire a
-- large batch of 3-day reminders and 2-week escalations for old, already-open
-- cases regardless of whether departments have genuinely been quiet on them.
-- This resets the clock to "now" only for currently-open assignments, so the
-- silence/escalation window starts fresh from today rather than from backfilled
-- history. Closed assignments are untouched (their timestamp no longer matters).
update public.case_departments cd
set status_changed_at = now()
from public.statuses s
where s.id = cd.status_id
  and not s.is_closing;
