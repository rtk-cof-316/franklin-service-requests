# Department Dashboard — Analytics, Transparency & Accountability Spec

## Purpose

Evolve the department dashboard from a task list into a performance mirror. Departments
should be able to see, at a glance, how much work they're handling, how quickly they
resolve it, how transparent they are with the public, and how they compare to the
citywide average — without singling out or ranking against other specific departments.

This is an enhancement to the existing Franklin Service Request System
(React/Vite/Supabase/Vercel). Keep the current dashboard elements (cases received YTD,
open case count, due-within-10-days list) — this spec adds a new analytics section
alongside them.

---

## 1. Time window

All stats below are **year-to-date**, resetting each January 1. No rolling-window
toggle needed for v1.

## 2. Metrics to add

### Volume
- **Cases received YTD** (already exists — keep as is)
- **Share of citywide volume**: this department's case count ÷ total citywide case
  count YTD, shown as a percentage (e.g. "14% of all cases received by the City this
  year")

### Resolution time
Avoid clinical/cold framing like "fastest/slowest" — frame it professionally:
- **Typical resolution time** — median days from case creation to closure (median, not
  mean, so a few outlier cases don't distort the number)
- **Fastest resolution** — minimum days to close, YTD
- **Longest resolution** — maximum days to close, YTD
- **Department vs. citywide median** — shown side by side (e.g. "Your median: 6 days ·
  Citywide median: 9 days")

Only calculate against **closed** cases — open cases don't have a resolution time yet.

### Public transparency
- **Public comment rate**: percentage of the department's cases that have at least one
  comment marked visible to the public, YTD
- Compare against citywide average public comment rate, side by side, same treatment as
  resolution time

### Status breakdown
- Simple breakdown of the department's YTD cases by current status (e.g. New, In
  Progress, Closed, Reassigned) — a small bar or donut is fine, doesn't need to be
  elaborate
- This gives a department (and Brenda, if she views it) a quick read on whether cases
  are piling up in one status

## 3. Comparison design

- Show **department vs. citywide average**, not department vs. other named departments.
  No leaderboard, no ranking list — the goal is accountability against a fair baseline,
  not public shaming or inter-department competition.
- Citywide average should be calculated **excluding** the viewing department itself is
  not necessary — a straightforward citywide average across all departments is fine and
  simpler to compute.

## 4. Resource-need signal

If a department's YTD case volume is meaningfully above the citywide average (suggest a
threshold like 25%+ above average, but this can be tuned) **and** their resolution time
is also worse than citywide average, surface a subtle note on their dashboard — not an
alarm, just a factual observation — along the lines of:

> "Your department is handling a higher-than-average caseload with longer-than-average
> resolution times. This may reflect a need for additional resources."

This should read as a neutral, data-driven observation available to the department
themselves (and to Brenda/Mitch if they view it), not a punitive flag. The inverse case —
high volume but still resolving quickly — should not trigger any note; that's a
department handling its load well.

## 5. Layout suggestion

- Keep existing "cases received YTD / open cases / due within 10 days" section at the
  top, unchanged.
- Add a new section below it, e.g. "Department Performance," containing:
  - Volume + share-of-citywide stat
  - Resolution time comparison (typical / fastest / longest, dept vs. citywide)
  - Public comment rate comparison
  - Status breakdown chart
  - Resource-need note, only if triggered
- Keep it scannable — stat cards or a simple grid, not a dense report. Departments
  should be able to read their standing in under 10 seconds.

## 6. Data notes

- All calculations query existing `cases`/comments/activity tables already in the
  system — no new tables needed, this is a computed view over existing data.
- Median/percentile calculations: confirm Postgres or Supabase can compute median
  directly (e.g. `percentile_cont(0.5)`), or compute in application code if simpler
  given current data volume.
- Consider caching/precomputing these stats (e.g. refresh once daily) rather than
  computing live on every dashboard load, if case volume grows enough that live
  aggregation becomes slow. Not a concern at current scale, but worth a comment in the
  code for future reference.

## 7. Explicitly out of scope for this pass

- No ranking or leaderboard between named departments.
- No historical trend charts (e.g. month-over-month) — YTD snapshot only for v1.
- No changes to how cases are created, routed, or closed — this is a read-only
  analytics layer.
