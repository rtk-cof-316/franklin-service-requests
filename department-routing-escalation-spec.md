# Department Auto-Routing & Escalation — Build Spec

## Purpose

Shift Brenda from **facilitator** (manually triaging every incoming case) to **system
admin** (only notified on exceptions). Departments take ownership of their own cases
directly; the system handles reminders and escalation automatically.

This is an enhancement to the existing Franklin Service Request System
(React/Vite/Supabase/Vercel/Brevo). Departments already have logins and dashboards —
no new department-facing auth work needed.

---

## 1. Auto-routing at submission

- Each case has an **issue type**, selected by the submitter at intake.
- Add a mapping: `issue_type → department`. Suggest a `routing_rules` table
  (`issue_type`, `department_id`) so this is admin-editable later without a code change,
  rather than hardcoded in logic.
- On submission, the case is auto-assigned to the mapped department. **No admin triage
  step.**
- **Exception:** if the submitter selects **"Other"** as the issue type, the case is
  NOT auto-routed — it goes to a holding/unassigned state, and Brenda is notified
  directly (see Section 3) to route it manually, since there's no department mapping for
  an undefined issue type.

## 2. Department actions on an assigned case

Departments can, from their existing dashboard:
- **Work the case** (update status, add comments/notes — this is "activity")
- **Reassign** to a different specific department (not back to a holding queue — must
  pick a department)
- **Close** the case

Reassignment should log who reassigned it and when, same as existing activity logging
already in the system.

## 3. When Brenda gets notified (exceptions only)

Brenda receives a notification **only** when:
1. A submitter selects **"Other"** as their issue type (case has no valid auto-route
   target), or
2. A case is **assigned or reassigned to the City Manager's Office** department (this
   already exists as a selectable department — no new routing target needed).
3. A case hits the **2-week escalation threshold** (see Section 5) — she's CC'd on the
   escalation email sent to the City Manager's Office.

She should **not** be notified on routine assignment, routine reassignment between
other departments, or routine closure.

## 4. 3-day silence reminders (per department)

- Clock starts when a case is assigned (or reassigned) to a department.
- **"Initial response"** = any status change on the case (e.g. New → In Progress).
  A comment alone does not reset the clock — it must be a status change.
- If 3 days pass with no status change, send that department a reminder email listing
  the case(s) awaiting initial response.
- If still no status change, repeat the reminder **every 3 days** for as long as the
  case sits with no status change.
- This is per-case, not a single digest necessarily — group multiple aging cases for the
  same department into one email if it's cleaner, but each case's own 3-day clock is
  independent.

## 5. 2-week escalation threshold

Trigger condition (either one, checked per case):
- **No initial response** (no status change at all) within 2 weeks of assignment, OR
- Case has **not been closed** within 2 weeks of assignment (regardless of whether
  there's been activity — a case can have status changes/comments and still hit this if
  it's still open at 2 weeks).

When triggered:
1. Send the assigned department a warning-toned notification: this case will be
   escalated to the City Manager's Office.
2. Send a **separate email directly to the City Manager's Office** with the case
   details and the reason for escalation (no initial response / not closed within 2
   weeks).
3. **CC Brenda** on that City Manager's Office escalation email.
4. The case's department assignment does **not** change automatically — this is an
   informational escalation, not a system reassignment. The department keeps the case
   and can still act on it.

**Open question to confirm with Brenda before/while building:** after the 2-week
escalation fires, do the 3-day reminders to the department keep repeating on the same
cadence, or does something change (e.g. reminders stop since the CM's office is now
aware, or they escalate in tone/frequency)? Suggest defaulting to "reminders continue on
the same 3-day cadence" unless Brenda says otherwise, since the case is still technically
the department's to resolve.

## 6. Implementation notes

- This requires a **scheduled/cron job** (not just event-triggered logic), since silence
  is a passive condition — nothing happens to trigger a check. Options in this stack:
  - Vercel Cron Jobs calling a serverless function daily, or
  - Supabase `pg_cron` + a Postgres function/edge function
  - Recommend running once daily (e.g. early morning) rather than more frequently —
    this doesn't need real-time precision.
- The daily job should, for every case with `status != closed`:
  - Check time since last status change vs. 3-day reminder cadence → send reminder if
    due
  - Check time since assignment vs. 2-week threshold → fire escalation if due and not
    already fired for this case (track an `escalated_at` timestamp on the case so it
    doesn't re-fire daily once triggered)
- Reuse the existing Brevo integration for all these emails — no new email service
  needed.
- Existing activity log should capture: auto-assignment, reassignment, status changes,
  reminder sent, escalation fired — so there's a full audit trail per case without
  Brenda needing to track it manually.

## 7. Explicitly not changing

- Departments already have dashboards/logins — this doesn't change their access, only
  what routes to them and when they hear from the system.
- Public-facing submission form is unaffected — issue type selection already exists;
  this just changes what happens to the case after submission.
- No change to the Public Comment module — this spec is scoped to the core Service
  Request workflow only.
