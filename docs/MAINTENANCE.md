# Maintenance

Recurring technical tasks and known fragile spots. Written for whoever has developer access to this codebase, GitHub, Vercel, and Supabase. See [ARCHITECTURE.md](ARCHITECTURE.md) for the reasoning behind anything referenced here in passing.

## Runs automatically — nothing to do

- Confirmation emails to residents on submission.
- Department assignment/referral notification emails.
- The 3-day silence reminder and 2-week City-Manager escalation (daily, via Vercel Cron → `daily-case-check`).
- Auto-closing a case once every assigned department has closed its own piece.
- MOU/CAR stage-transition emails (`send-confirmation-email`).

## Worth checking periodically

- **Staff accounts.** There is no signup flow or provisioning trigger anywhere in this app — every login is a manual `auth.users` row plus a matching `user_profiles` row, created directly in the Supabase dashboard. When someone joins or leaves a department, this has to be done (or undone) by hand. Nothing will remind you.
- **The Vercel Cron job is still registered.** It's not something that should ever need re-adding on its own, but it's cheap to confirm occasionally with `npx vercel crons ls --project franklin-service-requests-39a5` that the daily check is still scheduled.
- **Department routing map** (`issue_types.default_department_id` / `additional_department_ids`, and `departments` names generally). This is admin-tuned data, not code, and it changes more often than you'd expect — department names have already changed twice (PZA→PZ, Assessing split out of PZA) and issue types get relabeled/added periodically. If a case is routing somewhere unexpected, check the live table before assuming it's a code bug.
- **`DEPARTMENT_EMAIL_OVERRIDES`** in `supabase/functions/_shared/departmentRecipients.ts`. The `Assessing` entry is a hardcoded, one-time snapshot of Fire/Code's roster — it will silently go stale if Fire/Code's staff list changes and nobody remembers to update this file by hand.
- **Test/junk cases, topics, or submissions.** Anything created while testing a feature should be cleaned up so it doesn't skew reports or the public transparency dashboard. This project's own convention for testing risky changes against production is a *temporary* Edge Function (deploy → curl → delete), specifically to avoid leaving stray test data behind — prefer that over creating throwaway rows through the live UI.
- **Dependency updates.** `package.json` currently pins React 19 / Vite 8 / `@supabase/supabase-js` ^2 / `docx` ^9 / `leaflet` + `react-leaflet` / `xlsx`. There's no automated dependency-update tooling (no Dependabot/Renovate config found) and no test suite to catch a breaking upgrade — bump one package at a time and manually retest the areas it touches, especially `docx` (the CAR Word export) and `react-leaflet` (Road Watch's map) since both are narrow, single-purpose usages that would fail silently rather than loudly.
- **API keys/secrets.** If any of `SERVICE_ROLE_KEY`, `BREVO_API_KEY`, or the Supabase anon key ever need rotating (compromise, staff turnover with dashboard access, etc.): generate new values in Supabase, update them in both Supabase's Edge Function secrets *and* Vercel's environment variables, then trigger a redeploy so the new values take effect.

## The CAR module is retired (2026-09-26)

The Council Agenda Report module is hidden, not removed. `src/carConfig.js` exports `CAR_MODULE_ENABLED = false`, which `App.jsx` (and `Landing.jsx`'s homepage cards) gate every CAR nav button and `page` value behind, either directly or transitively through `isCarAdmin`. To bring it back: set `CAR_MODULE_ENABLED = true` and redeploy — no migration, no data restore, nothing else to touch. The database tables, the two Edge Functions (`car-submit`, `car-org-action`), and the one real historical report already in the system (`CAR-2026-1`, filed by Brenda for the 8/31/2026 meeting) are all untouched.

If the module is ever fully deleted instead of just hidden, export `car_submissions`/`meeting_cycles`/`car_activity_log`/`car_reassignment_history` first — that one existing report is real City Council business, not test data, and there's no other copy of it inside this app.

## The MOU module is retired (2026-09-29)

Same pattern as CAR, above — hidden, not removed, because it's no longer in use. `src/mouConfig.js` exports `MOU_MODULE_ENABLED = false`, which `App.jsx` (and `Landing.jsx`'s homepage cards) gate every MOU nav button and `page` value behind directly. To bring it back: set `MOU_MODULE_ENABLED = true` and redeploy — no migration, no data restore, nothing else to touch. The database tables, the two Edge Functions (`mou-submit`, `mou-org-action`), and the one real submission already in the system (`MOU-2026-1`, Community Action Partnership Belknap-Merrimack Counties' Head Start Program, sitting at `missing_information` — confirmed dead, not something to follow up on) are all untouched.

If the module is ever fully deleted instead of just hidden, export `mou_submissions`/`mou_submission_field_values`/`mou_activity_log` first regardless — even a dead proposal is a record of a real interaction with an outside organization.

## JLC Facility Repair module (internal-only) — setup and upkeep

See [ARCHITECTURE.md §15](ARCHITECTURE.md#15-jlc-facility-repair-report-module-internal-only) for how it works. What needs attention:

- **Turn on Cloudflare Turnstile (not done yet).** The module needs keys that only the City can create. In Cloudflare, create a Turnstile widget for the production domain, then set `VITE_TURNSTILE_SITE_KEY` in Vercel (and redeploy) and `TURNSTILE_SECRET_KEY` as a Supabase Edge Function secret (`npx supabase secrets set TURNSTILE_SECRET_KEY=...`). **Until both are set the public form is protected only by the hidden honeypot field and the per-IP rate limit**, and the `jlc-submit` function logs a warning on every submission. Because the form has no login and its URL is the only gate, do this before the address is widely circulated.
- **Decide who gets the new-submission email.** Today it goes to everyone on MSD's roster (looked up the same way as case notifications). If MSD has a shared distribution address, add it (comma-separated) as the `JLC_NOTIFY_EMAIL` secret. The City Manager's Office currently just sees reports in the tab.
- **`JLC_EMAIL_DRY_RUN` must not be set in production.** It exists for testing (emails are written to the function logs instead of sent). If staff say they aren't getting the MSD notice, check `npx supabase secrets list` for it.
- **Brevo is the only email path**, as everywhere else — if the MSD or confirmation emails stop arriving, check the Brevo account first. A failed email never blocks a submission, so check the `jlc-submit` logs if reports exist but no email was seen.
- **Rate limit** (20/hour and 100/day per hashed IP, in `jlc-submit`): City Hall's staff share one outbound IP, so these are generous on purpose. If legitimate staff are ever told "Too many submissions from this location," raise `RATE_LIMIT_PER_HOUR` in the function. The `facility_repair_rate_limits` table cleans itself (rows older than 3 days are deleted on each submission).
- **Staff access is by login role, not by list.** A new MSD employee sees the tab as soon as their `user_profiles` row has `department` = MSD; a City Manager's Office person needs the `admin` role (there is no City Manager department login today). Removing someone's profile removes their access.
- **Buildings are data, not code.** Add/edit/archive them from the **Manage Buildings** screen; if a new City building should appear in the form, no deploy is needed.
- **No retention or auto-delete exists.** These are RSA 91-A-disclosable records and nothing is purged. Photos accumulate in the private `jlc-facility-repair` bucket; if the City sets a retention rule, it needs to be built (delete the database rows and use the Storage API for the files — deleting `storage.objects` rows with SQL leaves the files behind).
- **Security regression check after any change to this module's tables, policies, or storage:** as the anon key, confirm `select`/`insert`/`update`/`delete` on all six `facility_repair_*` / `city_facilities` tables and storage list/sign on `jlc-facility-repair` are refused (they should return `401 permission denied`), and re-run Supabase's security advisor. The module's security rests on `anon` having **no** grants — avoid broad `GRANT ... TO anon` or "grant all on all tables" statements in future migrations.
- **Known limitation:** the form checks that the email *ends in* `@franklinnh.gov`, not that the person actually owns it. If abuse ever appears, add email verification.

## Known issues / technical debt

These are real, currently-live inconsistencies — not bugs severe enough to have blocked shipping other work, but worth knowing about before you touch anything nearby:

- **"Escalated to CM" filter vs. the Escalated Cases Report use different definitions.** The Admin Dashboard's quick filter checks "has `escalated_at` ever been set" (never cleared once true). The Escalated Cases Report checks "is still actively escalated" (no real movement since `escalated_at`). These will show different case counts and that's expected given the current code — see ARCHITECTURE.md §5.2. Reconciling them (probably by porting the stricter logic into the dashboard filter) is a reasonable future improvement, not something either screen is currently trying to hide.
- **The follow-up-date grace period only exists in `daily-case-check`.** `AdminDashboard.jsx`'s accountability table and `DepartmentDashboard.jsx`'s "Needs Update" banner don't yet respect `cases.followup_due_date` the way the email job does — a case inside a legitimate waiting period can still show as needing attention on-screen even though no email will fire for it.
- **`case_audit_log.action` text is parsed by regex in two different places** (`PrintEscalatedCasesReport.jsx` and `supabase/functions/department-performance/index.ts`). Changing the exact wording `CaseDetail.jsx`/`SubmitForm.jsx` write to that log (e.g. "Assigned to X", "X status changed from "A" to "B"") will silently break both features with no test to catch it. Grep for `ASSIGNED_TO_RE`/`AUTO_ASSIGNED_RE`/`REFERRED_TO_RE`/`DEPT_STATUS_RE` and `findStatusChangeAuditEntry` before changing any audit-log message wording.
- **`details_91a.followup_due_date` is a dead column** — it exists in the schema but nothing reads or writes it. The real 91-A follow-up date is `cases.followup_due_date` (the same generic column every case type uses). Don't build a feature assuming the `details_91a`-specific column does anything.
- **`hours_worked`/`hours_worked_closed` on a 91-A case are manual, `tax_dollar_spent` is automatic** — an easy thing for staff (or a future feature) to assume works the same way it doesn't.
- **CAR's `agenda_position` column is never written**, so agenda/packet ordering always falls back to `created_at` even though the print views are written to sort by `agenda_position` first. If ordering ever needs to be admin-controllable, this column is already there waiting to be wired up.
- **`car_status` values `under_review`, `packet_published`, and `decided_at_meeting` are effectively unreachable** by any normal transition — a submission's own status tops out at `included_in_packet`; only the *cycle's* separate status ever reaches the later-sounding values, with no cascade down to its submissions.
- **`mou_template_sections.allow_section_comment`** is saved by the template builder but never read anywhere downstream — either a half-finished feature or dead config; confirm intent before building on it.
- **MOU's `ready_for_council` stage is gated by stage only, not reviewer role** — any admin (not just Brenda or the City Manager) can schedule the Council date and record the final Approved/Denied decision at that stage, unlike every earlier stage which is gated to those two specific people. This may be intentional (someone needs to be able to act if one of the two named reviewers is unavailable) but it's worth confirming that's the intended behavior rather than an oversight.
- **`VITE_RSEND_API_KEY`** sometimes appears in a local `.env.local` but is referenced nowhere in the code — almost certainly a dead leftover from an earlier email-provider experiment (Brevo is what's actually used, via a server-side-only secret). Safe to remove from a `.env.local` if you find it, and don't treat its presence/absence as meaningful.
- **Pre-launch data has unreliable timestamps.** Anything in `cases`/`case_departments` from before the app's real launch (bulk-imported from whatever the City used previously) can show impossible or same-instant assignment/close timestamps on those tables directly. Reporting/performance features work around this by reconstructing timing from `case_audit_log` instead, which has trustworthy timestamps for everything created through the app itself — but any *new* reporting feature should follow that same pattern rather than trusting `cases.closed_date`/`case_departments.created_at` at face value for older cases.
- **Foreign, unused tables live in the same Supabase project.** A `complaints`/`complaint_*` table and enum set (an apparently unrelated internal HR tool) exists in this project with zero references anywhere in this codebase. Don't accidentally migrate, query, or document these as part of this app — see ARCHITECTURE.md §14.

## Things that require a developer (not available from any screen)

- Any code change — new features, bug fixes, UI/copy changes.
- Database schema changes (new columns/tables) — via `supabase/migrations/*.sql` + `npx supabase db push`.
- Editing or deploying an Edge Function — `npx supabase functions deploy <name>`. Remember this is a **separate manual step** from a normal `git push`; pushing to GitHub only redeploys the frontend.
- Rotating API keys/secrets.
- Creating or removing a staff login (§ above).
- Editing the department/issue-type routing map, or the `DEPARTMENT_EMAIL_OVERRIDES` snapshot.
