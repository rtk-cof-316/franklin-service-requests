# Architecture

Technical reference for maintaining this codebase. It documents the app as it actually exists (verified directly against the live Supabase schema and the current source code), not the original spec — several features described in older planning documents in this repo (`mou-module-spec.md`, `car-agenda-packet-module-spec.md`, `department-dashboard-analytics-spec.md`, `department-routing-escalation-spec.md`, `public-comment-module-spec.md`) have since changed shape. Where something is spec'd but not actually built, or built differently than spec'd, that's called out explicitly below rather than described as if it works.

## Contents

1. [High-level shape of the app](#1-high-level-shape-of-the-app)
2. [Database schema](#2-database-schema)
3. [Folder / file structure](#3-folder--file-structure)
4. [Case & department routing engine](#4-case--department-routing-engine)
5. [The "accountability system" (reminders, escalation, silence tracking)](#5-the-accountability-system-reminders-escalation-silence-tracking)
6. [RSA 91-A (Right-to-Know) workflow and tax-dollar calculation](#6-rsa-91-a-right-to-know-workflow-and-tax-dollar-calculation)
7. [Public Comment module](#7-public-comment-module)
8. [MOU module — retired](#8-mou-module-retired)
9. [CAR (Council Agenda Report) module — retired](#9-car-council-agenda-report-module-retired)
10. [Road Watch / Road Vote](#10-road-watch--road-vote)
11. [Email system](#11-email-system)
12. [Auth, roles, and access control](#12-auth-roles-and-access-control)
13. [Deployment pipeline](#13-deployment-pipeline)
14. [Tables that exist in this Supabase project but are NOT part of this app](#14-tables-that-exist-in-this-supabase-project-but-are-not-part-of-this-app)
15. [JLC Facility Repair Report module (internal-only)](#15-jlc-facility-repair-report-module-internal-only)

---

## 1. High-level shape of the app

This is a **single-page React app with no router library**. `src/App.jsx` holds one `page` string in state (seeded once from a `?page=` query param) and renders `{page === 'x' && <Component/>}` blocks — there is no React Router, no nested routes, and no browser back/forward support beyond whatever the query param gives you on first load. Screen-to-screen navigation happens by a parent calling a setter function passed down as a prop (e.g. `onViewCase(caseId)` sets `viewingCaseId` and flips `page` to `'case-detail'`).

There are five largely independent workflows sharing one codebase and one Supabase project:

| Module | Public entry point | Staff entry point |
|---|---|---|
| Core case tracking | Submit a Request / Check Status / Road Watch | My Cases (department) / Admin Dashboard (admin) |
| RSA 91-A | (a checkbox inside the core intake form) | The 91-A cards inside a case's detail page (admin only) |
| Public Comment | Public Comment | Public Comments (admin) |
| MOU *(retired 2026-09-29)* | ~~Submit an MOU / Check MOU Status~~ | ~~MOUs (admin)~~ |
| CAR *(retired 2026-09-26)* | ~~Submit a CAR / Check CAR Status~~ | ~~CARs (gated separately — see §12)~~ |
| JLC Facility Repairs *(internal, unlisted — §15)* | An unlisted employee-only form, `?page=jlc-report` (not linked anywhere) | JLC Facility Repairs (admin, MSD, City Manager) |

All of these talk to the same Supabase Postgres database via the same anon key from the browser, with row-level security (RLS) policies doing the real access control, plus a handful of Supabase Edge Functions that run with the service-role key for anything that needs to bypass RLS (cross-department reads, PIN hashing, sending email).

## 2. Database schema

All schema below was read directly from the live Supabase project (`sdibtkmmcegthmytmzvy`), not from migration files — several of the oldest tables (`cases`, `case_departments`, `departments`, `issue_types`, `statuses`, `user_profiles`, and others) were created directly in the Supabase dashboard before this project tracked schema changes as files, so there is no `CREATE TABLE` migration for them at all. Anything from `supabase/migrations/` onward (files dated 2026-07-16 forward) *is* tracked.

### 2.1 Core case-tracking tables

| Table | Key columns | Notes |
|---|---|---|
| `cases` | `case_number`, `location`, `description`, `issue_type_id`, `date_submitted`, `closed_date`, `status_changed_at`, `is_91a`, `followup_due_date`, `requestor_id`, `policy_acknowledged`, `archive_network_folder`, `archive_initial_export`, `archive_closed_export` | One row per resident request. `archive_*` are plain booleans an admin toggles manually to track offline paperwork/export steps — nothing in the app sets them automatically. `followup_due_date` is a generic "don't expect movement before this date" field used by any department (not just Fire/Code, though that's the main user of it) — see §5. |
| `case_departments` | `case_id`, `department_id`, `status_id`, `status_changed_at`, `escalated_at`, `created_at` | One row per (case, department) pairing — a case can have more than one row here (multi-department routing, or a referral chain). This is the row that "the accountability system" and almost every dashboard filter actually scopes to, **not** the parent `cases` row. `escalated_at` is set once by the daily silence check and is **never cleared** — see §5 for why that matters. |
| `departments` | `id`, `name` | Currently 11 rows: MSD, Fire/Code, PZ, Assessing, Police/Prosecutor, Finance, Human Resources, Legal, Parks & Rec, IT, City Manager. This list is admin-tuned (department names have changed at least twice — PZA→PZ, and Assessing was split out of PZA in September 2026) — verify against the live table before assuming a name in old code/docs still matches. |
| `issue_types` | `id`, `name`, `default_department_id`, `additional_department_ids` | The categories a resident picks at intake. `default_department_id` is the original single-FK routing target; `additional_department_ids integer[] not null default '{}'` (added 2026-09-26) lets an issue type ALSO route to one or more extra departments — currently only "Property Assessment / Valuation" uses it (routes to Assessing + Fire/Code). See §4. |
| `statuses` | `id`, `name`, `is_closing`, `is_91a_only` | Shared status vocabulary for both the master `cases.status_id` and each `case_departments.status_id`. `is_closing` marks a status as "done" for whatever row it's on. `is_91a_only` hides a status from department dropdowns and non-91A cases — currently: Gathering Records, Reviewing Records, Clarification Needed, Records Ready - Please Schedule Pick Up, Request Abandoned. |
| `case_audit_log` | `case_id`, `action`, `performed_by`, `created_at` | Plain-English, append-only history ("Assigned to MSD," "MSD status changed from "Received" to "In Progress""). This is the most reliable timestamp source in the whole app — several reporting features reconstruct timing from here rather than trusting `case_departments`/`cases` timestamp columns directly, because pre-launch bulk-imported data has unreliable timestamps on those columns (see §5 and [MAINTENANCE.md](MAINTENANCE.md)). **The exact wording of these strings is a real coupling point** — `PrintEscalatedCasesReport.jsx` and `departmentPerformance.js` both parse this text with regexes (see §5), so changing how `CaseDetail.jsx` phrases a status-change log entry will silently break those features. |
| `case_comments` | `case_id`, `department_id` (nullable), `comment`, `created_by`, `created_at` | Public-facing updates residents can see. `department_id` is `NULL` by design whenever an admin/City-Manager posts (no department context) — this is intentional, not a data-quality bug. |
| `internal_notes` | `case_id`, `note`, `created_by`, `created_at` | Staff-only, never shown to residents. |
| `case_files` | `case_id`, filename/size metadata | Metadata only; actual bytes live in the Supabase Storage bucket `case-files`. |
| `case_time_log` | `case_id`, `minutes`, `initials`, `hourly_rate`, `cost`, `logged_by`, `created_at` | RSA 91-A time tracking — see §6. |
| `details_91a` | `case_id`, `acknowledged_date`, `request_topic`, `number_of_records`, `hours_worked`, `hours_worked_closed`, `fees_assessed`, `fees_collected`, `date_records_ready`, `date_requestor_notified`, `appointment_datetime`, `delivery_method`, `mailed`, `tracking_number`, `hold_for_pickup`, `public_records_url`, `tax_dollar_spent`, `followup_due_date` | Extra fields specific to Right-to-Know requests, created only when `cases.is_91a = true`. **`details_91a.followup_due_date` is dead** — it exists in the schema but no code anywhere reads or writes it; the real follow-up date used everywhere is `cases.followup_due_date`. Don't assume this column does anything. |
| `request_topics` | `id`, `name` | Simple lookup list used by the RSA 91-A "Request Topic" field. |
| `requestor_registry` | name-matching fields | Groups submissions from the same resident by name so repeat requesters get a consistent identity across cases (used by the public transparency dashboard to anonymize/count repeat requestors). |

### 2.2 Staff accounts

| Table | Key columns | Notes |
|---|---|---|
| `user_profiles` | `user_id` (→ `auth.users`), `role` (`admin` \| `department`), `department_id` | Sits on top of Supabase's built-in `auth.users`. **There is no signup flow, no invite flow, and no database trigger that creates this row automatically** — a developer with dashboard access has to manually create the `auth.users` row AND the matching `user_profiles` row for every new staff login. Confirmed by grep: no `signUp`/`inviteUserByEmail`/`auth.admin.createUser` call and no `CREATE TRIGGER ... auth.users` anywhere in this codebase. |

### 2.3 Public Comment module

| Table | Notes |
|---|---|
| `topics` | `title`, `description`, `reference_url`, `hearing_date/time/location`, `comment_opens_at`, `comment_closes_at`, `status` (`active`\|`closed`), `closed_at`. See §7 for the important distinction between the time-window check every public page uses and this `status` column, which only an explicit admin click ever changes. |
| `topic_positions` | Admin-defined position options per topic (e.g. For/Against) — plain label + sort order. |
| `comments` | `topic_id`, `position_id`, `name`, `ward`, `comment_text`, `has_concern`, `status` (`pending`\|`approved`\|`rejected`). Every public comment lands as `pending`; nothing is ever auto-approved. |
| `concern_themes` | Admin-defined theme labels (with a `group_label` for grouping), independent of any topic. |
| `comment_concern_themes` | Join table: which themes a given (approved-eligible) comment flagged. Entered by the **submitter at submission time** — there is no admin UI to add/edit these after the fact. |
| `comment_questions` | Free-text questions a submitter attaches to their comment, also submitter-entered only. |

### 2.4 RSA 91-A / core case tables

Covered in §2.1 (`details_91a`, `case_time_log`, `request_topics`) since RSA 91-A is a mode of the core `cases` table, not a separate module with its own case table.

### 2.5 MOU module

| Table | Notes |
|---|---|
| `mou_templates` | `version_number`, `is_current`. Only one row has `is_current = true` at a time — that's the template every new submission uses. Saving a new template version inserts a brand-new row (old versions are never edited in place), so in-flight submissions keep whatever template they started on. |
| `mou_template_sections` | `template_id`, `title`, `locked_text` (contains `{{field_key}}` tokens), `field_definitions` (JSON array of `{key, label, type, required, conditional_on, guidance}`), `allow_section_comment`, `section_order`. **`allow_section_comment` is dead** — saved by the template builder UI but never read anywhere downstream. |
| `mou_submissions` | `submission_number` (e.g. `MOU-2026-1`, sequential per calendar year), `pin_hash`, `org_name`, `org_contact_name`, `org_email`, `current_stage`, `template_id`, `return_to_stage`. `current_stage` is the column name — not `stage`. |
| `mou_submission_field_values` | One row per (submission, field key) — the org's actual answers. |
| `mou_submission_section_text` | Per-section admin overrides (`edited_text`) that, when present, completely replace the token-resolved locked text for that section — see §8.5. |
| `mou_review_comments` | Reviewer-authored notes on a submission, each with an "org-visible" flag. |
| `mou_supporting_documents` | Attachment metadata; files live in the `mou-documents` storage bucket. |
| `mou_activity_log` | Append-only audit trail, shown to both staff and the submitting org. |

### 2.6 CAR module

| Table | Notes |
|---|---|
| `meeting_cycles` | One row per Council meeting date. `status` (`car_cycle_status`), `standard_sections` (`text[]` — which of 9 fixed agenda headings apply to this meeting), `review_date_default/override`, `car_submission_close_default/override`, `packet_publish_date_default/override`. Defaults are auto-computed from the meeting date (review = −17 days, submission close = same as review, packet publish = −5 days) and are individually overridable. |
| `car_submissions` | `submission_number`, `pin_hash`, `submitter_type`, `submitter_name/email/phone`, seven content fields (`from_field`, `subject`, `history`, `recommendation`, `suggested_motion`, `discussion`, `alternatives`), `requires_resolution`, `requires_public_hearing`, `status` (`car_status`), `submitter_confirmed_at`, `review_decision`, `review_note`, `reviewed_at/by`, `meeting_cycle_id`, `work_session_id`, `answer_signed_off_at/by`, `agenda_position`. **`agenda_position` is read by the print views but never written anywhere in the UI** — items currently just fall back to `created_at` order. |
| `car_attachments` | Attachment metadata; files live in Supabase Storage, referenced by public URL in the printed packet. |
| `car_activity_log` | Append-only audit trail per submission, shown to both staff and the submitter. |
| `car_reassignment_history` | Logs moving a CAR from one **meeting cycle** to another (with a status change and a reason) — despite the name, this is cycle reassignment, not department/submitter reassignment; there is no feature for the latter. |
| `work_sessions` | Council workshop sessions used for "hot button" CARs that need discussion before a formal vote — `answers_due_default`. |

### 2.7 Other public-facing tables

| Table | Notes |
|---|---|
| `road_votes` | `road_name` only. One row per vote cast on the public "Which Road Needs the Most Work?" widget — no dedupe, no auth; a visitor can vote unlimited times. |

### 2.8 Enum types actually used by this app

`car_cycle_status`, `car_review_decision`, `car_status`, `car_submitter_type` (CAR); `comment_status`, `topic_status`, `ward_enum` (Public Comment); `mou_actor_type`, `mou_org_review_decision`, `mou_stage` (MOU, 8 values: `org_intake`, `missing_information`, `manager_review_brenda`, `manager_review_city_manager`, `submitter_needs_review`, `ready_for_council`, `approved`, `denied`).

## 3. Folder / file structure

```
src/
  main.jsx                    Vite entry point — mounts <App/> into #root
  App.jsx                     The entire router/nav shell — see §12
  App.css, index.css          Global styles
  supabaseClient.js           Single shared Supabase client (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)

  # Core case tracking
  Landing.jsx                 Public homepage
  SubmitForm.jsx              Public intake form (incl. the 91-A checkbox)
  CaseTracker.jsx             Public "Check Status" lookup
  CaseDetail.jsx              Case detail — the single largest file, shared by admin/department views
  CaseFiles.jsx                Attachment widget used inside CaseDetail
  DepartmentDashboard.jsx     A department's "My Cases" view + their performance panel
  AdminDashboard.jsx          Admin's city-wide case list + Department Accountability table
  AdminDepartmentView.jsx      Admin picking any department to view read-only
  PrintWorkOrder.jsx / PrintMultipleWorkOrders.jsx / PrintCaseDetail.jsx / PrintEscalatedCasesReport.jsx
                               Browser-print report views (see the "Print* convention" note below)
  departmentPerformance.js     Client wrapper that calls the department-performance Edge Function

  # RSA 91-A
  (no separate files — lives inside CaseDetail.jsx / PrintCaseDetail.jsx / SubmitForm.jsx / CaseTracker.jsx, see §6)

  # Public Comment
  PublicInput.jsx              Public topic list
  PublicInputTopic.jsx         Public single-topic analysis + comment feed
  PublicInputSubmit.jsx        Public comment submission form
  AdminTopics.jsx               Admin topic management (embeds AdminModeration.jsx as a tab)
  AdminModeration.jsx           Admin moderation queue
  PrintPublicInputTopic.jsx     Printable topic analysis report
  publicInputValidation.js      Shared honeypot/blocked-name/disclaimer helpers

  # MOU
  MouSubmit.jsx / MouStatus.jsx           Public submission + status/action pages (PIN-based)
  AdminMouSubmissions.jsx / AdminMouTemplates.jsx   Admin review queue + template builder
  MouSubmissionDetail.jsx                  Single-submission review/action page
  PrintMouAgreement.jsx                    Printable final agreement text
  mouConfig.js / mouTextRender.js          Reviewer identities/stage labels; shared {{token}} resolver

  # CAR
  CarSubmit.jsx / CarStatus.jsx            Public submission + status/action pages (PIN-based)
  AdminCarSubmissions.jsx / AdminCarCreate.jsx / AdminCarCycles.jsx
                                            Admin review queue / author-on-someone's-behalf / meeting-cycle manager
  CarCycleDetail.jsx / CarBatchReview.jsx   Single-cycle admin detail + per-cycle bulk review
  CarSubmissionDetail.jsx                  Single-submission review/edit/status-transition page
  CarAgendaBlock.jsx / CarAttachments.jsx  Shared agenda-rendering block / attachment widget
  PrintCarAgenda.jsx / PrintCarPacket.jsx / PrintCarSubmission.jsx
                                            Printable short agenda / full packet / single submission
  carDocxExport.js                         The one true .docx export in the app (single CAR → Word)
  carConfig.js / carGuidance.js            Hardcoded CAR-admin emails, status labels, standard sections; static field-guidance text

  # Road Watch
  RoadWatch.jsx / RoadVote.jsx             Public road-issue map/stats + voting widget (embedded, not routed separately)

  # JLC Facility Repairs (internal only — see §15)
  jlcConfig.js                  Tab label constant, disclaimer text, email-domain rule, date helpers
  JlcReportForm.jsx             The unlisted public employee form (talks only to the jlc-submit Edge Function)
  JlcFacilityRepairs.jsx / JlcFacilityRepairDetail.jsx / JlcFacilitiesAdmin.jsx
                                Internal list / detail + repair form / building manager
  PrintJlcRepair.jsx            Print view mirroring the paper form (blank repair section, or completed)

  # City-wide public transparency
  PublicAnalytics.jsx           "City Analytics" — NOT part of the Public Comment module (a common naming confusion —
                                 despite the name, it dashboards cases/91-A/issue-type data, not topics/comments)

  Login.jsx                     Sign-in only — no signup UI exists anywhere

supabase/
  functions/                    Edge Functions (Deno) — see §11 and per-module sections
    _shared/departmentRecipients.ts   Shared recipient-resolution helper, see §4.3
  migrations/                    Tracked schema changes from 2026-07-16 onward only (see §2)

api/
  daily-case-check.js            Vercel serverless relay — see §13

vercel.json                      Vercel Cron registration only
```

**The `Print*.jsx` convention:** every "export" or "report" feature in this app (except the single CAR Word export) is a full HTML page styled for `window.print()`, with a `.no-print` toolbar (Print + Back buttons) hidden via `@media print { .no-print { display: none !important } }`. There is no server-side PDF generation anywhere — "Save as PDF" always means the browser's own print dialog.

## 4. Case & department routing engine

### 4.1 Auto-assignment at intake

`SubmitForm.jsx` builds a department list for the chosen issue type as `[default_department_id, ...additional_department_ids]` and loops over it, calling the `send-confirmation-email` Edge Function's `auto_assign_department` action once per department (line reference: the loop replaced a single call when multi-department routing was added). Each call creates its own `case_departments` row, its own `case_audit_log` entry ("Auto-assigned to X based on issue type"), and sends that department its own notification email — a case with 2 target departments gets 2 independent assignment rows from the start, not one row with two departments attached.

One issue type, **"Noise / Nuisance / Animal / Crime,"** deliberately has `default_department_id = NULL` — the intake form blocks submission of that category entirely and redirects the resident to the police non-emergency line instead of creating a case.

### 4.2 Referrals

A department (or an admin, on a department's row) can refer a case to a different department by picking a target from a "Refer To Department" dropdown and saving a status of "Referred to Another Department" (a status flagged `is_closing = true`, so the referring department's own row closes). This inserts a new `case_departments` row for the target department, logs `"Referred from X to Y"`, and emails the target department.

`referableDepts()` in `CaseDetail.jsx` computes the referral dropdown's options — it explicitly does **not** exclude departments that have previously worked the case, so a case can bounce PZ → Fire/Code → PZ without getting stuck (this was a real bug, since fixed: the dropdown used to only offer departments that had never touched the case, which made a legitimate back-referral impossible).

**Resolving "my department's row" for a case with a referral history is a repeated footgun.** `CaseDetail.jsx`'s `myDeptAssignment` logic prefers the current user's own **non-closing** `case_departments` row for their department if one exists, and falls back to the most recent row otherwise — never "any row that matches," because a department can have more than one row on the same case (referred out once, then referred back in later) and picking the wrong one shows stale/closed status. Any new feature that needs "what does department X currently think about this case" should reuse this same resolution pattern rather than a naive `.find(cd => cd.department_id === X)`.

### 4.3 Notification recipients

`supabase/functions/_shared/departmentRecipients.ts` exports `resolveDepartmentRecipients(departmentId, departmentName, ...)`, used by every Edge Function that emails a department (assignment, referral, reminders, escalation). It checks a hardcoded `DEPARTMENT_EMAIL_OVERRIDES` map first (currently `City Manager`, `IT`, and `Assessing` — the last one being a **one-time snapshot** of Fire/Code's roster from 2026-09-17, not a live mirror); if a department isn't in that map, it looks up `user_profiles` for that `department_id` and resolves each to a real email via the Supabase Admin Auth API. **If Fire/Code's roster changes, `Assessing`'s override needs a manual edit — it will not update itself.**

### 4.4 Auto-closing a case

Once every `case_departments` row for a case reaches an `is_closing` status, the parent `cases` row closes automatically and the resident gets an email — this happens as a side effect inside the same save path that updates a department's status (`CaseDetail.jsx`), not a separate scheduled job.

## 5. The "accountability system" (reminders, escalation, silence tracking)

This spans four places that must agree on the same two rules, and have historically drifted out of sync with each other when only one was fixed at a time:

1. **What counts as "movement"** — a **status change or a public comment**, and nothing else. An internal (staff-only) note never counts, because the point of tracking silence is public-visible progress.
2. **Scope** — always the individual `case_departments` **row**, never the parent `cases` row. A department that closed its own assignment (e.g. by referring the case out) must never be flagged just because the case is still open under a different department.

| Where | File | What it does |
|---|---|---|
| Daily reminder/escalation email | `supabase/functions/daily-case-check/index.ts` | 3-day silence digest email per department; 2-week escalation email to both the department and the City Manager's Office |
| Admin quick view | `src/AdminDashboard.jsx` — "📊 Department Accountability" table | Per-department tally of rows with no *recent* comment/status change (see §5.4) |
| Department banner | `src/DepartmentDashboard.jsx` — "⚠️ Needs Update" filter | Flags a department's own cases silent 7+ days since their last real movement (see §5.4) |
| Printable report | `src/PrintEscalatedCasesReport.jsx` — "🚨 Escalated Cases Report" | Full narrative of every currently-escalated case, grouped by department, for the City Manager |

### 5.1 The follow-up-date exception

Some departments (Fire/Code especially) give a violator a correction window (`cases.followup_due_date`) before any further movement is expected. `daily-case-check`'s `inFollowupGracePeriod(cd)` skips a `case_departments` row entirely, for both the 3-day reminder and the 14-day escalation check, while that date is today or in the future. Once it passes, the silence clock does **not** resume from whatever stale activity predates the correction window — `effectiveActivityAt = latestDate(lastActivityAt, followup_due_date)` resets it to the deadline itself, so the normal cadence starts counting fresh from the day the window closed. **This grace-period logic currently exists only in `daily-case-check`** — the in-app dashboards (`AdminDashboard.jsx`, `DepartmentDashboard.jsx`) do not yet have an equivalent, so a case inside its correction window can still show up as "needs attention" on-screen even though it won't trigger an email.

### 5.2 "Ever escalated" vs. "still actively escalated" — a known inconsistency

`case_departments.escalated_at` is set once when the 2-week escalation fires and is **never cleared**. That makes "has `escalated_at` set" a much cruder condition than "is *currently* still escalated" (i.e., no real movement has happened since the escalation fired: `escalated_at >= lastMovementAt`).

- `AdminDashboard.jsx`'s "Escalated to CM" quick filter uses the **cruder** check (`some(cd => cd.escalated_at)`).
- `PrintEscalatedCasesReport.jsx` uses the **stricter** check, and additionally reconstructs *what* the last movement actually was (a comment's text/author, or a status change's target/actor) by taking the single latest matching entry from `case_audit_log` for that department — see the long comment at the top of `findStatusChangeAuditEntry()` in that file for why there's deliberately **no timestamp ceiling** on that lookup (the audit-log write happens in a separate, slightly-later `await` than the status update it's describing, so filtering by "before this timestamp" can miss the very entry being searched for).

This is a known, intentional inconsistency, not yet reconciled — see [MAINTENANCE.md](MAINTENANCE.md).

### 5.3 Audit-log text is load-bearing

Both `PrintEscalatedCasesReport.jsx` (`findStatusChangeAuditEntry`) and `department-performance/index.ts` (`ASSIGNED_TO_RE`, `AUTO_ASSIGNED_RE`, `REFERRED_TO_RE`, `DEPT_STATUS_RE`) parse `case_audit_log.action` with regexes matched against the *exact* phrasing `CaseDetail.jsx`/`SubmitForm.jsx`/`send-confirmation-email` currently write (e.g. `"<Dept> status changed from "X" to "Y""` for self-service edits vs. `"<Dept> status updated from "X" to "Y" by admin"` for an admin's per-row edit). **Changing any of that wording without updating these regexes will silently break reporting and performance stats** — there's no test suite that would catch it.

### 5.4 Fixed 2026-09-26: "has this ever happened" vs. "has this happened recently"

`AdminDashboard.jsx`'s "Silent 7+ Days" column and `DepartmentDashboard.jsx`'s "⚠️ Needs Update" filter both used to check whether a comment or status change had **ever** occurred on a row (`Boolean(cd.status_changed_at)`, and a plain existence check for comments), rather than **when** the most recent one happened. Since `status_changed_at` is set the first time a row's status is ever recorded and a comment-existence check has no expiry, a single touch — even a status change or comment from months earlier — permanently satisfied "has movement" for that row and hid it from both features forever afterward, no matter how stale it got. A real case was found silent for 52 days (last comment 8/5, checked 9/26) while still showing as fine on both screens.

Both were fixed to compute a genuine `lastActivityAt = latestDate(status_changed_at, mostRecentCommentDate, created_at)` and check `daysSince(lastActivityAt) >= 7`, matching the same recency-based pattern `daily-case-check` and `PrintEscalatedCasesReport.jsx` already used correctly (see §5.2's `escalated_at >= lastMovementAt` for the same idea applied to escalation). `AdminDashboard.jsx`'s separate "No Status Change or Comment" column was left as a boolean "never touched at all since assignment" check — a legitimately different, narrower signal from "currently stale" — but "Silent 7+ Days" is no longer nested inside it, so a row that *had* activity once and has since gone quiet is no longer invisible to the 7-day check.

**If you add a third "is this case silent" check anywhere else in this app, make it recency-based (`daysSince(lastActivityAt) >= N`) from the start** — the existence-check version of this bug is easy to introduce by accident and easy to miss in review, since it looks correct and works fine until enough time passes.

## 6. RSA 91-A (Right-to-Know) workflow and tax-dollar calculation

### 6.1 Becoming a 91-A case

A resident checks "This is a Right-to-Know request (RSA 91-A)" at intake (`SubmitForm.jsx`), which relabels "Location / Address of Issue" to "Subject of Request" (no longer required) and adjusts the description placeholder. On submit, `cases.is_91a` is set and a blank `details_91a` row is inserted for that case.

An admin can also flip this flag later from the "Update Case" panel in `CaseDetail.jsx`. Flipping false→true inserts a `details_91a` row (if one doesn't already exist) and logs `"Case converted to 91-A Right-to-Know request"`. Flipping true→false does **not** delete `details_91a` or the time log — it just logs `"91-A flag removed from case"`, preserving the record.

Once `is_91a` is true, admin-only UI appears in `CaseDetail.jsx`: a "91-A" tag next to the case number, the Location field relabeled, a full "Right-to-Know (RSA 91-A) Details" card, a "⏱ Time Log" card, and the admin status dropdown appends "(91-A)" after any `is_91a_only` status. Department users never see any of this — their status dropdown filters out `is_91a_only` statuses entirely, so only an admin can move a case through the 91-A-specific lifecycle.

### 6.2 Status lifecycle

The five `is_91a_only` statuses, in intended (not enforced — status is a free-choice dropdown, there's no state machine) order:

1. **Gathering Records** — actively searching for/collecting the requested records.
2. **Reviewing Records** — collected, under legal review before release.
3. **Records Ready - Please Schedule Pick Up** — ready; requestor needs to schedule.
4. **Request Abandoned** *(closing)* — requestor never scheduled pickup; request closed.
5. **Clarification Needed** — a side branch; the City needs more info from the requestor.

### 6.3 Delivery method and appointments

`DELIVERY_METHODS` in `CaseDetail.jsx`: `City USB`, `Self USB`, `In Person Viewing`, `Print`, `Mailed`, `Hold for Pick Up`. Choosing one auto-sets two booleans: `mailed = (method === 'Mailed')`, `hold_for_pickup = (method === 'Hold for Pick Up')`. If the method is one of `APPOINTMENT_METHODS` (`City USB`, `Self USB`, `In Person Viewing`, `Print`), an "Appointment Date & Time" field appears; if it's exactly `Mailed`, a "Tracking Number" field appears instead; `Hold for Pick Up` shows neither.

### 6.4 Tax-dollar calculation — the one piece of real arithmetic in this app

`case_time_log` is a running ledger any admin can add entries to (Minutes Worked / Staff Initials / Hourly Rate — **the rate is entered per-entry, not a fixed system constant**, since different staff can have different pay rates). On every new entry (`CaseDetail.jsx`'s `handleAddTimeLog`):

```js
const cost = parseFloat(((minutes / 60) * hourlyRate).toFixed(2))
// ...then, summed over every entry for the case:
const totalCost = allEntries.reduce((sum, e) => sum + parseFloat(e.cost), 0)
await supabase.from('details_91a').update({ tax_dollar_spent: totalCost.toFixed(2) }).eq('case_id', caseId)
```

`details_91a.tax_dollar_spent` is therefore fully derived and read-only in the UI ("Auto-updated from time log entries below"). **`hours_worked` and `hours_worked_closed` are NOT derived the same way** — both are plain manual number inputs with no link back to `case_time_log.minutes`. Don't assume the hours fields update automatically the way the dollar figure does; staff have to total and type those in themselves. `fees_assessed`/`fees_collected` are likewise plain manual entries with no formula.

`acknowledged_date` is also a plain manual date field — nothing auto-populates it, even though it's used by the public transparency dashboard (`PublicAnalytics.jsx`) to compute "acknowledged within 5 business days," the actual RSA 91-A legal requirement being tracked.

### 6.5 What the public sees for a 91-A case

Nothing financial or appointment-related, ever. `CaseTracker.jsx`'s list and detail queries only ever select `is_91a` (to show a badge and relabel Location) — no `details_91a` columns, no `case_time_log`. The only public disclosure of RTK financials is the aggregate, anonymized "Right-to-Know Requests (RSA 91-A)" section of `PublicAnalytics.jsx` (city-wide totals, on-time-acknowledgment rate, total hours/dollars, top repeat requestors by anonymous ID) — never per-case detail.

## 7. Public Comment module

### 7.1 Flow

Admin creates a topic (`AdminTopics.jsx`, "Topics" tab) with a title, description, reference URL, hearing date/time/location, a required comment-open/close window, and at least one position — always created with `status: 'active'`. Residents browse open topics (`PublicInput.jsx`), view a topic's live position/concern-theme breakdown and the approved-comment feed (`PublicInputTopic.jsx`), and submit a comment (`PublicInputSubmit.jsx`) with a name, ward, position, comment text, and — only if they check "I have a specific question or concern for council" — free-text questions and/or concern-theme checkboxes, **all entered by the submitter at that moment**; there is no admin UI to add or edit questions/themes on a comment afterward. Every new comment lands as `status: 'pending'`. An admin moderates one at a time in a single chronological FIFO queue (`AdminModeration.jsx`, filterable by topic) — there is no bulk approve/reject anywhere in this module. Only `status: 'approved'` comments (and their questions/themes) ever become visible anywhere public — the analysis charts, the comment feed, the printable report (`PrintPublicInputTopic.jsx`), and the tally on the topic list all filter on this.

### 7.2 Two independent notions of "closed" — don't conflate them

- **Time-window closed** (`isTopicOpen()` in `publicInputValidation.js`): purely computed from `comment_opens_at`/`comment_closes_at` vs. now, recalculated on every page load. This is what every public page actually uses to decide whether to accept new submissions.
- **Database `status = 'closed'`**: only changes when an admin explicitly clicks "Close Topic" in `AdminTopics.jsx`, which also stamps `closed_at`. A topic whose comment window has already passed still shows `status: active` in the admin list, with "Close Topic" still available, until that click happens.

### 7.3 Anti-spam

`publicInputValidation.js` provides a honeypot field (a hidden `website` input — any value silently fakes a success response without touching the database) and a blocked-name filter (rejects blank, one-character, or values like "anonymous"/"n/a"). Both run before any insert in `PublicInputSubmit.jsx`.

### 7.4 Not part of this module (a common naming trap)

`PublicAnalytics.jsx` (nav label "City Analytics") is a **separate transparency dashboard** built entirely from `cases`/`case_departments`/`details_91a`/`issue_types` — despite the similar name, it has zero connection to `topics`/`comments`. The actual analysis for a Public Comment topic (position breakdown, concern themes) is rendered inline inside `PublicInputTopic.jsx` and `PrintPublicInputTopic.jsx`, not in a dedicated analytics file.

## 8. MOU module — retired

**Retired from the live app on 2026-09-29** (no longer in use, per Brenda — including one real, unfinished submission that was confirmed dead rather than followed up on). Everything below still describes how the module works internally — nothing was deleted — but it is no longer reachable from anywhere in the running app. A single flag, `MOU_MODULE_ENABLED` in `src/mouConfig.js`, is set to `false`; every MOU nav button (public "Submit an MOU"/"Check MOU Status," the homepage cards in `Landing.jsx`, and the admin "MOUs" button) and all 6 MOU `page` values in `App.jsx` (`mou-submit`, `mou-status`, `admin-mou-submissions`, `admin-mou-templates`, `mou-detail`, `print-mou-agreement`) are gated behind it directly. Flipping `MOU_MODULE_ENABLED` back to `true` restores every entry point immediately, with no data migration needed — the database tables (`mou_templates`, `mou_template_sections`, `mou_submissions`, `mou_submission_field_values`, `mou_submission_section_text`, `mou_review_comments`, `mou_supporting_documents`, `mou_activity_log`), the MOU-specific enums, and the `mou-submit`/`mou-org-action` Edge Functions were all left exactly as they were — including the one real submission, `MOU-2026-1` (Community Action Partnership Belknap-Merrimack Counties Head Start Program), which was sitting at `missing_information` when the module was retired.

### 8.1 Templates

`AdminMouTemplates.jsx` edits the single row of `mou_templates` where `is_current = true`, plus its ordered `mou_template_sections`. Each section has a title, "Locked Text" (a paragraph containing `{{field_key}}` tokens), and a hand-edited raw JSON array of field definitions (`key`, `label`, `type`, `required`, `conditional_on`, `guidance`). "Save as New Version" always inserts a brand-new `mou_templates` row (never edits in place) and flips `is_current` — existing in-flight submissions keep pointing at their original `template_id`, so editing the template never retroactively changes a submission already in progress.

### 8.2 Submission and PIN-based access

An org fills out only organization name/contact/email to start (`MouSubmit.jsx`); there's no template picker — the `mou-submit` Edge Function looks up whichever template `is_current` and creates the `mou_submissions` row at stage `org_intake`, mints a sequential `MOU-YYYY-N` submission number and an 8-digit PIN (SHA-256 hashed, never stored or emailed in plaintext). Every subsequent org-side action — from either the same session (`MouSubmit.jsx`) or a return visit (`MouStatus.jsx`) — authenticates with `{submissionNumber, pin}` against the `mou-org-action` Edge Function, which enforces a 5-attempt/30-minute lockout. **This is PIN-based, not a magic-link/token model.** If a PIN is lost, the only recovery path is an admin's "Reset PIN" button on the submission detail page, with an explicit instruction to relay the new PIN by phone, never email.

Fields autosave individually on blur (`save_field` action) while in an editable stage. Attachments upload straight to the `mou-documents` storage bucket.

### 8.3 The 8-stage review lifecycle

`mou_submissions.current_stage` (column name, not `stage`):

| Stage | Entered by | Who can act, and how |
|---|---|---|
| `org_intake` | Submission created | Org fills fields, picks one of three reactions ("This looks good to me" / "Accept with changes" / "I do not like this" — recorded but non-branching), clicks "Submit to the City" → advances to `manager_review_brenda` (or wherever `return_to_stage` points) |
| `missing_information` | Either reviewer's "Send Back — Missing Information" | Emails the org with the reviewer's note; org can edit fields again |
| `manager_review_brenda` | Default landing stage | Brenda-only actions: send back (either reason above), or "Push to City Manager" |
| `manager_review_city_manager` | Brenda's push | City Manager-only actions: same two send-backs, "Send Back to Brenda," or "Mark Ready for Council" |
| `submitter_needs_review` | Either reviewer's "Send Back — Submitter Needs to Review/Approve" | Org sees the City's **edited** text read-only and must pick one of the three reactions to advance — no "edit my answers" option at this stage, since the point is approving the City's edit, not re-answering |
| `ready_for_council` | City Manager's "Mark Ready for Council" | **Any logged-in admin** — not gated to Brenda/City Manager specifically — can schedule a Council date and record Approved/Denied. This is a real, intentional-looking but undocumented gap in the reviewer-role gating; flagged here rather than fixed unasked. |
| `approved` | Council decision recorded | Terminal |
| `denied` | Council decision recorded | Can still be sent back to City Manager review |

Every send-back stores `return_to_stage` so the org's next resubmission routes back to whichever reviewer sent it back, not always to Brenda.

### 8.4 Reviewer-role gate is a UI convenience, not the real security boundary

`App.jsx`'s `mou-detail`/`print-mou-agreement` pages only require `session` (any logged-in user), not `userRole === 'admin'` — but in normal click-driven navigation, `viewingMouSubmissionId` is only ever set from `AdminMouSubmissions.jsx`, which itself requires `userRole === 'admin'`. The real backstop is Postgres RLS: every MOU table restricts reads/writes to `is_mou_admin()` (`user_profiles.role = 'admin'`), so a non-admin authenticated user who somehow reached the detail page would just see "Submission not found" — every query returns empty under RLS.

### 8.5 Locked-text resolution — one shared implementation, never duplicate it

`src/mouTextRender.js`'s `resolveSectionText(section, valuesByKey, fieldsByKey, editedText)` is deliberately the **single** place this logic lives (its own header comment says a prior bug came from duplicated copies — don't reintroduce that). Resolution order:

1. If an admin has saved `edited_text` for that section (`mou_submission_section_text`), it wins outright — no token substitution runs at all.
2. Otherwise, each `{{field_key}}` token resolves to: **"Not Applicable"** if the field has a `conditional_on` field that isn't answered `'yes'`; the real submitted value if present; or a blank placeholder (`"_____________"` in plain-text contexts, or a `isBlank` flag for JSX callers to render their own marker) if the field is simply unanswered.

This same function backs `MouSubmit.jsx`'s review screen, `MouStatus.jsx`'s review/read-only view, `MouSubmissionDetail.jsx`'s editable draft seed, and `PrintMouAgreement.jsx`'s final export.

### 8.6 Export

`PrintMouAgreement.jsx` is browser-print-only — there is **no `.docx` export for MOUs**, unlike CAR. It carries an explicit disclaimer that it isn't the legally final agreement until Council has acted.

## 9. CAR (Council Agenda Report) module — retired

**Retired from the live app on 2026-09-26.** Everything below still describes how the module works internally — nothing was deleted — but it is no longer reachable from anywhere in the running app. A single flag, `CAR_MODULE_ENABLED` in `src/carConfig.js`, is set to `false`; every CAR nav button (public "Submit a CAR"/"Check CAR Status," the homepage cards in `Landing.jsx`, and the admin "CARs" button), and every `page` value listed in §9.2–§9.5 below, is gated behind it either directly or transitively through `isCarAdmin` (`App.jsx`'s `isCarAdmin = CAR_MODULE_ENABLED && !!carAdminRole(...)`). Flipping `CAR_MODULE_ENABLED` back to `true` restores every entry point immediately, with no data migration needed — the database tables (`car_submissions`, `car_attachments`, `car_activity_log`, `car_reassignment_history`, `meeting_cycles`, `work_sessions`), the CAR-specific enums, the `car-submit`/`car-org-action` Edge Functions, and one real piece of history (`CAR-2026-1`, a real submission by Brenda Demers tied to the 8/31/2026 meeting cycle) were all left exactly as they were. If the module is ever fully removed instead of just hidden, that historical record should be exported first — see [MAINTENANCE.md](MAINTENANCE.md).

### 9.1 Two distinct admin "create" actions — don't confuse them

- **`AdminCarCycles.jsx`** creates a **meeting cycle** (just a meeting date; three key dates auto-compute as defaults, individually overridable).
- **`AdminCarCreate.jsx`** lets a CAR admin **author a CAR on someone else's behalf** (e.g. for a councilor or department that won't use the public form) directly into an existing, still-open cycle — it writes straight to `car_submissions` via the authenticated client (permitted by the `is_car_admin()` RLS policy) and immediately self-confirms (`submitter_confirmed_at` set, `status: 'submitted'`), so it's instantly eligible for batch review exactly like a real public submission.

### 9.2 Public submission and PIN-based access

`CarSubmit.jsx` never asks the submitter to pick a cycle — the `car-submit` Edge Function silently attaches the new submission to whichever cycle currently has `status = 'open_for_submissions'` and hasn't passed its submission-close date, because `meeting_cycles` has no anonymous read policy and this pick has to happen server-side with the service-role key. Content fields, in order: From, Subject, History, Recommendation, Suggested Motion, Discussion, Alternatives, plus two Yes/No toggles (Requires a Resolution, Requires a Public Hearing). The initial `car_status` is `'submitted'` and **stays `'submitted'`** through drafting — `submitter_confirmed_at` (not the status enum) is what actually distinguishes "still filling out" from "confirmed, awaiting review," which is exactly the field `CarBatchReview.jsx` filters on.

Like MOU, this is PIN-based (submission number + 8-digit PIN, hashed, never emailed) via the `car-org-action` Edge Function, with the same 5-attempt/30-minute lockout pattern. `car-org-action` also handles the submitter's post-review-questions answer (`save_answer`, only while `status = 'answer_due'`) — the closest CAR analog to MOU's "org responds" step, but **CAR has no reject-and-revise loop**: a straight "Reject" decision has no path back to an editable state for the submitter.

### 9.3 Review lifecycle

Only the two hardcoded CAR-admin emails (see §12) can drive any transition, from either the individual page (`CarSubmissionDetail.jsx`) or the per-cycle batch queue (`CarBatchReview.jsx`, which only lists confirmed, still-`submitted` CARs for one cycle):

```
submitted ──Reject──────────────────────────────────────────► rejected  (dead end)
submitted ──Approve, Normal Business───────────────────────► included_in_packet
submitted ──Approve, Hot Button─────────────────────────────► pending_work_session_assignment
   └─ Assign to Work Session ─► scheduled_for_work_session
        └─ Mark Work Session Held ─► answer_due
             └─ submitter answers (car-org-action save_answer) ─► answer_submitted
                  └─ Sign Off — Include in Packet ─► included_in_packet
                  └─ Send Back for Revision ─► answer_due (loop)
   (from scheduled_for_work_session / answer_due / answer_submitted)
        └─ Mark Missed Deadline ─► pushed_to_reassignment
```

Any admin can additionally "Reassign to a Different Cycle" from `CarSubmissionDetail.jsx` at any point (moves `meeting_cycle_id`, sets any status, logs to `car_reassignment_history`).

**Two enum values are effectively dead.** `under_review` is only ever reachable as a manually-picked option in the reassignment dropdown — no automatic transition produces it. `packet_published` and `decided_at_meeting` are never set on an individual `car_submissions` row anywhere in the app — only the *cycle's own* `car_cycle_status` reaches those values (via a dropdown in `CarCycleDetail.jsx`), and nothing cascades that down to the submissions in it. In practice, an included CAR's own status tops out at `included_in_packet` unless separately edited.

### 9.4 Cycle detail and export

`CarCycleDetail.jsx` is where an admin sets meeting logistics (time/location/Zoom), overrides the three key dates, toggles which of the 9 fixed "standard sections" (Legislative Update, Comments from the Public, Mayor's/Manager's/School Board updates, Committee Reports, Non-Profit Reports, Other Business, Council Acknowledgement) apply, and adds Council work sessions. There is no dedicated "finalize" action beyond manually setting the cycle's own status.

Two different exports, both browser-print-only, sharing the same `CarAgendaBlock` component for the agenda portion:

- **"Print Agenda"** (`PrintCarAgenda.jsx`) — the short, numbered meeting (or workshop) agenda alone: one line per included CAR reading "Council to consider {recommendation}."
- **"Generate Packet"** (`PrintCarPacket.jsx`) — that same agenda page, followed by one full paginated write-up per included CAR (History/Recommendation/Suggested Motion/Discussion/Alternatives/attachments table).

Both use a centered, seal-less "CITY COUNCIL MEETING" letterhead — a deliberately different, more meeting-minutes-style header than the single-submission export's left-aligned city-seal header (see §9.5). Items are ordered by `agenda_position` then `created_at`, but since nothing in the UI ever writes `agenda_position`, ordering is effectively always `created_at` today.

### 9.5 Single-submission export

`PrintCarSubmission.jsx` (browser print) and `src/carDocxExport.js` (`generateCarDocx`/`downloadCarDocx`, via the `docx` npm package's browser-safe `Packer.toBlob()`) both render one CAR with the real city letterhead: `public/city-seal.png` + "City of Franklin" + "Council Agenda Report" + a horizontal rule + the meeting date, left-aligned. **This is the only true `.docx` file generated anywhere in this app** — every other export/report is browser-print HTML.

## 10. Road Watch / Road Vote

`RoadWatch.jsx` (public, nav label "Road Watch") is a transparency/tracking page built on the **core `cases` table** — it explicitly filters `is_91a = false` and a fixed list of road-related issue types, then renders scorecards, a Leaflet map with status-colored pins, an issues-by-type bar chart, and a filterable table. It embeds `RoadVote.jsx`, a simple "which road needs the most work" widget: pick from ~140 hardcoded Franklin street names, cast a vote (inserts one `road_votes` row, no dedupe or auth — a visitor can vote any number of times), and see a live top-10 leaderboard. Confirmed unrelated to RSA 91-A or Public Comment — it's a presentation layer over the same case data everything else uses, plus one small standalone voting table.

## 11. Email system

Every transactional email funnels through **one** Edge Function, `send-confirmation-email`, dispatched by a `type` field in the request body — despite the name, it is not case-system-specific; it also handles every MOU and CAR notification (`mou_submitted`, `mou_sent_back_missing_information`, `mou_ready_for_council`, `mou_council_decision`, `car_submitted`, `car_new_submission`, `car_rejected`, `car_approved_normal`/`car_approved_hot`, `car_reassigned`, and more — grep `body.type ===` in that file for the full current list before assuming a type exists). Public Comment's confirmation email (`public_comment_pending`) also goes through this same function.

`daily-case-check` (the scheduled silence/escalation job, see §5) sends its own emails directly via a small `sendBrevoEmail` helper rather than going through `send-confirmation-email` — it's a separate Edge Function with its own Brevo call.

All email actually leaves via Brevo's transactional API (`api.brevo.com/v3/smtp/email`), authenticated with the `BREVO_API_KEY` Edge Function secret. A `BREVO_SENDER` constant (`noreply.franklin.sr@gmail.com`) is hardcoded per function.

## 12. Auth, roles, and access control

There are **two independent permission systems layered on top of each other**, and they don't always agree on who's an "admin":

1. **`user_profiles.role`** (`admin` | `department`) — the normal role system, read once per session (`App.jsx`) and used for most gates (`admin-dashboard`, `admin-public-topics`, `admin-mou-submissions`, department pages).
2. **`isCarAdmin`** — a completely separate, **email-based** allowlist of exactly two addresses hardcoded in `src/carConfig.js` (`carAdminRole(email)`), mirrored server-side by an `is_car_admin()` Postgres function that RLS policies check. This is unrelated to `user_profiles.role` — a `user_profiles.role = 'admin'` account that isn't one of those two emails cannot reach any CAR admin screen, and vice versa (in principle a CAR admin need not be a `user_profiles` admin at all, though in practice both CAR admins also happen to be `role = 'admin'`). As of 2026-09-26, `isCarAdmin` is additionally short-circuited to always be `false` via `CAR_MODULE_ENABLED` — see §9.

Sign-in is `supabase.auth.signInWithPassword` only — **there is no signup screen anywhere in this app.** New staff accounts are created by hand in the Supabase dashboard (an `auth.users` row plus a matching `user_profiles` row); there's no trigger or in-app flow that does this automatically. A session auto-signs-out after 10 minutes of no mouse/key/scroll/click activity.

`MouSubmissionDetail.jsx`/`print-mou-agreement` and the CAR admin pages both illustrate the same pattern worth remembering elsewhere in this app: **the client-side page gate is a UI convenience; Postgres RLS is the actual security boundary.** Don't assume a missing `userRole` check on a given `page` value is a vulnerability without first checking whether RLS would return empty data anyway.

## 13. Deployment pipeline

```
Developer  →  GitHub (main)  →  Vercel (auto build + deploy)  →  live site
                              ↳  Supabase migrations & Edge Functions — separate, MANUAL step
```

Vercel auto-deploys on every push to `main`; a failed build leaves the previous deployment live. Supabase does **not** auto-deploy — `npx supabase db push` and `npx supabase functions deploy <name>` have to be run by hand whenever schema or Edge Function code changes. "I pushed the code" therefore does not necessarily mean the database or backend logic changed too.

`vercel.json` registers exactly one Vercel Cron entry: `POST /api/daily-case-check` at `0 12 * * *` (roughly 8am Eastern, shifting with DST). `api/daily-case-check.js` is a thin relay — Vercel Cron can only hit routes inside its own deployment, so this endpoint's only job is to call the real Supabase `daily-case-check` Edge Function, keeping the service-role key and Brevo key confined to Supabase's own secret store rather than duplicated into Vercel's environment.

Environment variables actually read by the app: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (both needed on the developer's machine, in Vercel's project settings, and nowhere else — they're the only two `supabaseClient.js` uses). A third variable, `VITE_RSEND_API_KEY`, sometimes exists in a local `.env.local` but is **not referenced anywhere in `src/` or `api/`** — it looks like a dead leftover from an earlier/alternate email setup; the real Brevo key lives only in Supabase's Edge Function secrets (`BREVO_API_KEY`), never in a `VITE_`-prefixed (browser-exposed) variable.

## 14. Tables that exist in this Supabase project but are NOT part of this app

This Supabase project (`sdibtkmmcegthmytmzvy`) also contains a completely separate, unrelated set of tables and enums: `complaints`, `complaint_access`, `complaint_audit_log`, `complaint_dashboard` (view), `complaint_repeat_subjects` (view), and enums `complaint_category`, `complaint_status`, `dept_recommendation`, `employee_role`, `final_disposition`, `hr_decision`. This is evidently an internal HR/employee-complaints tool that happens to share this Supabase project. **A repo-wide search for `complaint` across `src/` and `supabase/functions/` returns zero matches** — nothing in this React app reads, writes, or references any of it. If you find these tables while browsing the Supabase dashboard, they are foreign to this application; do not extend, migrate, or document them as part of it, and be careful not to run any schema change against this project without checking which app a table actually belongs to first.

## 15. JLC Facility Repair Report module (internal-only)

An **internal-only** intake and repair log for problems with City-owned buildings (a broken step, a broken lock, a flashing smoke detector), built for the Joint Loss Committee to replace a paper form. It is **not a service request**, lives in its own tables, and feeds nothing public (no analytics, Road Watch, search, exports, or public API). Some reports describe security weaknesses, so the design rule is: **nothing about a report is ever readable or queryable by the public.** The build plan this follows is `JLC-Facility-Repair-Module-Build-Plan.md` in the repo root.

### 15.1 Who can do what

| Who | Access |
|---|---|
| Anyone (no login), via the form (unlisted, but linked discreetly from the Staff Login screen) | Submit one report (and up to 3 photos) through the `jlc-submit` Edge Function. **Cannot read, list, count, or update anything**; the `anon` role has no privileges on any of these tables, the storage bucket, or the helper RPCs (verified against the live REST API). |
| `user_profiles.role = 'admin'`, or a `department` login whose department is **MSD** or **City Manager** | See the **JLC Facility Repairs** tab: read everything, log repairs, mark Completed, manage buildings, print. Decided by `public.is_jlc_user()`. |
| Admins only (`is_jlc_admin()`) | Additionally edit the *original* report details after submission (every change is logged). |
| Any other login (Fire/Code, PZ, etc.) or a login with no profile | Nothing — RLS returns zero rows and the tab is hidden. |

There is currently no `department`-role login for the City Manager department (the City Manager's Office reaches the tab through the `admin` role); the rule is written to also admit one if it is ever created. The nav tab is only a convenience: `App.jsx` asks the database (`rpc('is_jlc_user')`) whether to show it, but RLS is the real boundary.

### 15.2 Tables (migrations `20261006100000_jlc_facility_repair_module.sql` and `20261006110000_jlc_function_hardening.sql`)

| Table | Purpose |
|---|---|
| `city_facilities` | Admin-managed buildings (`name`, `address`, `is_active`). Archive, never delete; seeded with the seven buildings in the plan. The public form's dropdown = active buildings + a hard-coded "Other city building" option. |
| `facility_repair_reports` | One row per report. **Request half** (set at submission): `facility_id` or `facility_other_name`, `department`, `issue_location`, `reported_date`, `problem_description`, `reported_by_name`, `reporter_email`, `reporter_phone`. **Repair half** (internal): `repaired_by`, `work_description`, `completed_date`, `parts_used`, `reporter_notified_date`, `reporter_notified_via` (`Phone` or `Email`). `status` is `open` or `completed` only. `confirmation_number` is `JLC-<year>-NNNN`. |
| `facility_repair_attachments` | Photo metadata (`storage_path`, `file_name`, size, type). Max 3 per report (DB trigger), 5 MB or less, images only. |
| `facility_repair_activity_log` | Field-level audit trail with old/new values. **Written only by database triggers** (and the `log_jlc_print` RPC), never by client code, so it can't be skipped or forged. Also records building add/edit/archive. |
| `facility_repair_counters` | Per-year counter behind `next_jlc_confirmation_number()` (atomic; resets each January). Service role only. |
| `facility_repair_rate_limits` | Hashed-IP submission attempts for throttling. Service role only. |

Storage bucket **`jlc-facility-repair` is private** (unlike the older `case-files`, `mou-documents`, and `car-attachments` buckets, which are public — do not copy their policies for anything sensitive). Only the Edge Function writes to it; authorized staff read through short-lived signed URLs (`createSignedUrls`, 10 minutes). The bucket also enforces a 5 MB limit and an image MIME allow-list itself.

### 15.3 Rules enforced in the database (not just the UI)

- **"All six repair fields required to be Completed"** — the `jlc_completed_requires_repair_fields` CHECK constraint. `parts_used` accepts an explicit "None".
- **Reporter email must be exactly `@franklinnh.gov`** (the `jlc_reporter_email_domain` CHECK) — also enforced in the Edge Function and mirrored in the form.
- **Request half is locked after submission** except for admins, and confirmation number / submitted time / reported date are immutable for everyone — the `jlc_guard_report_update` trigger. `completed_by_user_id` and `completed_logged_at` are filled in by that trigger and are not client-writable (column-level `UPDATE` grants).
- **Clients can only SELECT and UPDATE reports** (no INSERT, no DELETE) and only SELECT attachments and the log; the database is the gatekeeper, the UI just reflects it.
- A completed report can be **reopened** (status back to open, completion metadata cleared, repair details kept, logged). Not in the plan; added so a mis-click is recoverable.

### 15.4 The public submission path (`supabase/functions/jlc-submit`)

The only way an anonymous visitor writes anything. In order: size cap, then reject any form field not on an allow-list (this is what stops callers setting `status` or repair fields), then honeypot (`hp_website`), then a per-IP rate limit (20/hour, 100/day on a salted SHA-256 of the IP; deliberately generous because City Hall shares one outbound IP), then Cloudflare Turnstile (if configured), then field validation and the email-domain rule, then the building must exist and be active (or "other" with a name), then each photo is checked by **magic bytes** rather than client-supplied type or extension (JPEG/PNG/WEBP/HEIC; 5 MB; at most 3), then confirmation number, insert, upload photos to the private bucket, insert attachment rows. Any failure after the report row exists **rolls it back** (deletes the row and any uploaded files). It also serves `{"action":"facilities"}` so the form can fill its dropdown without any table access. (Requests larger than roughly 18 MB are cut off by Supabase's gateway before reaching the function and come back as a 502 — nothing is stored.)

Emails (Brevo; a failure never fails the submission): the **reporter** gets only the confirmation number and a note that follow-up isn't guaranteed — **never the problem description or location**. **MSD** (everyone `resolveDepartmentRecipients` finds for MSD, plus any addresses in the optional `JLC_NOTIFY_EMAIL` secret) gets the confirmation number, building, and reporter name/department, with a login link — also no description or location. All user-supplied values are HTML-escaped. There are **no** automatic emails on repair or closure, no reminders, and no escalation: notifying the reporter is a manual MSD step recorded in `reporter_notified_date` / `reporter_notified_via`.

**Known limitation (also noted in the function's header):** the domain check proves the *format* of an address, not that the person owns it. Turnstile, the rate limit, the honeypot, and the form being unlisted are the practical safeguards; email verification would be the next hardening step.

### 15.5 Configuration and secrets

| Setting | Where | Effect |
|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Vercel env var | Shows the Turnstile widget on the form. |
| `TURNSTILE_SECRET_KEY` | Supabase Edge Function secret | Makes the function **require** a valid token. **Until both are set, Turnstile is off** and the function logs a warning on every submission — protection is honeypot + rate limit only. |
| `JLC_NOTIFY_EMAIL` | Supabase secret (optional) | Extra comma-separated recipients for the new-submission email (the MSD distribution address, if there is one). |
| `JLC_IP_SALT` | Supabase secret (optional) | Salt for the stored IP hashes. |
| `JLC_EMAIL_DRY_RUN=1` | Supabase secret | Test mode: emails are written to the function logs instead of sent. **Must not be left on in production.** |

The tab's name lives in one constant, `JLC_TAB_LABEL` in `src/jlcConfig.js`.

### 15.6 The unlisted form

`?page=jlc-report` renders `JlcReportForm.jsx` with the site nav hidden. It is not linked from the landing page, the nav, or any menu, and there is no sitemap. The one exception, added at Brenda's request: a small "City employees: report a facility repair" link below the card on the **Staff Login** screen (`Login.jsx`), which is publicly reachable — so the address is discoverable by anyone who opens that page, and the form's protection rests on the safeguards in §15.4, not on secrecy. It is kept out of search indexes two ways: a `noindex` meta tag set by the component, and an `X-Robots-Tag: noindex, nofollow, noarchive` response header added in `vercel.json` for that exact URL. There is deliberately no status lookup, tracking page, or PIN for this module.

### 15.7 Printing

`PrintJlcRepair.jsx` follows the app's `Print*` convention (browser print / Save as PDF) and mirrors the paper form's labels and order exactly: **Report Request** (Building/Department, Location of the Issue, Date, Problem or Repair Needed, Reported by — pre-filled, with the confirmation number) and **Repair report** (Repairs done by, Description of work done, Date completed, Parts used, Reporter notified of correction on this date, Reporter notified via, with Phone and Email checkboxes). Mode `form` leaves the repair half as ruled blank lines for handwriting; mode `completed` fills both halves. The RSA 91-A disclaimer is in the footer. One report per letter page; bulk "Print Selected" is available for open reports from the list. Each print is recorded in the activity log.

### 15.8 Decisions taken where the plan left an open item

These were unanswered when built; each used the plan's stated default and is easy to change:
1. **New-submission email** goes to MSD only (City Manager and admins see everything in the tab). Add an address via `JLC_NOTIFY_EMAIL`.
2. **Request half is locked** except for admins, every change logged.
3. **Photos**: 5 MB each, images only (JPG, PNG, WEBP, HEIC).
4. **Disclaimer wording** is the plan's draft text, held in `JLC_DISCLAIMER` (`src/jlcConfig.js`) and printed in the footer; the reporter email does not repeat it.
5. **No retention or auto-delete** is built in. Add one only if the City sets a retention rule.
