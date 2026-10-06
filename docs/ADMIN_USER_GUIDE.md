# Admin User Guide

This guide is written for the person running the Franklin Service Request System day-to-day — no coding knowledge assumed. Every button, field, and label below is written exactly as it currently appears on screen. If something here doesn't match what you're seeing, the app may have changed since this was written — let your developer know so this guide can be updated.

## Contents

1. [Logging in](#1-logging-in)
2. [The screens you'll use](#2-the-screens-youll-use)
3. [How a case enters the system](#3-how-a-case-enters-the-system)
4. [Triaging and routing a case](#4-triaging-and-routing-a-case)
5. [Working a case: the Case Detail page](#5-working-a-case-the-case-detail-page)
6. [Reassigning, referring, and closing a case](#6-reassigning-referring-and-closing-a-case)
7. [The Admin Dashboard](#7-the-admin-dashboard)
8. [Department dashboards](#8-department-dashboards)
9. [Right-to-Know (RSA 91-A) requests](#9-right-to-know-rsa-91-a-requests)
10. [Reports](#10-reports)
11. [The escalation process — when a department goes quiet](#11-the-escalation-process--when-a-department-goes-quiet)
12. [Public Comment](#12-public-comment)
13. [MOUs — retired](#13-mous-retired)
14. [CARs (Council Agenda Reports) — retired](#14-cars-council-agenda-reports-retired)
15. [Adding or removing a staff login](#15-adding-or-removing-a-staff-login)
16. [JLC Facility Repairs](#16-jlc-facility-repairs)

---

## 1. Logging in

Click **Staff Login** in the top-right corner of any public page. Enter your email and password and sign in. There is no "create account" option on this page — every staff login has to be set up ahead of time (see [§15](#15-adding-or-removing-a-staff-login)).

Once you're logged in, a second row of buttons appears under the main navigation — this is your "Staff Tools" row. As the admin, you'll see: **Admin**, **Departments**, **Public Comments**, **JLC Facility Repairs** (see [§16](#16-jlc-facility-repairs)).

> **Note:** an **MOUs** button and a **CARs** button used to appear here. Both modules have since been retired (MOU on 2026-09-29, CAR on 2026-09-26 — see [§13](#13-mous-retired) and [§14](#14-cars-council-agenda-reports-retired)), so those buttons, their public submit/status links, and their homepage cards are all gone from the live site now.

**You'll be automatically signed out after 10 minutes of no activity** (no mouse movement, clicks, scrolling, or typing). This is intentional and not a bug — if it happens mid-task, just log back in.

To sign out on purpose, click **Log Out** in the top-right corner.

## 2. The screens you'll use

| Button | Takes you to |
|---|---|
| **Admin** | The Admin Dashboard — every case, city-wide (§7) |
| **Departments** | A picker to view any single department's own dashboard, read-only (§8) |
| **Public Comments** | Manage topics and moderate comments (§12) |
| **JLC Facility Repairs** | Internal facility repair reports from City employees (§16) — admins, MSD, and City Manager's Office only |

## 3. How a case enters the system

A resident fills out **Submit a Request** (no login needed). They pick an **issue type** from a dropdown — this single choice is what decides which department the case goes to. As of this writing, the issue types and where each one goes:

| Issue type | Goes to |
|---|---|
| Pothole, Crack / Pavement, Drainage, Heave, Plowing / Sanding, Public Property / Structure, Signage (incl. Message Board) / Traffic, Trash / Sanitation, Water / Utility | MSD |
| Health or Building Code Violation | Fire/Code |
| Zoning /Land Use Violation | PZ |
| Property Assessment / Valuation | **Both** Assessing and Fire/Code |
| Website / Communications | IT |
| Right to Know Request, Other | City Manager |
| Noise / Nuisance / Animal / Crime | *(blocked — the resident is redirected to the police non-emergency line instead of being allowed to submit)* |

This table reflects real settings that get adjusted from time to time as workflows change — if a case doesn't seem to be going where you expect, that's the first thing worth double-checking (this is configured in the database, not something you can change from a screen yet).

A case can also be checked as a **Right-to-Know request (RSA 91-A)** — that's a separate checkbox from the issue type, and it triggers its own extra fields and workflow (see [§9](#9-right-to-know-rsa-91-a-requests)).

The moment a case is submitted, it's automatically assigned to the right department (or departments) and that department gets a notification email — you don't have to manually route a normal case.

## 4. Triaging and routing a case

Most cases route themselves. You'd step in to manually change routing when:
- The auto-routing sent it somewhere wrong.
- A department needs to hand it to another department (see "referring," §6).

To manually assign or reassign a department on a case, open it from the **Admin Dashboard** (click **View** on its row), then use the **Add Department** control in the case's sidebar to attach an additional department, or use each department's own **Refer To Department** control to move their piece of the case elsewhere.

## 5. Working a case: the Case Detail page

Opening any case (via **View** from a dashboard) shows:

- **Case Details** — case number, description, location (or "Subject of Request" if it's a 91-A case), submission date, and the resident's contact info.
- **Update Case** (you only) — change the master status, set a **Follow-up Due Date** (pauses the silence-tracking system until that date — see [§11](#11-the-escalation-process--when-a-department-goes-quiet)), toggle "This is a 91-A Right-to-Know request," and click **Save Changes**.
- **Right-to-Know (RSA 91-A) Details** and **⏱ Time Log** — only appear if the case is flagged 91-A. See [§9](#9-right-to-know-rsa-91-a-requests).
- **One card per department assigned to the case** — each shows that department's own status, a **Refer To Department** dropdown, and (for you specifically) a **Save** button and a **-- Refer to department --** dropdown to update or hand off that department's piece directly from the admin view, without having to log in as that department.
- **Public comment box** — anything posted here is visible to the resident. Use it for real updates you want them to see.
- **Internal note box** — staff-only, never shown to the resident. Use it for anything you don't want public.
- **Print Work Order** and **Export Full Case** buttons at the top — see [§10](#10-reports).

## 6. Reassigning, referring, and closing a case

- **To add a department** to a case that doesn't have one yet: use the department picker + **Add** button in the case sidebar.
- **To hand a department's own piece of the case to a different department** ("referring"): on that department's card, pick a target from **Refer To Department**, then save. This closes that department's own row and opens a new one for the target department, who gets notified automatically. A case can bounce between the same two departments more than once if needed (e.g. PZ → Fire/Code → back to PZ) — that's supported.
- **To close a case:** once every department assigned to it reaches a "closing" status (Closed, Unfounded, Lacks Resources to Resolve, Referred to Another Department, or — for 91-A cases — Request Abandoned), the case closes itself automatically and the resident gets an email. You don't close a case directly; you close every department's piece of it.

## 7. The Admin Dashboard

This is your city-wide view of every case. At the top:

- A **search box** ("Search cases...").
- **All Cases / Open Cases / Closed Cases** — defaults to Open Cases.
- **All Departments** dropdown — filter to one department.
- **All Issue Types** dropdown — filter to one issue type.
- **All Cases / Escalated to CM** dropdown — shows only cases with at least one department that has ever been escalated to the City Manager's Office (see the note on this in [§11](#11-the-escalation-process--when-a-department-goes-quiet); this filter currently shows everything *ever* escalated, even if it's since been resolved — a stricter "still actively escalated" view is what the Escalated Cases Report gives you instead).
- **Network Folder: All / Created / Not Created**, **Initial Export: All / Complete / Not Complete**, **Closed Export: All / Complete / Not Complete** — these three track your own offline paperwork checklist per case; nothing in the system sets them automatically, you check them off yourself as you complete each step.

Below the filters, the **📊 Department Accountability** section shows, per department, how many of their open cases have gone quiet (no status change or public comment). Next to that table's heading is the **🚨 Escalated Cases Report** button — see [§10](#10-reports).

## 8. Department dashboards

Click **Departments** (only visible to you) to pick any department and see exactly what that department's own staff see when they log in — read-only, with no password-change option. Each department's own **My Cases** view has:

- **My Cases** table with a filter dropdown that includes **⚠️ Needs Update (n)** — cases with no status change or public comment recently.
- A yellow reminder banner when any cases need attention: *"Please open these cases and either update the status or post a public comment so residents can see that work is in progress. Use the "Needs Update" filter to find them quickly."*
- Checkboxes to select multiple cases, then **Print Work Orders** to print all of them at once, or **Clear** to deselect.
- A department-performance panel: case volume this year, typical resolution time (compared citywide), how often they post public updates, and a status breakdown.
- (Department logins only — not visible from your read-only view) a **Change My Password** button.

## 9. Right-to-Know (RSA 91-A) requests

Once a case is flagged 91-A, its Case Detail page gains:

- **Right-to-Know (RSA 91-A) Details** — Acknowledged Date, Request Topic, Number of Records, Hours Worked (Running), Hours Worked (Final at Close), Fees Assessed, Fees Collected, Tax Dollars Spent (read-only — "Auto-updated from time log entries below"), Date Records Ready, Date Requestor Notified, Delivery Method (**City USB / Self USB / In Person Viewing / Print / Mailed / Hold for Pick Up**), and — depending which delivery method you pick — either an **Appointment Date & Time** field or a **Tracking Number** field. Click **Save 91-A Details** when done.
- **⏱ Time Log** — log staff time against the request: Minutes Worked, Staff Initials, Hourly Rate. Every entry you add automatically recalculates **Tax Dollars Spent** for you — but it does **not** automatically update the Hours Worked fields above; you still need to total and enter those yourself.

The five Right-to-Know-only statuses (shown with "(91-A)" next to them in your status dropdown): **Gathering Records**, **Reviewing Records**, **Clarification Needed**, **Records Ready - Please Schedule Pick Up**, and **Request Abandoned**. Department staff never see or can select these — only you can move a 91-A case through them.

Residents never see any fee, appointment, tracking, or hours information for their own request on the public status-check page — that stays internal. City-wide totals (never per-request detail) are published on the public **City Analytics** page instead.

## 10. Reports

- **Print Work Order** (on a single case) and **Export Full Case** (admin-only, full case detail) — both open a printable page; use your browser's Print → Save as PDF to get a PDF copy.
- **Print Work Orders** (department dashboard, bulk) — same idea, for a batch of selected cases at once.
- **🚨 Escalated Cases Report** (Admin Dashboard) — a printable, City-Manager-facing report of every case that is *currently, actively* escalated (not just "was escalated at some point"), grouped by department. For each case it shows the case number, issue type, description, date created, exactly what the last real movement was (if it was a public comment: the text and who posted it; if it was a status change: what it changed to and who changed it), and why it's showing up on the report. Click **🖨️ Print / Save as PDF** to export it, or **← Back** to return to the dashboard.

Two older export buttons that used to live on the Admin Dashboard — **Export Report for City Manager** and **Export Case Timeline for Review** — have been retired and replaced by the Escalated Cases Report above.

## 11. The escalation process — when a department goes quiet

This runs automatically, once a day, with no action needed from you:

- If a department's case has had **no status change and no public comment for 3 days**, that department gets a reminder email (repeated every 3 days for as long as it stays quiet).
- If it's been **quiet for 2 full weeks**, two things happen automatically: the department gets a warning email that the case is being escalated, and your office (the City Manager's Office) gets notified too. The case is **not reassigned** — it's still that department's case to resolve; you're just being kept informed.
- **A department's Follow-up Due Date pauses all of this** for that case, entirely, until the date arrives. This is meant for situations like Fire/Code giving a violator 15/30/60+ days to fix something before anyone expects further movement. Once the date passes, the normal 3-day/2-week clock starts counting from that date — not from whatever old activity happened before the waiting period began, and not instantly the moment the deadline passes either.
- Once a case is escalated, that flag on the case **does not automatically clear itself** even after the department finally updates it — which is why the Admin Dashboard's "Escalated to CM" filter can show cases that have actually already been handled. The **Escalated Cases Report** (§10) is the more accurate view when you specifically want to see what's *still* actively silent right now.

## 12. Public Comment

Click **Public Comments**. Two tabs: **Topics** and **Moderation**.

**Topics tab** — click **+ New Topic** to create one: Title, Description, Reference URL, Hearing Date, Hearing Time, Hearing Location, Comment Period Opens, Comment Period Closes (both required), and at least one Position (add more with **+ Add another position**). Click **Save Topic**. Every topic starts out **active**. Once its comment window has passed, the public pages already treat it as closed for new submissions — but it will still show as "active" in your own Topics list until you explicitly click **Close Topic** on it (this also archives it publicly and stamps the close date). If you try to remove a position that already has comments attached to it, you'll get a warning and it will be left in place rather than deleted.

**Moderation tab** — a single queue of every pending comment across all topics (filter by topic with the dropdown at top), oldest first. Each card shows the commenter's name/ward, the topic and position they picked, their comment, and — if they flagged one — their questions and concern themes (shown for your context only; you can't edit these). Click **Approve** or **Reject**. There's no bulk action — it's one at a time, by design. Only approved comments (and their questions/themes) ever become visible to the public anywhere.

## 13. MOUs — retired

**This module was retired on 2026-09-29** (no longer in use) and is no longer reachable anywhere in the live app — no **MOUs** button, no public "Submit an MOU"/"Check MOU Status" links, no homepage cards for it. If it's ever needed again, that's a one-line code change for your developer (flip `MOU_MODULE_ENABLED` back to `true` in `src/mouConfig.js`) — nothing was deleted, including the one real submission already in the system (from Community Action Partnership Belknap-Merrimack Counties' Head Start Program, which was sitting at "Manager Review" awaiting missing information when the module was retired). The description that used to live in this section — the review stages, PIN-based org access, the template builder — is preserved in [ARCHITECTURE.md §8](ARCHITECTURE.md#8-mou-module-retired) in case the module is ever turned back on.

## 14. CARs (Council Agenda Reports) — retired

**This module was retired on 2026-09-26** and is no longer reachable anywhere in the live app — no **CARs** button, no public "Submit a CAR"/"Check CAR Status" links, no homepage cards for it. If you need it back, that's a one-line code change for your developer (flip `CAR_MODULE_ENABLED` back to `true` in `src/carConfig.js`) — nothing was deleted, including the one real historical report already in the system (a report Brenda filed herself for the 8/31/2026 meeting). The description that used to live in this section — meeting cycles, batch review, work sessions, the Word/PDF exports — is preserved in [ARCHITECTURE.md §9](ARCHITECTURE.md#9-car-council-agenda-report-module-retired) in case the module is ever turned back on.

## 15. Adding or removing a staff login

There is no "create account" screen anywhere in this app — this always has to be done directly in the Supabase dashboard by whoever has developer access: create the login under Authentication, then add a matching row for them so the system knows their role and (for a department login) which department they belong to. Ask your developer to do this whenever someone joins or leaves a department.

## 16. JLC Facility Repairs

This is a separate, **internal-only** tool for the Joint Loss Committee. City employees report problems with City-owned buildings (a broken step, a broken lock, a flashing smoke detector light), and MSD logs the repair. It replaces the paper form. **It is not part of Service Requests** — these reports never show up on the Admin Dashboard, in Road Watch, in City Analytics, or anywhere the public can see, because some of them describe security weaknesses.

**Who sees it:** admins, MSD staff, and City Manager's Office staff. You'll find a **JLC Facility Repairs** button in your Staff Tools row. Everyone else gets nothing — no button, and the data is locked at the database level too.

### How employees report a problem

Employees use a form titled **Facility Repair Report** (subtitle "Joint Loss Committee"). **There is no link to it anywhere on the public site** — you share the address with employees yourself (it's the site's address followed by `/?page=jlc-report`), for example in an email or on the intranet. Employees choose a building (or **Other city building** and type the name), enter their department, the specific location, what's wrong, their name, and their city email, and can attach up to 3 photos. The email **must** end in `@franklinnh.gov`; anything else is turned away with "Repair reports can only be submitted by city employees."

When they submit, they see a confirmation number such as **JLC-2026-0001** and an email with the same number. That email deliberately says nothing about the problem itself, and there's no status page or follow-up promise for the employee. **MSD is emailed** that a new report came in (number, building, who reported it) with a link to log in — the details are only visible after logging in.

### The list

Click **JLC Facility Repairs**. You'll see a table with **Confirmation #**, **Building**, **Location**, **Reported**, **Reported By**, **Status**, and **Days Open**. It starts showing **Open** reports only. Use the filters at the top:
- **Search** by confirmation number or the reporter's name.
- **Open / Completed / All**.
- **All Buildings** (or one building, or **Other city building**).
- **From** and **To** dates (the date reported).

To print blank forms, tick the boxes beside open reports and click **Print Selected**. **Manage Buildings** is at the top right.

### Working a report

Click **View** on a row. The top card shows the original report (building, department, location, date, reporter, email, phone, the problem, and any photos — photo links work for 10 minutes, then reload the page). The original report is **locked** so the record can't be quietly changed; if something was entered wrong (say, the wrong building), an administrator can click **Edit Original Details**, and the change is recorded.

The **Repair Report** card is where MSD records the work. All six fields are required:
1. **Repairs done by**
2. **Description of work done**
3. **Date completed**
4. **Parts used** (type "None" if there were none)
5. **Reporter notified of correction on this date**
6. **Reporter notified via** (**Phone** or **Email**)

You can fill these in over several sessions and click **Save Repair Details** each time. **Mark Completed** stays greyed out until all six are filled in (and the database refuses to complete a report that's missing any). The MSD assistant can enter the repair directly, or enter what the MSD staff member who did the work told them.

**The employee is not emailed automatically when a repair is done.** Contacting them is a manual step for MSD — then record the date and Phone/Email in the last two fields. There are no reminders and no escalation emails for these reports, and they can't be reassigned (they always belong to MSD).

If a report was marked Completed by mistake, a **Reopen** button brings it back to Open (the repair details are kept).

At the bottom, the **Activity Log** lists everything that has happened to the report — who did it, when, what changed, and the old and new values. It can't be edited.

### Printing

On a report's page:
- **Print Form (blank repair section)** prints the paper-style form with the top half filled in (Building/Department, Location of the Issue, Date, Problem or Repair Needed, Reported by, plus the confirmation number) and the **Repair report** half left as blank ruled lines for handwriting.
- **Print Completed Record** (available once the report is Completed) prints both halves filled in.

Each prints on one letter-size page, with the Right-to-Know (RSA 91-A) notice in the footer. Click **Print / Save as PDF** on the print page. Printing is recorded in the Activity Log.

### Managing the building list

Click **Manage Buildings**. You can **Add Building** (name and address), **Edit** one, or **Archive** it. Archived buildings disappear from the employee form's dropdown but stay attached to their past reports, and **Restore** brings one back. Buildings can't be deleted, on purpose. The list starts with Police Station, Proulx Community Center, City Hall, Public Library, Fire Station, MSD, and Bessie Rowell Community Center.

### Good to know

- Everything an employee submits is a government record that may be disclosed under RSA 91-A — the form says so above the Submit button.
- There's no automatic deletion; nothing is removed unless the City decides on a retention rule.
- Your developer can turn on an extra bot-protection check (Cloudflare Turnstile) for the employee form; until then it relies on a hidden trap field and a submission-rate limit.
