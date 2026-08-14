-- MOU Module: seed the City Attorney-approved master template (version 1)
--
-- Locked text uses {{field_key}} tokens for inline interpolation at fill/export time.
-- Fields marked "conditional_on" only render/require when the named yes_na_toggle field
-- on the same section is "yes" — otherwise the export substitutes "Not Applicable" for
-- that token. This single mechanism covers both the section 11 payment sub-clause and
-- the fully-conditional section 14 (Bonding).

with new_template as (
  insert into public.mou_templates (version_number, is_current, created_by)
  values (1, true, 'system')
  returning id
)
insert into public.mou_template_sections
  (template_id, section_order, title, locked_text, field_definitions, allow_section_comment)
select id, 0, 'Header & Preamble', $s0$MEMORANDUM OF UNDERSTANDING (MOU) AGREEMENT

Agreement made this {{agreement_day}} day of {{agreement_month}}, 20{{agreement_year}} by and between the City of Franklin, a municipal corporation of the State of New Hampshire, hereinafter called the "City", and {{org_legal_name}}, a {{entity_type}} organized under the laws of the State of New Hampshire, with its principal place of business at {{org_address}}, EIN {{org_ein}}, hereinafter referred to as the "Organization".

WHEREAS, the Organization desires to {{whereas_purpose}}; and

WHEREAS, the City has determined that this collaboration serves the public interest of the City of Franklin;

NOW, THEREFORE, the City and the Organization hereby mutually agree as follows:$s0$,
'[
  {"key":"org_legal_name","label":"Organization Legal Name","type":"short_text","required":true},
  {"key":"entity_type","label":"Entity Type","type":"short_text","required":true,"guidance":"e.g. \"501(c)(3)\" or other entity type"},
  {"key":"org_address","label":"Organization Address","type":"long_text","required":true},
  {"key":"org_ein","label":"EIN","type":"short_text","required":true},
  {"key":"agreement_day","label":"Day","type":"short_text","required":true},
  {"key":"agreement_month","label":"Month","type":"short_text","required":true},
  {"key":"agreement_year","label":"Year (2 digits)","type":"short_text","required":true},
  {"key":"whereas_purpose","label":"Purpose of Collaboration","type":"long_text","required":true,"guidance":"Describe purpose — e.g. operate/maintain/provide (activity) on/using (City property or resource)"}
]'::jsonb, true
from new_template
union all
select id, 1, '1. Purpose/Scope', $s1$The Organization shall {{scope_description}}. This Agreement does not grant the Organization any interest in City property beyond the specific use described herein.$s1$,
'[{"key":"scope_description","label":"Scope of Work/Services","type":"long_text","required":true,"guidance":"Describe specific scope of work/services, target population, and geographic area served"}]'::jsonb, true
from new_template
union all
select id, 2, '2. Roles & Responsibilities', $s2$The Organization shall: {{org_duties}}

The City shall: {{city_duties}}$s2$,
'[
  {"key":"org_duties","label":"Organization''s Duties","type":"list","required":true,"guidance":"Bulleted list of Organization duties"},
  {"key":"city_duties","label":"City''s Duties","type":"list","required":true,"guidance":"Bulleted list of City duties — kept minimal; the City''s role should generally be limited to approvals, access, and oversight, not funding or operational support"}
]'::jsonb, true
from new_template
union all
select id, 3, '3. Property Use', $s3${{property_description}}. Any modification to City property including structures, landscaping, paving, or equipment, requires prior written approval from the City Manager and compliance with all applicable codes and permitting. All modifications and improvements become the property of the City upon installation. The Organization is solely responsible for funding all modifications and for any maintenance costs following the conclusion of this Agreement.$s3$,
'[{"key":"property_description","label":"Property/Resource Use","type":"long_text","required":true,"guidance":"Describe property/resources used, and whether use is shared or exclusive"}]'::jsonb, true
from new_template
union all
select id, 4, '4. Term & Termination', $s4$A. This Agreement shall be in effect for a period of five (5) years commencing on {{term_start_date}} and ending on {{term_end_date}}, consistent with the City's MOU Standard Operating Procedure. This Agreement may be extended for additional five (5) year terms as soon as the four (4) year, ten (10) month anniversary, provided there are no changes to the original agreement. There is no limit to the number of times this Agreement may be extended, provided both parties are satisfied. Any exception to this term structure requires specific City Council approval.

B. Either party may terminate this Agreement with sixty (60) days' written notice, which shall include the reason (e.g., material breach, loss of nonprofit status, failure to secure funding or insurance). In the event of an emergent need for termination, the City Manager may request an emergency City Council meeting to terminate the relationship.$s4$,
'[
  {"key":"term_start_date","label":"Start Date","type":"date","required":true},
  {"key":"term_end_date","label":"End Date","type":"date","required":true}
]'::jsonb, true
from new_template
union all
select id, 5, '5. Dissolution of Entity', $s5$In the event the Organization dissolves, disbands, or becomes defunct, it shall provide the City with sixty (60) days' written notice, a statement outlining the reasons for dissolution, and a transition plan, which may include coordination with another qualified organization to continue the service if available.$s5$,
'[]'::jsonb, true
from new_template
union all
select id, 6, '6. Annual Operating Plan', $s6$On or before {{annual_plan_date}} of each year of this Agreement, the Organization shall submit a fully detailed Annual Operating Plan to the City Council for review by the appropriate City department and approval by the City Manager. At minimum, the plan shall address: schedule and hours of operation; description of activities/services provided; maintenance procedures; emergency plan; marketing/outreach; signage; utilities; and demographics/number of persons served (Franklin residents, regional, tourist).$s6$,
'[{"key":"annual_plan_date","label":"Annual Operating Plan Due Date","type":"short_text","required":true,"guidance":"e.g. \"March 1\""}]'::jsonb, true
from new_template
union all
select id, 7, '7. Documentation & Non-Profit Status', $s7$Prior to execution of this Agreement, the Organization shall provide the City with: Articles of Agreement/Incorporation; current Bylaws; Conflict of Interest Policy; IRS Determination Letter (if applicable); most recent Form 990/990-EZ/990-N; NH Charitable Trust Registration; Certificate of Good Standing with the NH Secretary of State; and a current Board Member contact list. The Organization shall notify the City Manager's Office within five (5) business days of any change in primary contact, and shall provide an updated Board contact list quarterly.$s7$,
'[]'::jsonb, true
from new_template
union all
select id, 8, '8. Financial Reporting & Records Access', $s8$The Organization shall submit its most recently filed IRS Form 990 annually, along with treasurer reports or internal financial statements. The Organization shall maintain adequate bookkeeping records of all income and expenditures related to this Agreement. The City retains the right to access and inspect all books, minutes, and records related to the collaborative work and any use of municipal resources upon request. An audit or independent financial review may be required for agreements exceeding a financial or term threshold determined by the City.$s8$,
'[]'::jsonb, true
from new_template
union all
select id, 9, '9. Minutes & Board Meetings', $s9$The Organization shall provide copies of board meeting minutes to the City Manager's Office upon request, except that any minutes containing votes or updates related to City property, large expenditures, equipment installations, paving, or landscaping shall be proactively provided to the City Manager's Office within fourteen (14) days of the meeting.$s9$,
'[]'::jsonb, true
from new_template
union all
select id, 10, '10. Performance Reporting', $s10$The Organization shall provide the City Council with annual reports on metrics identified in the Organization's Annual Operating Plan submitted under Section 6, which may include: number of residents/participants served, volunteer hours, events hosted, and progress on stated milestones.$s10$,
'[]'::jsonb, true
from new_template
union all
select id, 11, '11. Fees, Priority Use & Payment to City', $s11${{fee_description}}. The Organization shall give the City priority use of the property/facility for City-sponsored events and needs, coordinated so as not to unduly interfere with the Organization's scheduled activities.

Payment to City (if applicable): {{payment_terms}}$s11$,
'[
  {"key":"fee_description","label":"Fees Charged to the Public","type":"long_text","required":true,"guidance":"Describe any fees the Organization charges the public, and how those funds may be used"},
  {"key":"payment_applies","label":"Does the Organization pay the City for use of this property?","type":"yes_na_toggle","required":true},
  {"key":"payment_terms","label":"Payment Terms","type":"long_text","required":false,"conditional_on":"payment_applies","guidance":"Describe: dollar amount / percentage of revenue / other consideration, and payment schedule — e.g. \"$500 annually\" or \"10% of gross revenue, paid quarterly\""}
]'::jsonb, true
from new_template
union all
select id, 12, '12. Insurance', $s12$The Organization shall obtain and maintain, at its own expense, Commercial General Liability insurance with minimum limits of not less than $1,000,000 per occurrence and $2,000,000 in the aggregate, covering its activities, operations, and use of City property. The City of Franklin shall be named as an Additional Insured on a primary and non-contributory basis, and the policy shall include a Waiver of Subrogation in favor of the City. The Organization shall carry and keep in force Workers' Compensation insurance as required by the State of New Hampshire, and any additional insurance required by law for its specific activities (e.g., liquor liability). The Organization shall provide the City with a Certificate of Insurance prior to the start of activities and upon each renewal, with 30-day notice of cancellation or material change. The City shall not be responsible for carrying or paying for insurance related to the Organization's activities or operations.$s12$,
'[]'::jsonb, true
from new_template
union all
select id, 13, '13. Indemnification', $s13$The Organization agrees to defend, indemnify, and hold harmless the City of Franklin, its officials, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney's fees) arising out of the Organization's activities, operations, volunteers, contractors, negligence, or breach of this Agreement. This obligation shall survive the termination or expiration of this Agreement.$s13$,
'[]'::jsonb, true
from new_template
union all
select id, 14, '14. Bonding', $s14${{bonding_terms}}$s14$,
'[
  {"key":"bonding_applies","label":"Does this MOU involve construction, public works, or handling of significant public funds requiring a bond?","type":"yes_na_toggle","required":true},
  {"key":"bonding_terms","label":"Bond Type & Amount","type":"long_text","required":false,"conditional_on":"bonding_applies","guidance":"Describe bond type and amount"}
]'::jsonb, true
from new_template
union all
select id, 15, '15. Independent Contractor Status', $s15$The Organization and its employees, volunteers, board members, and contractors are acting as an independent entity and are not employees, agents, or partners of the City. The Organization remains solely responsible for supervising its own personnel and operations.$s15$,
'[]'::jsonb, true
from new_template
union all
select id, 16, '16. Personnel Taxes', $s16$The Organization is solely responsible for all federal, state, and local tax withholding, Social Security, and unemployment obligations for its own personnel.$s16$,
'[]'::jsonb, true
from new_template
union all
select id, 17, '17. Fees, Licenses & Permits', $s17$The Organization is solely responsible for obtaining all necessary permits and licenses, and for paying all associated fees, related to its activities.$s17$,
'[]'::jsonb, true
from new_template
union all
select id, 18, '18. Intellectual Property', $s18${{ip_terms}}$s18$,
'[{"key":"ip_terms","label":"Intellectual Property Terms","type":"long_text","required":true,"guidance":"Clarify ownership/use rights for materials, maps, data, or other work product created under this Agreement"}]'::jsonb, true
from new_template
union all
select id, 19, '19. Dispute Resolution', $s19$Any disputes arising under this Agreement shall first be addressed through written notice and a meeting with the City Manager. If unresolved, the parties agree to pursue mediation before initiating litigation.$s19$,
'[]'::jsonb, true
from new_template
union all
select id, 20, '20. Amendments', $s20$Any changes to this Agreement must be submitted in writing and signed by authorized representatives of both parties.$s20$,
'[]'::jsonb, true
from new_template
union all
select id, 21, 'Signature Block', $s21$IN WITNESS THEREOF, the parties hereunto set their hands and seals on the day and year first written above.

City of Franklin: _________________________  Date: _________
Mitch Kloewer, City Manager

Organization: _________________________  Date: _________
{{org_signer_name}}, {{org_signer_title}}$s21$,
'[
  {"key":"org_signer_name","label":"Organization Signer Name","type":"short_text","required":true},
  {"key":"org_signer_title","label":"Organization Signer Title","type":"short_text","required":true}
]'::jsonb, false
from new_template;
