// Single entry point for every PIN-gated submitter-side action on an existing CAR:
// status lookup, field edits, submitting an answer, and final submit. Runs with the
// service role key (same reasoning as car-submit) — the PIN is the submitter's only
// credential, so verifying it is this function's first job on every call.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOCKOUT_THRESHOLD = 5
const LOCKOUT_MINUTES = 30

// car_submissions uses real columns per field (unlike MOU's EAV mou_submission_field_values
// table, where the field key is inert data) — save_field must whitelist which columns are
// patchable, or a caller could attempt to write status/pin_hash/review_decision directly.
const EDITABLE_FIELDS = new Set([
  'from_field', 'subject', 'history', 'recommendation', 'suggested_motion',
  'discussion', 'alternatives', 'requires_resolution', 'requires_public_hearing',
])
const REQUIRED_FIELDS = [
  { key: 'from_field', label: 'From' },
  { key: 'subject', label: 'Subject' },
  { key: 'history', label: 'History' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'suggested_motion', label: 'Suggested Motion' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'alternatives', label: 'Alternatives' },
]

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.json()
  const { submissionNumber, pin, action } = body
  if (!submissionNumber || !pin || !action) {
    return jsonResponse({ error: 'submissionNumber, pin, and action are required' }, 400)
  }

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }

  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/car_submissions?submission_number=eq.${encodeURIComponent(submissionNumber)}&select=*`,
    { headers: authHeaders }
  )
  const submission = (await subRes.json())?.[0]
  if (!submission) {
    return jsonResponse({ error: 'No submission found with that number' }, 404)
  }

  if (submission.pin_locked_until && new Date(submission.pin_locked_until) > new Date()) {
    return jsonResponse({ error: 'Too many incorrect PIN attempts. Try again later.', lockedUntil: submission.pin_locked_until }, 423)
  }

  const providedHash = await hashPin(String(pin))
  if (providedHash !== submission.pin_hash) {
    const attempts = (submission.pin_failed_attempts || 0) + 1
    const patch: Record<string, unknown> = { pin_failed_attempts: attempts }
    if (attempts >= LOCKOUT_THRESHOLD) {
      patch.pin_locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
    }
    await fetch(`${supabaseUrl}/rest/v1/car_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    })
    const remaining = Math.max(0, LOCKOUT_THRESHOLD - attempts)
    return jsonResponse({ error: 'Incorrect PIN', attemptsRemaining: remaining }, 401)
  }

  if (submission.pin_failed_attempts > 0 || submission.pin_locked_until) {
    await fetch(`${supabaseUrl}/rest/v1/car_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ pin_failed_attempts: 0, pin_locked_until: null }),
    })
  }

  async function sendCarEmail(type: string, extra: Record<string, unknown>) {
    await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, submissionNumber: submission.submission_number, subject: submission.subject, ...extra }),
    })
  }

  async function logActivity(entry: Record<string, unknown>) {
    await fetch(`${supabaseUrl}/rest/v1/car_activity_log`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ car_submission_id: submission.id, actor_type: 'submitter', actor_name: submission.submitter_name, ...entry }),
    })
  }

  if (action === 'lookup') {
    const [attachmentsRes, activityRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/car_attachments?car_submission_id=eq.${submission.id}&select=*`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/car_activity_log?car_submission_id=eq.${submission.id}&select=*&order=created_at`, { headers: authHeaders }),
    ])
    const { pin_hash, ...safeSubmission } = submission
    return jsonResponse({
      submission: safeSubmission,
      attachments: await attachmentsRes.json(),
      activityLog: await activityRes.json(),
      editable: submission.status === 'submitted',
    })
  }

  if (action === 'save_field') {
    if (submission.status !== 'submitted') {
      return jsonResponse({ error: 'This submission is not currently editable' }, 409)
    }
    const { fieldKey, value } = body
    if (!fieldKey || !EDITABLE_FIELDS.has(fieldKey)) {
      return jsonResponse({ error: 'Invalid field' }, 400)
    }
    await fetch(`${supabaseUrl}/rest/v1/car_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ [fieldKey]: value ?? null }),
    })
    return jsonResponse({ success: true })
  }

  if (action === 'save_answer') {
    if (submission.status !== 'answer_due') {
      return jsonResponse({ error: 'An answer is not currently due for this submission' }, 409)
    }
    const { answerText } = body
    if (!answerText || !answerText.trim()) {
      return jsonResponse({ error: 'answerText is required' }, 400)
    }
    await fetch(`${supabaseUrl}/rest/v1/car_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        answer_text: answerText.trim(),
        answer_submitted_at: new Date().toISOString(),
        status: 'answer_submitted',
      }),
    })
    await logActivity({ action_type: 'answer_submitted', old_value: 'answer_due', new_value: 'answer_submitted' })
    await sendCarEmail('car_answer_submitted', {})
    return jsonResponse({ success: true })
  }

  if (action === 'submit') {
    if (submission.status !== 'submitted') {
      return jsonResponse({ error: 'This submission is not currently editable' }, 409)
    }
    const missing = REQUIRED_FIELDS.filter(f => !submission[f.key] || !String(submission[f.key]).trim()).map(f => f.label)
    if (missing.length > 0) {
      return jsonResponse({ error: 'Required fields are missing', missing }, 400)
    }

    await fetch(`${supabaseUrl}/rest/v1/car_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ submitter_confirmed_at: new Date().toISOString() }),
    })
    await logActivity({ action_type: 'submitted' })
    await sendCarEmail('car_submitted', { toEmail: submission.submitter_email, toName: submission.submitter_name })
    await sendCarEmail('car_new_submission', {})

    return jsonResponse({ success: true })
  }

  return jsonResponse({ error: `Unknown action "${action}"` }, 400)
})
