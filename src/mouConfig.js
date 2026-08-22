// Fixed reviewer identities for the MOU module — mirrors
// supabase/functions/_shared/mouConfig.ts. Brenda and Mitch already have separate admin
// logins, so this map (keyed by their login email) is what gates which stage-actions a
// logged-in admin sees. Keep both files in sync if either address ever changes.
export const MOU_REVIEWERS = {
  brenda: { email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' },
  cityManager: { email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' },
}

export function mouReviewerRole(email) {
  if (!email) return null
  const lower = email.toLowerCase()
  if (lower === MOU_REVIEWERS.brenda.email) return 'brenda'
  if (lower === MOU_REVIEWERS.cityManager.email) return 'cityManager'
  return null
}

export const MOU_STAGE_LABELS = {
  org_intake: 'Intake',
  missing_information: 'Missing Information',
  manager_review_brenda: 'Manager Review — Brenda',
  manager_review_city_manager: 'Manager Review — City Manager',
  submitter_needs_review: 'Awaiting Submitter Review',
  ready_for_council: 'Ready for Council',
  approved: 'Approved',
  denied: 'Denied',
}

// Org-facing version of the labels above — the org doesn't need to know which of the two
// internal reviewers currently has it, so both manager_review_* stages collapse to one
// label here. Admins keep seeing the distinction via MOU_STAGE_LABELS.
export function orgFacingStageLabel(stage) {
  if (stage === 'manager_review_brenda' || stage === 'manager_review_city_manager') return 'Manager Review'
  return MOU_STAGE_LABELS[stage] || stage
}

// The forward-progress order used to render the org's status progress bar. Both internal
// review stages collapse onto the same bar position (see orgFacingStageLabel above);
// missing_information/submitter_needs_review are loop-back states rendered as a banner
// rather than their own step, and denied is a banner too, not a step — see MouStatus.jsx.
export const MOU_PROGRESS_STEPS = [
  'manager_review_brenda',
  'ready_for_council',
  'approved',
]

export const MOU_ORG_REVIEW_DECISION_LABELS = {
  looks_good: 'This looks good to me',
  accept_with_changes: 'Accept with changes',
  do_not_like: 'I do not like this',
}

export const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
