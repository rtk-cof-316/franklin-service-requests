// Single entry point for every PIN-gated org-side action on an existing MOU submission:
// status lookup, field edits, "suggest a change" comments, and submit/resubmit. Runs with
// the service role key (same reasoning as mou-submit) — the PIN itself is the org's only
// credential, so verifying it is this function's first job on every call, before any
// action-specific logic runs.

import { MOU_REVIEWERS } from '../_shared/mouConfig.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOCKOUT_THRESHOLD = 5
const LOCKOUT_MINUTES = 30
const EDITABLE_STAGES = ['org_drafting', 'org_revision']

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
  const brevoKey = Deno.env.get('BREVO_API_KEY')!
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }

  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/mou_submissions?submission_number=eq.${encodeURIComponent(submissionNumber)}&select=*`,
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
    await fetch(`${supabaseUrl}/rest/v1/mou_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    })
    const remaining = Math.max(0, LOCKOUT_THRESHOLD - attempts)
    return jsonResponse({ error: 'Incorrect PIN', attemptsRemaining: remaining }, 401)
  }

  if (submission.pin_failed_attempts > 0 || submission.pin_locked_until) {
    await fetch(`${supabaseUrl}/rest/v1/mou_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ pin_failed_attempts: 0, pin_locked_until: null }),
    })
  }

  async function sendMouEmail(type: string, extra: Record<string, unknown>) {
    await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, submissionNumber: submission.submission_number, orgName: submission.org_name, ...extra }),
    })
  }

  async function logActivity(entry: Record<string, unknown>) {
    await fetch(`${supabaseUrl}/rest/v1/mou_activity_log`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ submission_id: submission.id, actor_type: 'org', actor_name: submission.org_contact_name, ...entry }),
    })
  }

  if (action === 'lookup') {
    const [sectionsRes, valuesRes, commentsRes, reviewCommentsRes, docsRes, activityRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/mou_template_sections?template_id=eq.${submission.template_id}&select=*&order=section_order`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/mou_submission_field_values?submission_id=eq.${submission.id}&select=*`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/mou_submission_section_comments?submission_id=eq.${submission.id}&select=*`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/mou_review_comments?submission_id=eq.${submission.id}&org_visible=eq.true&select=*&order=created_at`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/mou_supporting_documents?submission_id=eq.${submission.id}&select=*`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/mou_activity_log?submission_id=eq.${submission.id}&select=*&order=created_at`, { headers: authHeaders }),
    ])
    const { pin_hash, ...safeSubmission } = submission
    return jsonResponse({
      submission: safeSubmission,
      sections: await sectionsRes.json(),
      fieldValues: await valuesRes.json(),
      sectionComments: await commentsRes.json(),
      reviewComments: await reviewCommentsRes.json(),
      supportingDocuments: await docsRes.json(),
      activityLog: await activityRes.json(),
      editable: EDITABLE_STAGES.includes(submission.current_stage),
    })
  }

  if (action === 'save_field') {
    if (!EDITABLE_STAGES.includes(submission.current_stage)) {
      return jsonResponse({ error: 'This submission is not currently editable' }, 409)
    }
    const { templateSectionId, fieldKey, value } = body
    if (!templateSectionId || !fieldKey) {
      return jsonResponse({ error: 'templateSectionId and fieldKey are required' }, 400)
    }
    await fetch(`${supabaseUrl}/rest/v1/mou_submission_field_values?on_conflict=submission_id,field_key`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        submission_id: submission.id,
        template_section_id: templateSectionId,
        field_key: fieldKey,
        value: value ?? null,
        updated_at: new Date().toISOString(),
      }),
    })
    return jsonResponse({ success: true })
  }

  if (action === 'save_section_comment') {
    if (!EDITABLE_STAGES.includes(submission.current_stage)) {
      return jsonResponse({ error: 'This submission is not currently editable' }, 409)
    }
    const { templateSectionId, commentText } = body
    if (!templateSectionId || !commentText) {
      return jsonResponse({ error: 'templateSectionId and commentText are required' }, 400)
    }
    await fetch(`${supabaseUrl}/rest/v1/mou_submission_section_comments`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ submission_id: submission.id, template_section_id: templateSectionId, comment_text: commentText }),
    })
    await logActivity({ action_type: 'section_comment_added', field_or_section: templateSectionId, notes: commentText })
    return jsonResponse({ success: true })
  }

  if (action === 'submit') {
    if (!EDITABLE_STAGES.includes(submission.current_stage)) {
      return jsonResponse({ error: 'This submission is not currently editable' }, 409)
    }

    const [sectionsRes, valuesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/mou_template_sections?template_id=eq.${submission.template_id}&select=*`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/mou_submission_field_values?submission_id=eq.${submission.id}&select=field_key,value`, { headers: authHeaders }),
    ])
    const sections = await sectionsRes.json()
    const values: { field_key: string; value: string | null }[] = await valuesRes.json()
    const valuesByKey = Object.fromEntries(values.map(v => [v.field_key, v.value]))

    const missing: string[] = []
    for (const section of sections) {
      for (const field of section.field_definitions || []) {
        if (field.conditional_on) {
          // Conditional fields (e.g. payment_terms, bonding_terms) are only shown — and
          // only required — once their toggle is "yes"; field.required itself is false
          // for these since they're optional by default.
          if (valuesByKey[field.conditional_on] === 'yes' && !valuesByKey[field.key]) {
            missing.push(`${section.title}: ${field.label}`)
          }
          continue
        }
        if (field.required && !valuesByKey[field.key]) missing.push(`${section.title}: ${field.label}`)
      }
    }
    if (missing.length > 0) {
      return jsonResponse({ error: 'Required fields are missing', missing }, 400)
    }

    const isInitialSubmit = submission.current_stage === 'org_drafting'
    const nextStage = isInitialSubmit ? 'submitted' : (submission.return_to_stage || 'brenda_review')

    await fetch(`${supabaseUrl}/rest/v1/mou_submissions?id=eq.${submission.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ current_stage: nextStage, return_to_stage: null }),
    })
    await logActivity({
      action_type: isInitialSubmit ? 'submitted' : 'resubmitted',
      old_value: submission.current_stage,
      new_value: nextStage,
    })

    if (isInitialSubmit) {
      await sendMouEmail('mou_submitted', { toEmail: MOU_REVIEWERS.brenda.email, toName: MOU_REVIEWERS.brenda.name })
    } else {
      const target = nextStage === 'city_manager_review' ? MOU_REVIEWERS.cityManager : MOU_REVIEWERS.brenda
      await sendMouEmail('mou_org_resubmitted', { toEmail: target.email, toName: target.name })
    }

    return jsonResponse({ success: true, currentStage: nextStage })
  }

  return jsonResponse({ error: `Unknown action "${action}"` }, 400)
})
