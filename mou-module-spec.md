# MOU Module — Build Spec

## Purpose

Replace the City's manual MOU (Memorandum of Understanding) drafting/negotiation process
with a tracked, structured workflow: an organization fills in a locked master template,
the City reviews and negotiates through the system (not email back-and-forth), and the
process ends in a finalized agreement ready to present to City Council — with every
edit along the way explicitly logged.

This is a new module inside the existing Franklin system
(React/Vite/Supabase/Vercel), reusing existing patterns: admin auth (separate logins per
admin, same as today), Brevo for email, and the submission-number + PIN pattern already
used elsewhere for non-logged-in external parties.

---

## 1. The master template

- The City Attorney has already approved a master MOU template. It consists of an
  ordered list of **sections**.
- Each section has:
  - **Locked text** — standard language that does not change, ever, except by admin edit
    (see below)
  - **Fillable fields** — placeholders the submitting organization fills in (could be
    short text, long text, dates, numbers — flexible field types per section)
  - **An optional "suggest a change to this section" comment box** — free text, always
    available per section, where the org can explain a requested deviation from the
    locked text *without editing it directly*. The org never edits locked text under any
    circumstance.
- **Only an admin (Brenda or Mitch) can edit the master template's locked text.** This
  should be a clearly separate, deliberate admin action — not something that happens as
  a side effect of reviewing a submission — since it changes the template every future
  MOU will be built from.
- **Template versioning:** each edit to the master template creates a new version.
  A submission in progress stays tied to the template version it was started with, so
  editing the master template doesn't retroactively change an MOU that's already
  underway.

## 2. Submission (organization side)

- An organization visits the MOU page and starts a new MOU proposal.
- They fill in the fillable fields for each section, optionally leave a "suggest a
  change" comment on any section, and attach required supporting documentation.
- On submission, they provide an **email address** and receive a **submission number +
  PIN**. This is their only credential — no account/login. The PIN lets them:
  - Check status at any time
  - Directly edit their own fillable-field values (not the locked text) if the
    submission is sent back to them for clarification
  - Receive email notifications as the submission moves through review
- Once submitted, **Brenda is notified** that a new MOU proposal is ready for review.

## 3. Review workflow

The submission moves through stages, and the flow can loop backward, not just forward:

1. **Submitted** → Brenda is notified
2. **Under review (Brenda)** — Brenda can:
   - Add comments/questions on any section
   - Send it back to the org for clarification (org gets notified, can edit their
     fields with their PIN, resubmits)
   - Once satisfied everything's complete, push it forward to the City Manager
3. **Under review (City Manager)** — Mitch has the same capabilities Brenda has:
   - Comment, ask questions
   - Send back to Brenda, or send back to the org directly
   - Approve and move it toward finalization
4. **Finalized text confirmed** — once both admin reviewers are satisfied, the final
   agreement text is locked for export
5. **Exported** — a PDF of the final agreement is generated (see Section 6)
6. **Scheduled for Council** — a council meeting date is attached to the submission
7. **Council decision** — recorded as one of: **Approved**, **Disapproved**, or **Sent
   back for edits** (with a decision date)
   - If "sent back for edits," the submission **reopens** for another round of
     review/editing rather than starting over — it should return to an appropriate
     review stage (likely back to Brenda or the City Manager, not all the way back to
     the org, unless the requested edits require org input)

Both **Brenda and Mitch** need their own separate logins for this (same pattern as
existing admin/department accounts) so every action is individually attributable — not
a shared "admin" identity.

## 4. Status visibility (progress bar)

- Both the **admin side** (Brenda/Mitch's view) and the **org side** (via submission
  number + PIN lookup) should show the same underlying workflow stage, presented as a
  simple progress indicator — e.g. Submitted → City Review → City Manager Review →
  Finalized → Scheduled for Council → Council Decision.
- Loops (sent back for clarification, sent back for edits) should be visible in the
  status view, not hidden — the org and admin should both be able to tell "this was sent
  back and is now back in review," not just see a static forward-only bar.

## 5. Activity log

This needs to be **explicit and granular** — every action gets its own logged entry,
recording:
- **What changed** (which field, comment, or status transition)
- **Who made the change** (org via their submission, Brenda, Mitch, or City Council
  decision)
- **When** (timestamp)
- **Old value → new value**, where applicable (e.g. a fillable field edit, a status
  change)

This should read as a full, unambiguous audit trail of the entire negotiation — useful
both for the City's own records and as backup if a question ever comes up about what was
agreed to and when. Suggest a single `mou_activity_log` table capturing all of the above,
tied to the submission.

## 6. Export

- Once finalized, generate a **PDF of the actual agreement** — the locked template text
  plus the organization's final fillable-field values, formatted as a real agreement
  document (not a form export).
- This PDF is explicitly **not the final legal state of the agreement** — it's what gets
  presented to City Council. The workflow continues past export into the Council
  scheduling/decision stage (Section 3, steps 6–7).

## 7. Data model sketch

**`mou_templates`** — id, version_number, is_current, created_by, created_at

**`mou_template_sections`** — id, template_id, section_order, title, locked_text,
field_definitions (structured — label/type/required per fillable field in this section)

**`mou_submissions`** — id, template_id (version this submission is tied to), org_name,
org_email, submission_number, pin_hash, status, current_stage, council_date,
council_decision, council_decision_date, created_at, finalized_at, exported_at

**`mou_submission_field_values`** — id, submission_id, template_section_id, field_key,
value

**`mou_submission_section_comments`** — id, submission_id, template_section_id,
comment_text, submitted_by (org), created_at — the "suggest a change" comments

**`mou_review_comments`** — id, submission_id, template_section_id (nullable — some
comments may be general, not section-specific), author (Brenda/Mitch), comment_text,
created_at

**`mou_supporting_documents`** — id, submission_id, file_ref, label, uploaded_at

**`mou_activity_log`** — id, submission_id, actor_type (org/admin/council/system),
actor_name, action_type, field_or_section, old_value, new_value, notes, created_at

## 8. Notifications (Brevo)

- Org submits → Brenda notified
- Brenda sends back to org → org notified (email on file)
- Brenda pushes to City Manager → Mitch notified
- Mitch sends back to Brenda → Brenda notified
- Mitch sends back to org → org notified
- Submission finalized/exported → both Brenda and Mitch notified
- Council decision recorded → Brenda and Mitch notified (and org, if "sent back for
  edits" reopens the submission)

## 9. Open items to confirm before/while building

- Field types needed for fillable sections (short text, long text, date, number,
  currency?) — confirm the actual master template's fields to know what to support.
- Whether the City Manager's review stage can also send a submission **directly back to
  the org**, bypassing Brenda, or must always route back through her first.
- File type/size limits for supporting documentation uploads.
- Whether council scheduling is entered manually by an admin, or eventually pulled from
  the meeting-records module being planned separately (not in scope for this build).
