const BLOCKED_NAMES = ['anonymous', 'anon', 'n/a', 'na', 'none']

export function isBlockedName(rawName) {
  const normalized = (rawName || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (normalized.length === 0) return true
  if (normalized.length === 1) return true
  if (BLOCKED_NAMES.includes(normalized)) return true
  return false
}

export const HONEYPOT_FIELD_NAME = 'website'

export function isHoneypotTripped(value) {
  return Boolean(value && value.trim().length > 0)
}

export const PUBLIC_COMMENT_DISCLAIMER_TITLE = 'This is a public page.'

export const PUBLIC_COMMENT_DISCLAIMER_BODY = (
  'Submissions here, including your name, ward, and comments, become part of the public ' +
  'record and will be retained and published under NH RSA 91-A as soon as you click submit. ' +
  'Please write accordingly.'
)

export function isTopicOpen(topic) {
  if (!topic) return false
  if (topic.status !== 'active') return false
  const now = new Date()
  if (topic.comment_opens_at && now < new Date(topic.comment_opens_at)) return false
  if (topic.comment_closes_at && now > new Date(topic.comment_closes_at)) return false
  return true
}
