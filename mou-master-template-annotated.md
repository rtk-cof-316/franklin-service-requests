# MOU Master Template — Annotated for Build

This is the City Attorney-approved MOU master template, marked up so each section's
**locked text** (never changes except by admin edit) is separated from its **fillable
fields** (organization fills in) and any **conditional/optional** content is flagged.

Use this alongside `mou-module-spec.md` to build out `mou_templates` and
`mou_template_sections` with real content instead of placeholder data.

Markup key:
- `[[FIELD: key | label | type | guidance]]` = a fillable field the org completes
- `[[CONDITIONAL SECTION: ...]]` = a whole section that may not apply — needs an
  explicit "Not Applicable" option, not just an empty text field
- Everything else is **locked text** — render exactly as written, admin-edit only

---

## Field summary (for quick reference when building the schema)

| Section | Fillable fields | Notes |
|---|---|---|
| Header/Preamble | Org name, org legal name, entity type, address, EIN, agreement date, purpose description | Multiple short fields + one longer description |
| 1. Purpose/Scope | Scope description | One long-text field |
| 2. Roles & Responsibilities | Organization's duties (list), City's duties (list) | Two list-style fields |
| 3. Property Use | Property/resource description | One long-text field |
| 4. Term & Termination | Start date, end date | Rest of section fully locked |
| 5. Dissolution of Entity | — | Fully locked, no fields |
| 6. Annual Operating Plan | Annual submission date | Rest fully locked |
| 7. Documentation & Non-Profit Status | — | Fully locked, no fields |
| 8. Financial Reporting & Records Access | — | Fully locked, no fields |
| 9. Minutes & Board Meetings | — | Fully locked, no fields |
| 10. Performance Reporting | — | Fully locked, no fields |
| 11. Fees, Priority Use & Payment | Fee description, payment terms (conditional sub-clause) | Payment clause is conditional |
| 12. Insurance | — | Fully locked, no fields (standard limits are fixed) |
| 13. Indemnification | — | Fully locked, no fields |
| 14. Bonding | Entire section conditional | Needs "Not Applicable" toggle, else bond type/amount |
| 15. Independent Contractor Status | — | Fully locked, no fields |
| 16. Personnel Taxes | — | Fully locked, no fields |
| 17. Fees, Licenses & Permits | — | Fully locked, no fields |
| 18. Intellectual Property | IP ownership/use terms | One long-text field, whole section content is org-defined |
| 19. Dispute Resolution | — | Fully locked, no fields |
| 20. Amendments | — | Fully locked, no fields |
| Signature block | Org signer name/title | Likely NOT part of the online form — see note at bottom |

Every section, regardless of whether it has fillable fields, gets the standard
**"suggest a change to this section"** optional comment box per the module spec — that's
a constant across all sections and isn't listed per-row above.

---

## Annotated full template

**Document title:**
[[FIELD: org_name_display | Organization Name (for document title) | short_text | Appears at the top of the document, e.g. "Franklin Rotary Club"]]
MEMORANDUM OF UNDERSTANDING (MOU) AGREEMENT

**Preamble:**

Agreement made this [[FIELD: agreement_day | Day | short_text]] day of
[[FIELD: agreement_month | Month | short_text]], 20[[FIELD: agreement_year | Year (2 digits) | short_text]]
by and between the City of Franklin, a municipal corporation of the State of New
Hampshire, hereinafter called the "City", and [[FIELD: org_legal_name | Organization Legal Name | short_text]],
a [[FIELD: entity_type | Entity Type | short_text | e.g. "501(c)(3)" or other entity type]]
organized under the laws of the State of New Hampshire, with its principal place of
business at [[FIELD: org_address | Organization Address | long_text]], EIN
[[FIELD: org_ein | EIN | short_text]], hereinafter referred to as the "Organization".

WHEREAS, the Organization desires to [[FIELD: whereas_purpose | Purpose of Collaboration | long_text | Describe purpose — e.g. operate/maintain/provide (activity) on/using (City property or resource)]]; and

WHEREAS, the City has determined that this collaboration serves the public interest of
the City of Franklin;

NOW, THEREFORE, the City and the Organization hereby mutually agree as follows:

**1. Purpose/Scope:**
The Organization shall [[FIELD: scope_description | Scope of Work/Services | long_text | Describe specific scope of work/services, target population, and geographic area served]].
This Agreement does not grant the Organization any interest in City property beyond the
specific use described herein.

**2. Roles & Responsibilities:**

The Organization shall: [[FIELD: org_duties | Organization's Duties | list | Bulleted list of Organization duties]]

The City shall: [[FIELD: city_duties | City's Duties | list | Bulleted list of City duties — kept minimal; the City's role should generally be limited to approvals, access, and oversight, not funding or operational support]]

**3. Property Use:**
[[FIELD: property_description | Property/Resource Use | long_text | Describe property/resources used, and whether use is shared or exclusive]].
Any modification to City property including structures, landscaping, paving, or
equipment, requires prior written approval from the City Manager and compliance with
all applicable codes and permitting. All modifications and improvements become the
property of the City upon installation. The Organization is solely responsible for
funding all modifications and for any maintenance costs following the conclusion of
this Agreement.

**4. Term & Termination:**

A. This Agreement shall be in effect for a period of five (5) years commencing on
[[FIELD: term_start_date | Start Date | date]] and ending on
[[FIELD: term_end_date | End Date | date]], consistent with the City's MOU Standard
Operating Procedure. This Agreement may be extended for additional five (5) year terms
as soon as the four (4) year, ten (10) month anniversary, provided there are no changes
to the original agreement. There is no limit to the number of times this Agreement may
be extended, provided both parties are satisfied. Any exception to this term structure
requires specific City Council approval.

B. Either party may terminate this Agreement with sixty (60) days' written notice,
which shall include the reason (e.g., material breach, loss of nonprofit status,
failure to secure funding or insurance). In the event of an emergent need for
termination, the City Manager may request an emergency City Council meeting to
terminate the relationship.

**5. Dissolution of Entity:**
In the event the Organization dissolves, disbands, or becomes defunct, it shall provide
the City with sixty (60) days' written notice, a statement outlining the reasons for
dissolution, and a transition plan, which may include coordination with another
qualified organization to continue the service if available.

*(Fully locked — no fillable fields in this section.)*

**6. Annual Operating Plan:**
On or before [[FIELD: annual_plan_date | Annual Operating Plan Due Date | short_text | e.g. "March 1"]]
of each year of this Agreement, the Organization shall submit a fully detailed Annual
Operating Plan to the City Council for review by the appropriate City department and
approval by the City Manager. At minimum, the plan shall address: schedule and hours of
operation; description of activities/services provided; maintenance procedures;
emergency plan; marketing/outreach; signage; utilities; and demographics/number of
persons served (Franklin residents, regional, tourist).

**7. Documentation & Non-Profit Status:**
Prior to execution of this Agreement, the Organization shall provide the City with:
Articles of Agreement/Incorporation; current Bylaws; Conflict of Interest Policy; IRS
Determination Letter (if applicable); most recent Form 990/990-EZ/990-N; NH Charitable
Trust Registration; Certificate of Good Standing with the NH Secretary of State; and a
current Board Member contact list. The Organization shall notify the City Manager's
Office within five (5) business days of any change in primary contact, and shall
provide an updated Board contact list quarterly.

*(Fully locked — no fillable fields. This section's document requirements map directly
to the "supporting documentation" upload step in the module spec — the uploaded files
should probably be tagged/checked against this exact list.)*

**8. Financial Reporting & Records Access:**
The Organization shall submit its most recently filed IRS Form 990 annually, along with
treasurer reports or internal financial statements. The Organization shall maintain
adequate bookkeeping records of all income and expenditures related to this Agreement.
The City retains the right to access and inspect all books, minutes, and records related
to the collaborative work and any use of municipal resources upon request. An audit or
independent financial review may be required for agreements exceeding a financial or
term threshold determined by the City.

*(Fully locked — no fillable fields.)*

**9. Minutes & Board Meetings:**
The Organization shall provide copies of board meeting minutes to the City Manager's
Office upon request, except that any minutes containing votes or updates related to
City property, large expenditures, equipment installations, paving, or landscaping
shall be proactively provided to the City Manager's Office within fourteen (14) days of
the meeting.

*(Fully locked — no fillable fields.)*

**10. Performance Reporting:**
The Organization shall provide the City Council with annual reports on metrics
identified in the Organization's Annual Operating Plan submitted under Section 6, which
may include: number of residents/participants served, volunteer hours, events hosted,
and progress on stated milestones.

*(Fully locked — no fillable fields.)*

**11. Fees, Priority Use & Payment to City:**
[[FIELD: fee_description | Fees Charged to the Public | long_text | Describe any fees the Organization charges the public, and how those funds may be used]].
The Organization shall give the City priority use of the property/facility for
City-sponsored events and needs, coordinated so as not to unduly interfere with the
Organization's scheduled activities.

[[CONDITIONAL SECTION: payment_to_city | Payment to City | Only include if applicable — needs a "Not Applicable" toggle, else fields for: dollar amount / percentage of revenue / other consideration, and payment schedule. Locked wrapper text: "The Organization shall pay the City $______ / ___% of revenue / other consideration, on a (schedule) basis, in exchange for use of City property."]]

**12. Insurance:**
The Organization shall obtain and maintain, at its own expense, Commercial General
Liability insurance with minimum limits of not less than $1,000,000 per occurrence and
$2,000,000 in the aggregate, covering its activities, operations, and use of City
property. The City of Franklin shall be named as an Additional Insured on a primary and
non-contributory basis, and the policy shall include a Waiver of Subrogation in favor of
the City. The Organization shall carry and keep in force Workers' Compensation
insurance as required by the State of New Hampshire, and any additional insurance
required by law for its specific activities (e.g., liquor liability). The Organization
shall provide the City with a Certificate of Insurance prior to the start of activities
and upon each renewal, with 30-day notice of cancellation or material change. The City
shall not be responsible for carrying or paying for insurance related to the
Organization's activities or operations.

*(Fully locked — no fillable fields. The Certificate of Insurance itself is a supporting
document upload, not a text field.)*

**13. Indemnification:**
The Organization agrees to defend, indemnify, and hold harmless the City of Franklin,
its officials, employees, and agents from any claims, damages, losses, or expenses
(including reasonable attorney's fees) arising out of the Organization's activities,
operations, volunteers, contractors, negligence, or breach of this Agreement. This
obligation shall survive the termination or expiration of this Agreement.

*(Fully locked — no fillable fields.)*

**14. Bonding:**
[[CONDITIONAL SECTION: bonding | Bonding | Include only if construction, public works, or handling of significant public funds is involved. Needs a "Not Applicable" toggle (most MOUs will be N/A), else fields for bond type and amount.]]

**15. Independent Contractor Status:**
The Organization and its employees, volunteers, board members, and contractors are
acting as an independent entity and are not employees, agents, or partners of the City.
The Organization remains solely responsible for supervising its own personnel and
operations.

*(Fully locked — no fillable fields.)*

**16. Personnel Taxes:**
The Organization is solely responsible for all federal, state, and local tax
withholding, Social Security, and unemployment obligations for its own personnel.

*(Fully locked — no fillable fields.)*

**17. Fees, Licenses & Permits:**
The Organization is solely responsible for obtaining all necessary permits and
licenses, and for paying all associated fees, related to its activities.

*(Fully locked — no fillable fields.)*

**18. Intellectual Property:**
[[FIELD: ip_terms | Intellectual Property Terms | long_text | Clarify ownership/use rights for materials, maps, data, or other work product created under this Agreement]]

**19. Dispute Resolution:**
Any disputes arising under this Agreement shall first be addressed through written
notice and a meeting with the City Manager. If unresolved, the parties agree to pursue
mediation before initiating litigation.

*(Fully locked — no fillable fields.)*

**20. Amendments:**
Any changes to this Agreement must be submitted in writing and signed by authorized
representatives of both parties.

*(Fully locked — no fillable fields.)*

---

**Signature block:**

IN WITNESS THEREOF, the parties hereunto set their hands and seals on the day and year
first written above.

City of Franklin: — Mitch Kloewer, City Manager (fixed — City signer never changes)

Organization: — [[FIELD: org_signer_name | Organization Signer Name | short_text]],
[[FIELD: org_signer_title | Organization Signer Title | short_text]]

Signature / Date lines for both parties — **not fillable-field data**. These are
physical/wet (or e-signature, if the City later adopts that) signatures applied to the
exported PDF after the workflow completes, not something the org types into the form
during submission. The org's signer name/title above can be captured as fields so
they're printed correctly on the export, but the actual signature and date lines should
render blank on the PDF for signing.

---

## Notes for Claude Code

- Sections 5, 7, 8, 9, 10, 13, 15, 16, 17, 19, and 20 are **fully locked** — they still
  need a row in `mou_template_sections` (so they're included in the export and can carry
  a "suggest a change" comment), they just have no `field_definitions`.
- Sections 11 and 14 need a **conditional/N-A pattern** — not a required text field.
  Suggest a boolean toggle ("This section applies to this MOU: yes/no") that, when "no,"
  renders as "Not Applicable" in the export instead of blank fields.
- The **document title and preamble fields aren't inside a numbered section** — worth
  deciding whether these get their own `section_order = 0` "Header" section in the data
  model, or a separate `mou_submissions` columns for org name/legal name/etc. since some
  of that (org name, org email) is likely already being captured at the start of
  submission per the module spec, and probably shouldn't be duplicated as a section
  field too.
