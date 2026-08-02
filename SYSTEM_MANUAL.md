# Franklin Service Request System — System Manual

This document explains what this system is, how it works, and how to keep it running. It's written for someone managing the system day-to-day, not for a software developer — technical terms are explained the first time they come up.

**Last updated:** August 2026

---

## Table of Contents

1. [What This System Is](#1-what-this-system-is)
2. [The Tech Stack, in Plain Terms](#2-the-tech-stack-in-plain-terms)
3. [The Data Model](#3-the-data-model)
4. [How Deployment Works](#4-how-deployment-works)
5. [Admin Dashboards and Roles](#5-admin-dashboards-and-roles)
6. [Environment Variables & Where Secrets Live](#6-environment-variables--where-secrets-live)
7. [Routine Maintenance](#7-routine-maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What This System Is

The Franklin Service Request System is the City of Franklin, NH's website for residents to report problems — potholes, code violations, trash complaints, Right-to-Know (RSA 91-A) requests, and more — and for city staff to track and resolve them.

**Who uses it:**

- **Residents** (the public) — submit requests, look up the status of a request they already made, browse a live map of road issues, and view city-wide statistics. No login needed.
- **Department staff** (MSD, Fire/Code, PZA, Police/Prosecutor, Finance, Human Resources, Legal, Parks & Rec, IT, City Manager) — log in to see cases assigned to their department, update statuses, post public updates, and see performance stats for their own department.
- **Admin** (the City Manager's Office — currently Brenda Demers) — sees everything: every case, every department's dashboard, city-wide reports, and manages the separate "Public Comment" feature used for public hearings.

**The core workflow:** a resident submits a request → the system automatically routes it to the right city department based on what kind of issue it is → that department works the case and updates its status → once every department assigned to a case has closed their part, the case closes automatically and the resident gets an email. Along the way, the system sends reminder emails if a case goes quiet for too long, and escalates to the City Manager's Office if a department hasn't touched a case in two weeks.

---

## 2. The Tech Stack, in Plain Terms

| Piece | What it does | Analogy |
|---|---|---|
| **React** | Builds the actual web pages/screens residents and staff interact with | The building's interior — rooms, furniture, what you see and click |
| **Vite** | Packages the React code into files a browser can load, and runs a preview server while developing | The construction tool that assembles the building from blueprints |
| **Supabase** | The database, user accounts/login, file storage, and small bits of backend logic ("Edge Functions") | The building's foundation, plumbing, and utility closets — all the invisible infrastructure |
| **Vercel** | Hosts the website itself and runs the one scheduled background job | The building's actual street address — where visitors go to reach it |
| **Brevo** | Sends every email the system sends (confirmations, reminders, escalations) | The mail room |

**How they fit together, for one example (a resident submitting a request):**

1. The resident's browser loads the React app from **Vercel**.
2. They fill out the form; the app talks directly to **Supabase** to save the new case, look up which department it belongs to, and generate a case number.
3. The app asks a small piece of Supabase server-side code (an "Edge Function") to send the confirmation email; that function calls out to **Brevo**, which actually delivers it.
4. Once a day, **Vercel** automatically wakes up a scheduled job (a "Cron Job," explained more in [Section 7](#7-routine-maintenance)) that asks Supabase to check every open case for silence or overdue escalation, again using Brevo to send any emails needed.

The website itself is a **single-page app**: there's really one webpage, and React swaps what's shown on it (the submission form, a case detail view, a dashboard) without ever fully reloading the browser tab.

---

## 3. The Data Model

Everything lives in **Supabase**, which is a hosted Postgres database (a standard, industry-common type of database) plus some extras layered on top (login accounts, file storage, Edge Functions).

### Core case-tracking tables

| Table | What it stores |
|---|---|
| **cases** | One row per service request. Case number, resident's name/email/phone (optional), location, description, which issue type it is, the master (overall) status, submission date, closed date, and a handful of Right-to-Know (91-A) related flags. |
| **case_departments** | One row per (case, department) pairing. A case can have more than one department on it (see "referrals" below). Tracks that department's own status, when they were assigned, and when they closed their part. |
| **departments** | The 10 city departments: MSD, Fire/Code, PZA, Police/Prosecutor, Finance, Human Resources, Legal, Parks & Rec, IT, City Manager. |
| **issue_types** | The 14 categories a resident can pick when submitting (Pothole, Code Violation, Right to Know Request, etc.), each with a `default_department_id` that controls automatic routing. |
| **statuses** | The status options a case (or a department's part of a case) can be in — Received, In Progress, Closed, Referred to Another Department, and several Right-to-Know-specific ones. Each status is flagged `is_closing` (does picking it count as "done") and `is_91a_only` (only usable on Right-to-Know cases). |
| **case_audit_log** | A running, plain-English history of everything that's happened to a case ("Assigned to MSD," "Status changed from X to Y") with a timestamp for each entry. This is the single most reliable record of *when* things actually happened. |
| **case_comments** | Public-facing updates/comments staff post on a case — residents can see these. |
| **internal_notes** | Private staff-only notes — residents never see these. |
| **case_files** | Metadata for uploaded attachments (photos, documents); the actual files live in Supabase's file storage in a bucket named `case-files`. |
| **case_time_log** | Staff time entries logged against Right-to-Know requests, used to calculate the $ cost of fulfilling a records request. |
| **details_91a** | Extra fields specific to Right-to-Know (RSA 91-A) requests — records ready date, delivery method, fees, etc. |
| **requestor_registry** | Matches up submissions from the same resident (by name) so repeat requesters get a consistent ID across multiple cases. |

### Staff accounts

| Table | What it stores |
|---|---|
| **user_profiles** | Sits on top of Supabase's built-in login system. One row per staff login, storing their `role` (`admin` or `department`) and, for department accounts, which `department_id` they belong to. This is what determines what a logged-in user can see. |

### Other public-facing features

| Table | What it stores |
|---|---|
| **road_votes** | Resident votes/prioritization on road issues shown on Road Watch. |
| **topics**, **topic_positions**, **comments**, **comment_questions**, **concern_themes**, **comment_concern_themes** | The "Public Comment" module — a separate feature for collecting structured public input ahead of City Council hearings. Topics are the subjects up for comment; residents pick a "position" (For/Against/etc.), write a comment, and optionally flag concerns. Admin reviews and approves/rejects comments before they go public. |

### A note on data history

Some of the oldest tables (`cases`, `case_departments`, `departments`, `issue_types`, `statuses`, and several others) were created directly in the Supabase dashboard before this project started tracking schema changes as files ("migrations," in `supabase/migrations/`). Anything from before the system's real launch in June 2026 was bulk-imported from whatever the city used previously, and — importantly — **that bulk-imported data does not have reliable assignment/closure timestamps.** Anything created through the app itself, from June 2026 onward, does. This matters a lot when reading any performance/timing report — see [Section 8](#8-troubleshooting) for what that looks like in practice.

---

## 4. How Deployment Works

**"Deployment" just means: getting a code change from a developer's computer onto the live, public website.**

```
Developer's computer  →  GitHub  →  Vercel  →  Live website
                                 ↳ Supabase (migrations & Edge Functions — separate, manual step)
```

- **GitHub** (`github.com/rtk-cof-316/franklin-service-requests`) holds the official copy of all the code. Every change is recorded there permanently — nothing is ever truly lost, since old versions stay in the history forever.
- **Vercel** is connected to that GitHub repository. Every time new code is pushed to the `main` branch, Vercel automatically:
  1. Builds the website (turns the React code into the files a browser can load)
  2. If the build succeeds, publishes it live at **franklin-service-requests-39a5.vercel.app**
  3. If the build fails, the *old* version stays live — a broken build never takes the site down.
- This whole process (push → build → live) usually takes under a minute.

**Supabase is separate and does *not* auto-deploy.** Database changes (migrations) and Edge Function updates have to be pushed to Supabase manually, using a command-line tool, whenever they're made. If someone tells you "I pushed the code," that covers the website — it does not necessarily mean the database or backend functions changed too.

**The one scheduled background job:** Vercel Cron runs `/api/daily-case-check` once a day at 12:00 UTC (roughly 8am Eastern, shifts slightly with daylight saving). That's a thin relay: it just calls the real logic, which lives in Supabase as the `daily-case-check` Edge Function, and which sends the 3-day silence reminders and 2-week escalation emails.

---

## 5. Admin Dashboards and Roles

There are three kinds of visitor:

### Public (no login)
- **Submit a Request** — the intake form
- **Check Status** — look up a case by number
- **Road Watch** — live map + stats on road-related issues, plus voting/prioritization
- **City Analytics** — city-wide public statistics
- **Public Comment** — browse open topics and submit structured comments ahead of hearings

### Department staff (`role = department`)
Log in via **Staff Login** with an email/password set up by the admin. After logging in, they see:
- **My Cases** — every case assigned to their department, with filters for open/closed/"needs a public update"
- A **Department Performance** panel: their case volume this year, typical resolution time (with a citywide comparison), how often they post public updates, a status breakdown, and (if relevant) a note if their caseload and resolution time both look worse than average
- The ability to update their department's status on a case, post public comments, add private notes, and **refer** a case to a different department (which is now mandatory to specify a target department for, and notifies that department automatically)
- A **Change My Password** option

A department account can only see and act on cases assigned to their own department — they cannot see or touch other departments' cases.

### Admin (`role = admin`)
Everything a department account can do, plus:
- **Admin Dashboard** — every case, city-wide, with full filtering/search, the ability to assign/reassign departments, edit the master case status, manage Right-to-Know (91-A) specific fields, and print work orders/case detail sheets
- **Departments** — a picker to view *any* department's dashboard (same view department staff see, read-only — no password-change option shown)
- **Public Comments** — manage topics (create/close them) and moderate submitted comments (approve/reject before they go public)
- Two export buttons on the Admin Dashboard:
  - **Export Report for City Manager** — a printable summary report
  - **Export Case Timeline for Review** — a raw spreadsheet (.xlsx) with every case/department assignment and closure timestamp, for manually reviewing and spot-checking data quality

**Adding a new staff login:** this has to be done directly in the Supabase dashboard — create the user under Authentication, then add a matching row in the `user_profiles` table with the right `role` and (for department accounts) `department_id`. There's no in-app "create account" screen.

**Auto-logout:** any logged-in session automatically signs out after 10 minutes of no activity (mouse movement, clicks, scrolling, or key presses all count as activity).

---

## 6. Environment Variables & Where Secrets Live

"Environment variables" are settings and credentials the app needs to run, kept *out* of the code itself (so they're not visible to anyone browsing GitHub, and so the same code can point at different databases/keys in different situations).

### On the developer's computer (`.env.local` — never committed to GitHub)
| Variable | What it's for |
|---|---|
| `VITE_SUPABASE_URL` | The address of the Supabase project |
| `VITE_SUPABASE_ANON_KEY` | A public-safe key the browser uses to talk to Supabase (safe to expose — access is still controlled by database-level security rules) |
| `VITE_RSEND_API_KEY` | An email-related key (legacy; Brevo is what's actually used for sending now) |

### On Vercel (Project Settings → Environment Variables)
The same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` need to also be set here, since Vercel builds the site independently of anyone's local computer.

### In Supabase (Project Settings → Edge Functions → Secrets)
These are only usable by server-side code (Edge Functions) — never sent to a browser:

| Secret | What it's for |
|---|---|
| `SERVICE_ROLE_KEY` | A fully-privileged database key. Lets Edge Functions bypass normal access rules — used for anything that needs to read/write across all departments (daily reminders, escalations, performance stats, exports) |
| `BREVO_API_KEY` | Lets Edge Functions send email through Brevo |
| `SUPABASE_URL` | Same project address, available to server-side code |
| A few others (`GMAIL_USER`/`GMAIL_PASSWORD`, `RESEND_API_KEY`) | Left over from earlier/alternate email setups; Brevo is the one actually in use |

**If credentials ever need to be rotated** (a key is compromised, someone leaves, etc.): generate new keys in the Supabase dashboard, update them in both Supabase's Edge Function secrets *and* Vercel's environment variables, then trigger a new deployment (any small commit, or Vercel's "Redeploy" button) so the new values actually take effect.

---

## 7. Routine Maintenance

**Things that run automatically — no action needed:**
- Confirmation emails to residents on submission
- Department assignment/referral notification emails
- 3-day silence reminders and 2-week escalation emails (daily, via Vercel Cron)
- Auto-closing a case once every assigned department has closed their part

**Things worth checking periodically:**
- **Staff accounts** — when someone joins/leaves a department, add/remove their login and `user_profiles` row (Supabase dashboard, see [Section 5](#5-admin-dashboards-and-roles)).
- **The Vercel Cron job is still registered** — occasionally worth confirming via `npx vercel crons ls --project franklin-service-requests-39a5` that the daily check is still scheduled (it's not something that should ever need re-adding, but it's cheap to confirm).
- **Test/junk cases** — anything created while testing a feature should be cleaned up from the Admin Dashboard so it doesn't skew reports or public statistics.
- **Department routing map** — if the city adds a new issue type or reorganizes which department handles what, `issue_types.default_department_id` needs to be updated (a database change, not something available in the UI yet).
- **Reviewing the Case Timeline export periodically** — especially for anything closed from June 2026 forward, to catch any case that isn't getting properly tracked before it becomes "old data" nobody can fix.

**Things that require a developer:**
- Any code change (new features, bug fixes, UI changes)
- Database schema changes (new columns/tables)
- Rotating API keys/secrets
- Adding a new Edge Function or changing what an existing one does

---

## 8. Troubleshooting

### "A resident says the form fields are dark/hard to read on their phone"
**Cause:** some Android phones and browsers force a site-wide dark mode. Early on, the site's CSS told browsers "this page supports both light and dark mode," which caused unstyled form fields to get a dark background while their text stayed dark too — unreadable.
**Fix (already applied):** `src/index.css` was changed from `color-scheme: light dark` to `color-scheme: light`, telling every browser to render the page in light mode regardless of the device's system setting. If this ever resurfaces (e.g. after a redesign touches that file), that's the first thing to check.

### "The Resolution Time / performance numbers on a department's dashboard look wrong"
This has come up before and the root cause is almost always **data age, not a bug**. A few things to know:
- Anything closed **before June 2026** was bulk-imported and its recorded timestamps are not reliable — some show impossibly short (same-instant) or even negative durations.
- The system now reconstructs timing from the **audit log** (`case_audit_log`), which has real, trustworthy timestamps for when a case was assigned to a department and when that department closed it — but only for cases that went through the app for their full lifecycle.
- If a number still looks wrong, use the **Export Case Timeline for Review** button (Admin Dashboard) — it shows, side by side, the raw database timestamps, what the audit log independently says, and flags (`*_dates_consistent: false`) any row where the dates are chronologically impossible, plus how many departments are on a given case (a case with 2+ departments will appear as 2+ rows, which is normal, not duplicated data).

### "A public update / status change isn't showing up for a resident"
Check whether it was posted as a **public comment** (visible to residents) vs. an **internal note** (staff-only, intentionally hidden). These look similar in the case detail view but are stored — and shown — completely differently.

### "A case seems stuck with no department assigned"
Check what issue type was selected — if it's **Noise / Nuisance / Animal / Crime**, that's intentional: residents are blocked from submitting that category at all and redirected to the police non-emergency line, so it will never show a department. For any other issue type, every one currently maps to a department automatically; if a case is missing one anyway, it likely predates the auto-routing system (any case created before this feature shipped had to be assigned manually) or the `issue_types.default_department_id` mapping needs a database fix.

### "Vercel deployment succeeded but the site doesn't look updated"
Hard-refresh the browser (Ctrl+Shift+R / Cmd+Shift+R) — browsers cache the site aggressively. If that doesn't help, confirm the production alias actually points at the newest deployment (`npx vercel ls franklin-service-requests-39a5` and check which deployment is aliased) — very rarely a deploy can succeed without the alias updating.

### "Emails aren't sending"
Almost always a Brevo issue, not a code issue — check the Brevo account dashboard for delivery failures, a paused/suspended account, or a hit sending limit before assuming the code is broken.

### "I need to change something and I'm not a developer"
Anything described in [Section 7](#7-routine-maintenance) as "requires a developer" needs someone with access to the code, GitHub, and the Supabase/Vercel dashboards. Routine staff-account changes and reviewing exports don't require that — they're just a matter of knowing where to click, covered in Sections 5–7 above.
