// Staff submit a bug report or feature request about this system.
//
// Internal only: the caller must present a real, logged-in staff session (a valid Supabase
// user token for someone with a user_profiles row) -- the public anon key alone is rejected.
// The row is written with the service role because clients have no INSERT privilege on
// system_feedback; that keeps validation, rate limiting, and the email in one place.
//
// The notification email deliberately carries only the type, title, submitter, and a login
// link -- never the description -- because staff sometimes paste resident details into these
// reports and the recipient's mailbox is outside the City's domain. The full text stays in
// the System Feedback inbox.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SITE_URL = 'https://franklin-service-requests-39a5.vercel.app'
const BREVO_SENDER = { name: 'Franklin Service Request System', email: 'noreply.franklin.sr@gmail.com' }
const DEFAULT_NOTIFY_EMAIL = 'brenda@groundworkguild.co'
const MAX_PER_DAY = 25

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  if (Deno.env.get('FEEDBACK_EMAIL_DRY_RUN') === '1') {
    console.log(`[FEEDBACK DRY RUN EMAIL] to=${to} subject=${subject}\n${htmlContent}`)
    return
  }
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoKey) { console.error('BREVO_API_KEY is not set; feedback email not sent'); return }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
    body: JSON.stringify({ sender: BREVO_SENDER, to: [{ email: to }], subject, htmlContent }),
  })
  if (!res.ok) console.error('Brevo send failed', res.status, await res.text())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...authHeaders, ...(init.headers || {}) } })

  // ── Who is calling? Must be a real signed-in user (not just the anon key). ───────────
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Please log in to submit feedback.' }, 401)
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${token}` } })
  const user = userRes.ok ? await userRes.json() : null
  if (!user?.id || !user?.email) return json({ error: 'Please log in to submit feedback.' }, 401)

  // Internal users only: they must have a staff profile.
  const profileRes = await rest(`user_profiles?select=role,department_id&user_id=eq.${user.id}`)
  const profile = (await profileRes.json())?.[0]
  if (!profile) return json({ error: 'Only City staff can submit feedback.' }, 403)

  // ── Validate ─────────────────────────────────────────────────────────────────────────
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return json({ error: 'Invalid request.' }, 400) }
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const feedbackType = str(body.feedback_type)
  const title = str(body.title)
  const description = str(body.description)
  const screen = str(body.screen)

  if (feedbackType !== 'issue' && feedbackType !== 'feature') return json({ error: 'Please choose Report an Issue or Request a Feature.' }, 400)
  if (!title || !description) return json({ error: 'Please fill in the title and description.' }, 400)
  if (title.length > 150) return json({ error: 'The title is too long (max 150 characters).' }, 400)
  if (description.length > 4000) return json({ error: 'The description is too long (max 4,000 characters).' }, 400)
  if (screen.length > 150) return json({ error: 'The screen name is too long (max 150 characters).' }, 400)

  // ── Per-user daily limit (cheap guard against a runaway script or stuck button) ──────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const countRes = await rest(`system_feedback?select=id&submitted_by=eq.${user.id}&created_at=gte.${encodeURIComponent(since)}`, {
    headers: { Prefer: 'count=exact', Range: '0-0' },
  })
  const recent = Number((countRes.headers.get('content-range') || '').split('/')[1]) || 0
  if (recent >= MAX_PER_DAY) return json({ error: 'You have submitted a lot of feedback today. Please try again tomorrow.' }, 429)

  // ── Save ─────────────────────────────────────────────────────────────────────────────
  const insertRes = await rest('system_feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      feedback_type: feedbackType, title, description, screen: screen || null,
      submitted_by: user.id, submitted_by_email: String(user.email).toLowerCase(),
    }),
  })
  const inserted = await insertRes.json()
  const row = inserted?.[0]
  if (!insertRes.ok || !row) {
    console.error('feedback insert failed', inserted)
    return json({ error: 'Could not save your feedback. Please try again.' }, 500)
  }

  // ── Notify the superuser (a failure never fails the submission) ──────────────────────
  try {
    const typeLabel = feedbackType === 'issue' ? 'Issue report' : 'Feature request'
    const notifyTo = (Deno.env.get('FEEDBACK_NOTIFY_EMAIL') || DEFAULT_NOTIFY_EMAIL).trim()
    await sendBrevoEmail(notifyTo, `System feedback: ${typeLabel} — ${title}`, `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a56a0; padding: 24px 32px;">
          <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">New ${typeLabel}</h1>
          <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Franklin Service Request System</p>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><tbody>
            <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; width: 110px;">Type</td><td style="padding: 6px 0; font-size: 14px;">${typeLabel}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Title</td><td style="padding: 6px 0; font-size: 14px;">${escapeHtml(title)}</td></tr>
            <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">From</td><td style="padding: 6px 0; font-size: 14px;">${escapeHtml(String(user.email))}</td></tr>
          </tbody></table>
          <a href="${SITE_URL}/?page=feedback-inbox" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Open the System Feedback inbox</a>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">The full description is in the inbox, not in this email.</p>
        </div>
      </div>`)
  } catch (e) {
    console.error('feedback email error', e)
  }

  return json({ ok: true, id: row.id })
})
