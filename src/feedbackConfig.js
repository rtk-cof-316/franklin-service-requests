// Shared constants for System Feedback (staff report issues / request features).
export const FEEDBACK_TAB_LABEL = 'Report an Issue / Request a Feature'
export const FEEDBACK_INBOX_LABEL = 'System Feedback'

export const FEEDBACK_TYPES = {
  issue: 'Report an Issue',
  feature: 'Request a Feature',
}

export const FEEDBACK_STATUSES = {
  new: { label: 'New', bg: '#dbeafe', color: '#1e40af' },
  in_review: { label: 'In Review', bg: '#fef3c7', color: '#92400e' },
  planned: { label: 'Planned', bg: '#ede9fe', color: '#5b21b6' },
  in_progress: { label: 'In Progress', bg: '#ffedd5', color: '#9a3412' },
  done: { label: 'Done', bg: '#d1fae5', color: '#065f46' },
  wont_do: { label: "Won't Do", bg: '#e5e7eb', color: '#374151' },
}

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function formatFeedbackDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
