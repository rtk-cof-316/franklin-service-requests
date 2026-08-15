// Real content from the City's CAR Resource Page, transcribed for the public intake form.
// Plain data only — no logic. The "at least 17 days prior" line below fixes a stray
// leftover word in the source copy ("at least three 17 days prior"), an edit artifact
// (likely "three weeks" changed to "17 days" without deleting "three") rather than a real
// 21-day requirement — confirmed against the internal Review Date formula, which already
// uses 17 days.

export const CAR_INTRO = `A Council Action Report (CAR) is the formal submission used to request that an item be placed on a Franklin City Council agenda for discussion and possible action.

This page is intended to help departments, committees, boards, and community partners understand the CAR process, prepare complete submissions, and provide all supporting materials needed for review.

Please note: submission of a CAR does not guarantee placement on a City Council agenda. All proposed agenda items are subject to review by the Mayor and City Manager.`

export const CAR_REQUIRES_LIST = [
  'Resolutions',
  'Policy changes',
  'Budget requests or transfers',
  'Contracts and agreements',
  'Grants and grant acceptances',
  'Capital projects',
  'Land or property matters',
  'Committee recommendations',
  'Ordinance-related actions',
  'Fee changes',
  'Formal Council direction requests',
]

export const CAR_REQUIRES_NOTE = 'If you are unsure whether your item requires a CAR, please contact the City Manager\'s Office before preparing your submission.'

export const CAR_SUBMISSION_TIMELINE = 'Complete CAR packets must be submitted to the City Manager\'s Office at least 17 days prior to the requested City Council meeting date. This timeline allows for initial administrative review, revision with the requestor, City Manager review, Mayor agenda review, and packet preparation and publication deadlines. Late or incomplete submissions may not be eligible for the requested meeting date.'

// Per-field guidance, matching the real CAR Resource Page's field-by-field examples.
export const CAR_FIELD_GUIDANCE = {
  from_field: {
    label: 'From',
    guidance: 'Identify the department, board, committee, staff member, or requesting organization submitting the item.',
    examples: ['From: Fire Department', 'From: Citizens for Franklin', 'From: Friends of Franklin Trails'],
  },
  subject: {
    label: 'Subject',
    guidance: 'Provide a short, clear title that explains the action being requested.',
    examples: ['Acceptance of Moose Plate Grant Funds', 'Proposed Sidewalk Improvement Project – Central Street', 'Resolution Correcting Prior Funding Language'],
  },
  history: {
    label: 'History',
    guidance: 'Provide the background and context needed for Council to understand the request. Include prior Council actions, relevant dates, committee discussions, prior votes, legal requirements, or project history.',
    examples: ['City Council previously accepted the original grant award on March 4, 2026. During implementation, the project scope changed to include drainage improvements, requiring updated Council authorization.'],
  },
  recommendation: {
    label: 'Recommendation',
    guidance: 'State the action being recommended to City Council. This should be a clear individual, staff, board, or requestor recommendation.',
    examples: ['Approve the grant amendment and authorize the City Manager to execute all related documents.'],
  },
  suggested_motion: {
    label: 'Suggested Motion',
    guidance: 'Provide the exact action you are asking Council to vote on. This should be written as a clear motion.',
    examples: ['I move to approve the amended grant agreement and authorize the City Manager to sign all associated documents.'],
  },
  discussion: {
    label: 'Discussion',
    guidance: 'Provide additional detail that supports the recommendation — operational impacts, legal considerations, financial effects, project timelines, public benefit, and/or risks or alternatives considered.',
    examples: ['The amendment increases the total grant by $25,000 and allows additional drainage work to be completed during the current paving season, reducing future maintenance costs.'],
  },
  alternatives: {
    label: 'Alternatives',
    guidance: 'Identify other reasonable options available to City Council besides the primary recommendation — e.g. deny the request, revise the request, refer back for additional information, schedule a public hearing, table to a future meeting, send to committee for further review, request legal review, and/or modify scope, funding, or timeline.',
    examples: ['Alternatives include setting a public hearing for the next regular meeting, referring the item back to the Legislative Committee for additional review, or denying the proposed fee change at this time.'],
  },
}

export const CAR_ATTACHMENTS_GUIDANCE = 'Attachments should be included as supporting documentation, exhibits, legal references, staff reports, maps, financials, contracts, resolutions, or any materials necessary to support City Council review.'

export const CAR_RESOLUTION_NOTE = 'If your request requires formal Council action by resolution, please attach the completed Resolution Template as a supporting document.'
