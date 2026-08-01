-- The previous backfill (20260801180000) used case_departments.status_changed_at as the
-- proxy for when a department closed its part of a case. That was wrong: historical
-- case_departments rows were never kept in sync with the case's real closure (many still
-- show a status_changed_at identical to created_at, or an open status, even for cases
-- that genuinely closed weeks or months later). The cases table's own closed_date is the
-- reliable field -- it shows real, distinct closure dates -- so re-derive
-- case_departments.closed_date from there for every row whose parent case is closed,
-- overwriting whatever the previous backfill set.
update public.case_departments cd
set closed_date = c.closed_date
from public.cases c
where c.id = cd.case_id
  and c.closed_date is not null;
