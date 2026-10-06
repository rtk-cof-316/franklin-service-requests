// Shared constants for the JLC (Joint Loss Committee) Facility Repair Report module.
// The internal tab's name lives here so it's a one-line change.
export const JLC_TAB_LABEL = 'JLC Facility Repairs'
export const JLC_FORM_TITLE = 'Facility Repair Report'
export const JLC_FORM_SUBTITLE = 'Joint Loss Committee'

// Unlisted on purpose: not linked from the landing page, nav, or any menu.
export const JLC_PUBLIC_PAGE = 'jlc-report'

export const JLC_BUCKET = 'jlc-facility-repair'
export const JLC_EMAIL_DOMAIN = 'franklinnh.gov'
export const JLC_EMAIL_ERROR = 'Repair reports can only be submitted by city employees.'
export const JLC_DISCLAIMER =
  'Information submitted through this form is a government record and may be subject to disclosure under RSA 91-A, the New Hampshire Right-to-Know Law.'

export const JLC_MAX_PHOTOS = 3
export const JLC_MAX_PHOTO_BYTES = 5 * 1024 * 1024

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
// Optional. When set, the public form shows the Cloudflare Turnstile challenge; the matching
// TURNSTILE_SECRET_KEY must be set as a Supabase Edge Function secret for it to be enforced.
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

// Client-side mirror of the server's rule (exact domain, case-insensitive, no lookalikes or
// subdomains). The Edge Function and a database constraint enforce it for real.
export function isValidJlcEmail(email) {
  return /^[^@\s]+@franklinnh\.gov$/i.test((email || '').trim())
}

// 'YYYY-MM-DD' -> local Date, avoiding the off-by-one a UTC parse causes.
export function parseDateOnly(value) {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateOnly(value) {
  const d = parseDateOnly(value)
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Open reports: days since reported. Completed: days from reported to completed.
export function daysOpen(report) {
  const start = parseDateOnly(report.reported_date)
  if (!start) return null
  const end = report.status === 'completed' && report.completed_date ? parseDateOnly(report.completed_date) : new Date()
  return Math.max(0, Math.floor((end - start) / 86400000))
}

export function facilityLabel(report) {
  return report.city_facilities?.name || report.facility_other_name || '—'
}

export const REPAIR_FIELDS = [
  'repaired_by', 'work_description', 'completed_date', 'parts_used', 'reporter_notified_date', 'reporter_notified_via',
]

export function missingRepairFields(draft) {
  return REPAIR_FIELDS.filter(f => !String(draft[f] ?? '').trim())
}
