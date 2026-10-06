# Build Plan: Joint Loss Committee (JLC) Facility Repair Report Module

**Target app:** Franklin Service Request System / OneFranklin (React + Vite + Supabase + Vercel)
**Audience for this doc:** Claude Code, building inside the existing repo. Inspect the existing codebase first (auth/roles, email sending, file attachments, routing, print styles, activity-log pattern from the MOU module) and reuse those patterns rather than inventing new ones.

---

## 1. Purpose and hard boundaries

An **internal-only intake and repair log** for problems with City-owned buildings and property occupied by City employees (broken step, broken lock, flashing smoke detector light, etc.). It supports the Joint Loss Committee and replaces a paper form.

- Reported 100% by City employees. This is **not** a service request and must never appear alongside service requests.
- **Separate module with its own tables.** Do NOT store these in the `cases` table or any table that feeds public analytics, Road Watch, public search, exports, or public dashboards.
- Auto-assigned to MSD. No reassignment, ever.
- Some reports may describe security/safety weaknesses (e.g. a broken lock on a City building). **Nothing about these reports may be publicly visible or queryable.**
- Statuses: **Open** or **Completed** only. No reminders, no escalation, no SLA timers.

## 2. Naming

- Public form title: **Facility Repair Report**, subtitle "Joint Loss Committee".
- Internal tab: **JLC Facility Repairs** (must be clearly distinct from Service Requests; keep the name in one config constant so it is easy to change).

## 3. Data model (new Supabase tables)

### `city_facilities`
Admin-managed lookup of buildings/properties.
- `id`, `name`, `address`, `is_active` (soft-delete/archive; never hard-delete once referenced), `created_at`
- Seed with:
  | Name | Address |
  |---|---|
  | Police Station | 5 Hancock Terrace |
  | Proulx Community Center | 124 Memorial St |
  | City Hall | 316 Central St |
  | Public Library | 310 Central St |
  | Fire Station | 59 W Bow St |
  | MSD | 43 W Bow St |
  | Bessie Rowell Community Center | 12 Rowell Dr |
- Public form dropdown = active facilities + a final **"Other city building"** option. If "Other" is chosen, show a required free-text field for the building/property name.
- Internal admin UI (MSD, City Manager, Admin roles) to **add a building (name + address)**, edit, and archive.

### `facility_repair_reports`
Request half (submitted via public form):
- `id`, `confirmation_number` (unique, e.g. `JLC-2026-0001`, generated from a DB sequence, year-prefixed)
- `facility_id` (nullable if "Other"), `facility_other_name` (text, required when facility is Other)
- `department` (text, required, the "Building/Department" field on the paper form: which department/office the reporter is in)
- `issue_location` (text, required: specific spot, e.g. "back stairwell, 2nd floor")
- `reported_date` (date, defaults to today, server-set)
- `problem_description` (text, required)
- `reported_by_name` (text, required)
- `reporter_email` (text, required, `@franklinnh.gov` only, see section 4)
- `reporter_phone` (text, optional)
- `submitted_at` (timestamptz, server-set)

Repair half (entered internally; **all six required to mark Completed**):
- `repaired_by` (text)
- `work_description` (text)
- `completed_date` (date)
- `parts_used` (text; allow an explicit "None" entry)
- `reporter_notified_date` (date)
- `reporter_notified_via` (enum: `Phone` | `Email`)

Status/meta:
- `status` (`open` | `completed`, default `open`)
- `completed_by_user_id`, `completed_logged_at`

Enforce "all six required to complete" at the **database level** (CHECK constraint or trigger), not just in the UI.

### `facility_repair_attachments`
- `id`, `report_id`, `storage_path`, `file_name`, `file_size`, `content_type`, `uploaded_at`
- **Max 3 per report. Max 5 MB each. Images only** (jpg, png, heic/webp if the existing attachment code supports them). Enforce server-side (edge function / storage policy), not only in the browser.
- **Private storage bucket**, with access only through signed URLs issued to authorized internal users.

### `facility_repair_activity_log`
Field-level audit log, same pattern as the MOU module: who, what field, when, old value, new value. Log creation, every edit, status change, attachment add/remove, and printing events if cheap to do.

## 4. Public intake (no login)

- Standalone route (e.g. `?page=jlc-report`), **not linked from public landing pages, public menus, or the sitemap**. Add `noindex` meta. (It can be linked from internal/employee areas later at Brenda's discretion.)
- **Form fields:** building (dropdown), other-building name (conditional), department, specific location, problem description, reported by, email (required), phone (optional), up to 3 photos.
- **Email domain rule:** reporter email must end in `@franklinnh.gov`. Case-insensitive, exact domain match (reject lookalikes such as `franklinnh.gov.example.com` or subdomains unless told otherwise). If not, show this exact error: **"Repair reports can only be submitted by city employees."** Validate client-side for UX **and** server-side in the edge function (client-only validation is bypassable).
- **Disclaimer** (visible above the submit button, always): *"Information submitted through this form is a government record and may be subject to disclosure under RSA 91-A, the New Hampshire Right-to-Know Law."* Also print it in the footer of the printed form. Brenda may want to adjust the wording.
- **Submission path:** anonymous users get **INSERT only through an edge function/RPC**, no direct table access. The function validates everything, enforces attachment limits, assigns the confirmation number, writes the log entry, and sends the emails. **Anonymous users have no SELECT access to any of these tables or the storage bucket.**
- **Spam protection** (no login means the URL is the only gate): Cloudflare Turnstile (or the CAPTCHA already used in the app), a honeypot field, and rate limiting per IP.
- **Confirmation screen:** shows the confirmation number and "Your report has been received." No promise of follow-up, no status lookup, no tracking page, no PIN. (This module deliberately does NOT use the PIN pattern.)
- **Confirmation email** to the reporter: confirmation number and a note that a facility repair report was submitted. **Do not include the problem description or location in the email.** State that there is no guarantee of follow-up.
- **Known limitation to note in code comments:** the domain check confirms the format of the address, not that the person owns it. The Turnstile, rate limit, and the fact that the form is unlisted are the practical safeguards. Email-verification is a possible future hardening step.

## 5. Internal side

- New nav tab **JLC Facility Repairs**, visible only to roles: **MSD, City Manager, Admin**. Hide the route and enforce at the data layer with RLS (do not rely on hiding the tab). Reuse the existing role system.
- **List view:** confirmation number, building, location, reported date, reported by, status, days open. Filters: status (default Open), building, date range. Search by confirmation number/name.
- **Detail view:** request half on top (read-only after submission unless Brenda decides otherwise; see open items), repair report form below.
- **Repair report form:** all six fields required. The "Mark Completed" action is disabled/errors until every field is filled. MSD assistant can either log the repair directly or enter what the MSD staff member who did the work reported.
- **No reassignment controls.** No reminders. No escalation emails.
- **Notifications:** on each new submission, email the MSD distribution address (see open items for the address). City Manager and Admin users see everything in the tab. **No automatic emails to reporters on repair or closure.** Notifying the reporter is a manual step by MSD, documented via the required `reporter_notified_date` / `reporter_notified_via` fields.
- Admin screen for managing buildings (add name + address, edit, archive).

## 6. Printing

- **Print view that mirrors the paper form**, letter size, print-optimized CSS (hide app chrome, no color dependence, black on white):
  - **Top half, "Report Request":** Building/Department, Location of the Issue, Date, Problem or Repair Needed, Reported by. Pre-filled from the submission. Include the confirmation number.
  - **Bottom half, "Repair report":** Repairs done by, Description of work done, Date completed, Parts used, Reporter notified of correction on this date, Reporter notified via (Phone / Email, shown as checkboxes). **Left blank with ruled lines** for handwriting.
  - Footer: RSA 91-A disclaimer.
- **Second print mode (completed records):** both halves filled in.
- Print button on the detail view (internal users only), and a bulk "print selected open requests" option from the list view if it is inexpensive to add.
- Printed copies must keep the paper form's field labels and order exactly as listed above.

## 7. Security and acceptance checks (do before calling it done)

1. As an anonymous user, confirm via the Supabase API that **none** of the four new tables or the storage bucket can be selected, listed, counted, or updated.
2. Confirm nothing from this module appears in public analytics, Road Watch, public search, any CSV/PDF export meant for public use, or any public API route.
3. Confirm a logged-in user without MSD/City Manager/Admin roles cannot see the tab or query the data.
4. Confirm server-side rejection of: non-`@franklinnh.gov` emails, more than 3 attachments, files over 5 MB, non-image files, and attempts to set status/repair fields from the public endpoint.
5. Confirm a report cannot be set to Completed unless all six repair fields are filled (DB-level).
6. Confirm the confirmation email contains no problem details.
7. Confirm the print view matches the paper form (top filled, bottom blank) on a real print/PDF preview.
8. Confirm the activity log records edits with old/new values.

## 8. Open items (confirm with Brenda before or during build)

1. **Who gets the new-submission email?** Need the MSD distribution address. Should the City Manager's Office also get an email per submission, or only see it in the tab? (Default if unanswered: MSD email only.)
2. **Can MSD correct the request half after submission** (e.g., a wrong building)? Default: locked, except admins, with every change in the activity log.
3. **Photo file types/size:** assumed 5 MB each, images only. Adjust if needed.
4. **Disclaimer wording:** confirm final text.
5. **Records retention:** no retention or auto-delete is built in. Add only if the City sets a retention rule.

## 9. Suggested build order

1. Migrations: tables, sequence, constraints, RLS, storage bucket and policies, seed facilities.
2. Edge function for public submission (validation, number, log, emails, attachment limits).
3. Public form and confirmation screen.
4. Internal list/detail and repair-report form with completion enforcement.
5. Building admin screen.
6. Print views.
7. Security/acceptance checks (section 7).
