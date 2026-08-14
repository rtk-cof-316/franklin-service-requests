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
  org_drafting: 'Drafting',
  submitted: 'Submitted',
  brenda_review: 'City Review',
  city_manager_review: 'City Manager Review',
  org_revision: 'Awaiting Organization',
  finalized: 'Finalized',
  exported: 'Exported',
  scheduled_council: 'Scheduled for Council',
  council_decided: 'Council Decision Recorded',
}

// The forward-progress order used to render the status progress bar. org_revision is a
// loop-back state, not a forward step, so it's rendered as an overlay/badge on whichever
// stage it returns to rather than its own step — see MouStatus.jsx.
export const MOU_PROGRESS_STEPS = [
  'submitted',
  'brenda_review',
  'city_manager_review',
  'finalized',
  'scheduled_council',
  'council_decided',
]

export const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
