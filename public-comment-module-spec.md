# Public Comment Module — Build Spec

## Context

This module is a new feature added to the existing **Franklin Service Request System**
(React/Vite/Supabase/Vercel). It reuses the existing Supabase project and the existing
admin authentication pattern — this is not a new app, it's a new set of routes/tables
inside the current one.

**Purpose:** Give Franklin, NH residents a way to submit public comment on issues going
before City Council — a supplemental, semi-virtual public comment channel alongside
in-person meeting comment. Council will use this as a resource.

**Owner/admin:** Brenda Demers (Executive Secretary to the City Manager). She is the sole
moderator — no additional roles needed.

---

## 1. Data model (Supabase / Postgres)

### `topics`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| title | text | e.g. "Trestle Bridge Project" |
| description | text | short summary of what's going before council |
| reference_url | text, nullable | link to source material (budget page, packet PDF) |
| hearing_date | date | |
| hearing_time | time | |
| hearing_location | text | |
| status | enum: `active`, `closed` | |
| created_at | timestamptz | |
| closed_at | timestamptz, nullable | |

### `topic_positions`
Defines the response options for a given topic — **not hardcoded**. Each topic gets its
own list of positions when it's created (could be 2 options, could be 5).

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| topic_id | uuid, fk → topics.id | |
| label | text | e.g. "ALT 2 — Glulam Timber Trestle" |
| sort_order | int | display order |

### `concern_themes`
Fixed reference table, shared across all topics, editable by admin later if needed.

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| label | text | |
| group_label | text | `"Budget by department"` or `"General concerns"` — used to render the two visual groups on the form |
| sort_order | int | |

Seed values:

**Budget by department**
- Municipal Services Department
- City Clerk's Office
- City Manager's Office
- Finance Department
- Planning/Zoning/Assessing Department
- Police Department
- Fire Department
- Welfare Department
- Library
- Parks & Recreation Department

**General concerns**
- Tax Cap
- Traffic / Parking / Safety
- Environmental Impact
- Property Values / Zoning
- Infrastructure / Utilities
- Public Safety / Emergency Services
- Personnel / Staffing
- Process / Transparency
- Quality of Life / Aesthetics
- Communication / Notification
- Other

### `comments`
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| topic_id | uuid, fk → topics.id | |
| position_id | uuid, fk → topic_positions.id | required |
| name | text | required; reject if normalized value matches "anonymous" or close variants (see validation below) |
| ward | enum: `Ward 1`, `Ward 2`, `Ward 3` | required |
| comment_text | text | required, max 2000 chars |
| has_concern | boolean | default false |
| status | enum: `pending`, `approved`, `rejected` | default `pending` |
| honeypot_field | — | not stored; see bot friction below |
| created_at | timestamptz | |

### `comment_questions`
One row per specific question. Up to 15 per comment.

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| comment_id | uuid, fk → comments.id | |
| question_text | text | max 150 chars |
| sort_order | int | |

### `comment_concern_themes`
Join table — a comment can select multiple themes.

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| comment_id | uuid, fk → comments.id | |
| theme_id | uuid, fk → concern_themes.id | |

---

## 2. Validation rules

- **Name field:** required. Normalize input (lowercase, strip whitespace/punctuation) and
  reject if it equals or closely matches "anonymous" (also catch "anon", "n/a", "none",
  single-character entries, or all-whitespace). Show a clear inline error, not a silent
  rejection.
- **Ward:** required, must be one of the three enum values (dropdown, not free text).
- **Position:** required, must reference a valid `topic_positions.id` for that topic.
- **Comment text:** required, 1–2000 characters.
- **Questions:** optional; only shown if `has_concern` is checked. Max 150 chars each,
  max 15 total. Provide a "+ Add another question" control that reveals one field at a
  time rather than showing 15 blank fields up front.
- **Concern themes:** optional; only shown if `has_concern` is checked. Multi-select,
  rendered as two visually grouped clusters per `concern_themes.group_label`.

## 3. Bot friction

Add a standard honeypot field (hidden via CSS, not `display:none` — use off-screen
positioning so it's invisible to humans but visible to bots) to the comment form. If it's
filled on submit, silently reject/drop the submission — no error shown to the (bot)
submitter.

## 4. Public-facing pages

### Landing page (`/public-input`)
- Lists **all topics with status = active** (supports multiple concurrent open topics).
- Disclaimer banner at the top, above the topic list:
  > **This is a public page.** Submissions here — including your name, ward, and
  > comments — become part of the public record and will be retained and published
  > under NH RSA 91-A. Please write accordingly.
- Each topic card shows: title, hearing date/time/location, a link to `reference_url`
  ("Read the full proposal"), a quick tally (counts per position or total comments), and
  a "Submit public comment on this topic" button.
- A link/section for **archived (closed) topics**, read-only.

### Topic detail / analysis page (`/public-input/[topic-id]`)
- Header: topic title, hearing info, reference link.
- Analysis section: one bar/row per `topic_positions` entry, showing count and percentage
  of approved comments for that position, plus total comment count.
- Two-column body:
  - Left: feed of approved comments — name, ward, position tag, comment text.
  - Right (sidebar): concern themes ranked by frequency (count of
    `comment_concern_themes` grouped by theme, approved comments only).
- If closed: same layout, marked as archived/read-only, no submit button.

### Comment submission form (`/public-input/[topic-id]/submit`)
Field order:
1. Name (required, anonymous-blocked)
2. Ward (required, dropdown)
3. Position (required, radio list populated from that topic's `topic_positions`)
4. Comment (required, textarea, 2000 char limit, live counter)
5. Checkbox: "I have a specific question or concern for council"
   - If checked, reveal:
     - Specific questions: one 150-char field visible, "+ Add another question" up to 15
     - Concern themes: two grouped checkbox clusters (Budget by department / General
       concerns)
- Disclaimer banner repeated near the top of the form.
- Submit button: "Submit comment for the record"
- On submit: insert as `status = pending`, do **not** show it live immediately — show a
  confirmation message that the comment was received and is pending review.

## 5. Admin views (reuse existing Service Request System auth)

Add as a new section in the existing admin nav, gated by the same login used for Service
Request admin.

### Topic management (`/admin/public-input/topics`)
- Create/edit topics: title, description, reference_url, hearing_date/time/location,
  status.
- Define `topic_positions` for each topic (add/remove/reorder labels) at creation time.
- Close a topic (flips status to `closed`, sets `closed_at`) — moves it to the archive.

### Moderation queue (`/admin/public-input/moderation`)
- List of `status = pending` comments, newest first.
- Show full comment (name, ward, position, comment text, questions, selected themes).
- Approve / Reject actions, updates `status`.
- Optional: AI-assisted theme suggestion pass — on comments where `has_concern = true`
  and `comment_text` contains freeform detail, call the Anthropic API to suggest
  additional theme tags for admin review/approval (admin can accept, edit, or ignore the
  suggestion; suggested tags are never auto-published without admin approval).

---

## 6. Two topics to seed at launch

### Topic 1 — Trestle Bridge Project
- **Hearing:** Monday, 7/27 at 6:00 PM — Franklin Public Library, 310 Central St.
- **Reference URL:** https://www.franklinnh.gov/sites/g/files/vyhlif601/f/uploads/2026-07-27_packet_combined.pdf
- **Positions** (exact engineering terms — do not rename):
  1. ALT 1 — Rehabilitate Trestle
  2. ALT 2 — Glulam Timber Trestle
  3. ALT 3 — Steel Truss/Trestle Hybrid
  4. ALT 4 — Demo Trestle

### Topic 2 — FY27 Budget
- **Hearing:** Wednesday, 7/29 at 6:00 PM — Elks Lodge, 125 S. Main St.
- **Reference URL:** https://www.franklinnh.gov/finance-department/pages/city-budgets
- **Positions:** to be defined by Brenda before launch (e.g. Support budget as proposed /
  Support with changes / Oppose budget) — not yet finalized, confirm before seeding.

---

## 7. Explicitly out of scope / decided against

- No user accounts or login for the public — submissions are one-time, unauthenticated.
- No real identity verification on name/ward — the required fields are a friction/record
  mechanism, not verified constituent proof. Worth stating this plainly to council if
  asked.
- No multi-admin roles — Brenda is sole moderator.
- Not a replacement for in-person public comment at meetings — this is a supplemental
  channel. Consider a one-line note to that effect somewhere on the page or in materials
  presented to council.
