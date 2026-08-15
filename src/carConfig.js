// Fixed reviewer identities and shared constants for the CAR / Agenda / Packet module.
// Mirrors src/mouConfig.js's shape. Unlike MOU, access here is enforced at the RLS layer
// too (is_car_admin() checks these same two emails directly) — this map only drives which
// UI a logged-in admin sees, matching the DB-level rule rather than substituting for it.
export const CAR_ADMINS = {
  brenda: { email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' },
  cityManager: { email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' },
}

export function carAdminRole(email) {
  if (!email) return null
  const lower = email.toLowerCase()
  if (lower === CAR_ADMINS.brenda.email) return 'brenda'
  if (lower === CAR_ADMINS.cityManager.email) return 'cityManager'
  return null
}

export const CAR_STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  rejected: 'Rejected',
  pending_work_session_assignment: 'Pending Work Session Assignment',
  scheduled_for_work_session: 'Scheduled for Work Session',
  answer_due: 'Answer Due',
  answer_submitted: 'Answer Submitted',
  pushed_to_reassignment: 'Pushed to Reassignment',
  included_in_packet: 'Included in Packet',
  packet_published: 'Packet Published',
  decided_at_meeting: 'Decided at Meeting',
}

// The normal-business forward path, for a simple linear progress bar. Hot-button CARs
// branch through the work-session statuses instead — CarStatus.jsx renders those as a
// banner rather than trying to fit a branching ladder into one line, same approach MOU
// took for its org_revision loop-back.
export const CAR_PROGRESS_STEPS = ['submitted', 'under_review', 'included_in_packet', 'packet_published', 'decided_at_meeting']
export const CAR_WORK_SESSION_STATUSES = ['pending_work_session_assignment', 'scheduled_for_work_session', 'answer_due', 'answer_submitted', 'pushed_to_reassignment']

// Standard agenda section headings, toggleable per meeting cycle. Order here is the order
// they render in the generated agenda — CarAgendaBlock.jsx splits this same list at
// 'school_board_update' to place items before/after the numbered CAR items, so this array
// is the single source of truth for both the cycle-detail toggle checkboxes and the
// printed agenda's section order.
export const CAR_STANDARD_SECTIONS = [
  { key: 'legislative_update', label: 'Legislative Update' },
  { key: 'comments_from_public', label: 'Comments from the Public' },
  { key: 'council_acknowledgement', label: 'City Council Acknowledgement' },
  { key: 'mayors_update', label: "Mayor's Update" },
  { key: 'managers_update', label: "City Manager's Update" },
  { key: 'school_board_update', label: 'School Board Update' },
  { key: 'committee_reports', label: 'Committee Reports' },
  { key: 'nonprofit_reports', label: 'Non-Profit Reports' },
  { key: 'other_business', label: 'Other Business' },
]

export const CAR_REVIEW_DECISION_LABELS = {
  rejected: 'Rejected',
  approved_normal: 'Approved – Normal Business',
  approved_hot: 'Approved – Hot Button',
}

export const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
