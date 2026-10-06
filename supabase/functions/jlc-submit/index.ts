// Public intake for the JLC Facility Repair Report module.
//
// This is the ONLY way anonymous visitors touch this module: anon has no privileges on any
// facility_repair_* table or on the jlc-facility-repair storage bucket (see the migration), so
// every check that matters has to live here, server-side -- client-side validation in the
// form is for UX only and is trivially bypassable.
//
// Two actions, distinguished by content type:
//   * application/json  {"action":"facilities"}  -> active buildings for the form's dropdown
//   * multipart/form-data                         -> a report submission (+ up to 3 photos)
//
// Known limitation: the @franklinnh.gov check confirms the *format* of the address, not that
// the person owns it. Turnstile, the per-IP rate limit, the honeypot, and the fact that the
// form is unlisted are the practical safeguards. Email verification would be the next
// hardening step if abuse ever becomes a problem.

import { resolveDepartmentRecipients } from '../_shared/departmentRecipients.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SITE_URL = 'https://franklin-service-requests-39a5.vercel.app'
const BUCKET = 'jlc-facility-repair'
const BREVO_SENDER = { name: 'Franklin Service Request System', email: 'noreply.franklin.sr@gmail.com' }

const EMAIL_ERROR = 'Repair reports can only be submitted by city employees.'
const EMAIL_RE = /^[^@\s]+@franklinnh\.gov$/i

const MAX_FILES = 3
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_REQUEST_BYTES = 18 * 1024 * 1024

// City Hall and other buildings share one outbound IP, so these are deliberately generous --
// the limit is a flood brake, not a per-person quota.
const RATE_LIMIT_PER_HOUR = 20
const RATE_LIMIT_PER_DAY = 100

const ALLOWED_FIELDS = new Set([
  'facility_id', 'facility_other_name', 'department', 'issue_location', 'problem_description',
  'reported_by_name', 'reporter_email', 'reporter_phone', 'photos',
  'cf-turnstile-response', 'hp_website',
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function clean(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : ''
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Decide the real type from the file's bytes -- the client-supplied content type and file
// extension are attacker-controlled and are never trusted.
function detectImageType(b: Uint8Array): { type: string; ext: string } | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { type: 'image/png', ext: 'png' }
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { type: 'image/webp', ext: 'webp' }
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12)
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'].includes(brand)) return { type: 'image/heic', ext: 'heic' }
    if (['mif1', 'msf1', 'heif'].includes(brand)) return { type: 'image/heif', ext: 'heif' }
  }
  return null
}

function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'photo'
  // deno-lint-ignore no-control-regex
  return base.replace(/[\u0000-\u001f<>:"|?*]/g, '').slice(0, 100) || 'photo'
}

async function sendBrevoEmail(to: string, subject: string, htmlContent: string) {
  if (Deno.env.get('JLC_EMAIL_DRY_RUN') === '1') {
    console.log(`[JLC DRY RUN EMAIL] to=${to} subject=${subject}\n${htmlContent}`)
    return
  }
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (!brevoKey) {
    console.error('BREVO_API_KEY is not set; JLC email not sent')
    return
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
    body: JSON.stringify({ sender: BREVO_SENDER, to: [{ email: to }], subject, htmlContent }),
  })
  if (!res.ok) console.error('Brevo send failed', res.status, await res.text())
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a56a0; padding: 24px 32px;">
        <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">${title}</h1>
        <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">City of Franklin, NH</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb;">${bodyHtml}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...authHeaders, ...(init.headers || {}) } })

  const contentType = req.headers.get('content-type') || ''

  // ── Dropdown data ────────────────────────────────────────────────────────────────────
  if (contentType.includes('application/json')) {
    let body: { action?: string } = {}
    try { body = await req.json() } catch { /* fall through */ }
    if (body.action !== 'facilities') return json({ error: 'Unknown action' }, 400)
    const res = await rest('city_facilities?select=id,name,address&is_active=eq.true&order=name.asc')
    if (!res.ok) return json({ error: 'Could not load buildings' }, 500)
    return json({ facilities: await res.json() })
  }

  // ── Report submission ────────────────────────────────────────────────────────────────
  if (!contentType.includes('multipart/form-data')) return json({ error: 'Unsupported request' }, 415)

  const declaredLength = Number(req.headers.get('content-length') || '0')
  if (declaredLength > MAX_REQUEST_BYTES) return json({ error: 'The upload is too large.' }, 413)

  let form: FormData
  try { form = await req.formData() } catch { return json({ error: 'Could not read the submission.' }, 400) }

  // Anything the form doesn't define is rejected outright -- this is what stops a caller
  // from trying to set status / repair fields through the public endpoint.
  for (const key of new Set(form.keys())) {
    if (!ALLOWED_FIELDS.has(key)) return json({ error: 'Unexpected field in submission.' }, 400)
  }

  // Honeypot: a real person never sees or fills this field.
  if (clean(form.get('hp_website'))) return json({ error: 'Submission could not be processed.' }, 400)

  // Rate limit by hashed IP (record the attempt first, then count).
  const ip = (req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown').trim()
  const ipHash = await sha256Hex(`${ip}:${Deno.env.get('JLC_IP_SALT') || 'jlc'}`)
  const now = Date.now()
  await rest('facility_repair_rate_limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ip_hash: ipHash }),
  })
  const countSince = async (ms: number) => {
    const since = new Date(now - ms).toISOString()
    const res = await rest(`facility_repair_rate_limits?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}`, {
      headers: { Prefer: 'count=exact', Range: '0-0' },
    })
    const range = res.headers.get('content-range') || ''
    return Number(range.split('/')[1]) || 0
  }
  if (await countSince(60 * 60 * 1000) > RATE_LIMIT_PER_HOUR || await countSince(24 * 60 * 60 * 1000) > RATE_LIMIT_PER_DAY) {
    return json({ error: 'Too many submissions from this location. Please try again later.' }, 429)
  }
  // Housekeeping so the throttle table never grows unbounded.
  await rest(`facility_repair_rate_limits?created_at=lt.${encodeURIComponent(new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString())}`, { method: 'DELETE' })

  // Cloudflare Turnstile. Enforced whenever TURNSTILE_SECRET_KEY is configured. If it isn't
  // configured the module still works (honeypot + rate limit only) -- set the secret in
  // Supabase and VITE_TURNSTILE_SITE_KEY in Vercel to turn it on.
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (turnstileSecret) {
    const token = clean(form.get('cf-turnstile-response'))
    if (!token) return json({ error: 'Please complete the verification challenge.' }, 400)
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: turnstileSecret, response: token, remoteip: ip }),
    })
    const verdict = await verify.json().catch(() => ({ success: false }))
    if (!verdict.success) return json({ error: 'Verification failed. Please try again.' }, 400)
  } else {
    console.warn('TURNSTILE_SECRET_KEY is not set; JLC submissions are protected by honeypot + rate limit only')
  }

  // ── Field validation ─────────────────────────────────────────────────────────────────
  const facilityRaw = clean(form.get('facility_id'))
  const facilityOtherName = clean(form.get('facility_other_name'))
  const department = clean(form.get('department'))
  const issueLocation = clean(form.get('issue_location'))
  const problemDescription = clean(form.get('problem_description'))
  const reportedByName = clean(form.get('reported_by_name'))
  const reporterEmail = clean(form.get('reporter_email'))
  const reporterPhone = clean(form.get('reporter_phone'))

  if (!EMAIL_RE.test(reporterEmail) || reporterEmail.length > 254) return json({ error: EMAIL_ERROR }, 400)

  const limits: [string, string, number][] = [
    ['Department', department, 150], ['Location of the issue', issueLocation, 250],
    ['Problem description', problemDescription, 4000], ['Reported by', reportedByName, 150],
    ['Building name', facilityOtherName, 150], ['Phone', reporterPhone, 40],
  ]
  for (const [label, value, max] of limits) {
    if (value.length > max) return json({ error: `${label} is too long (max ${max} characters).` }, 400)
  }
  if (!department || !issueLocation || !problemDescription || !reportedByName) {
    return json({ error: 'Please fill in all required fields.' }, 400)
  }

  let facilityId: number | null = null
  let facilityName = facilityOtherName
  if (facilityRaw === 'other') {
    if (!facilityOtherName) return json({ error: 'Please enter the building or property name.' }, 400)
  } else {
    if (!/^\d+$/.test(facilityRaw)) return json({ error: 'Please choose a building.' }, 400)
    const res = await rest(`city_facilities?select=id,name&id=eq.${facilityRaw}&is_active=eq.true`)
    const rows = await res.json()
    if (!rows?.[0]) return json({ error: 'Please choose a building.' }, 400)
    facilityId = rows[0].id
    facilityName = rows[0].name
  }

  // ── Attachment validation (count, size, and real image type from magic bytes) ─────────
  const photoEntries = form.getAll('photos').filter((f): f is File => typeof f !== 'string' && f.size > 0)
  if (photoEntries.length > MAX_FILES) return json({ error: `You can attach up to ${MAX_FILES} photos.` }, 400)
  const photos: { bytes: Uint8Array; type: string; ext: string; name: string }[] = []
  for (const file of photoEntries) {
    if (file.size > MAX_FILE_BYTES) return json({ error: 'Each photo must be 5 MB or smaller.' }, 400)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const detected = detectImageType(bytes)
    if (!detected) return json({ error: 'Only image files (JPG, PNG, WEBP, HEIC) can be attached.' }, 400)
    photos.push({ bytes, type: detected.type, ext: detected.ext, name: safeFileName(file.name) })
  }

  // ── Create the report ────────────────────────────────────────────────────────────────
  const numRes = await rest('rpc/next_jlc_confirmation_number', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  const confirmationNumber = await numRes.json()
  if (!numRes.ok || typeof confirmationNumber !== 'string') {
    console.error('confirmation number failed', confirmationNumber)
    return json({ error: 'Could not save your report. Please try again.' }, 500)
  }

  const insertRes = await rest('facility_repair_reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      confirmation_number: confirmationNumber,
      facility_id: facilityId,
      facility_other_name: facilityId === null ? facilityOtherName : null,
      department,
      issue_location: issueLocation,
      problem_description: problemDescription,
      reported_by_name: reportedByName,
      reporter_email: reporterEmail.toLowerCase(),
      reporter_phone: reporterPhone || null,
    }),
  })
  const inserted = await insertRes.json()
  const report = inserted?.[0]
  if (!insertRes.ok || !report) {
    console.error('report insert failed', inserted)
    return json({ error: 'Could not save your report. Please try again.' }, 500)
  }

  // Upload photos; on any failure undo everything so a half-saved report never lingers.
  const uploaded: string[] = []
  const rollback = async () => {
    for (const path of uploaded) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', headers: authHeaders })
    }
    await rest(`facility_repair_reports?id=eq.${report.id}`, { method: 'DELETE' })
  }
  for (const photo of photos) {
    const path = `${report.id}/${crypto.randomUUID()}.${photo.ext}`
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': photo.type, 'x-upsert': 'false' },
      body: photo.bytes,
    })
    if (!up.ok) {
      console.error('photo upload failed', up.status, await up.text())
      await rollback()
      return json({ error: 'A photo could not be uploaded. Please try again.' }, 500)
    }
    uploaded.push(path)
    const attach = await rest('facility_repair_attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ report_id: report.id, storage_path: path, file_name: photo.name, file_size: photo.bytes.length, content_type: photo.type }),
    })
    if (!attach.ok) {
      console.error('attachment insert failed', await attach.text())
      await rollback()
      return json({ error: 'A photo could not be saved. Please try again.' }, 500)
    }
  }

  // ── Emails (failures never fail the submission) ──────────────────────────────────────
  try {
    // Reporter: confirmation number only. Deliberately NO problem description or location.
    await sendBrevoEmail(
      reporterEmail,
      `Facility Repair Report Received — ${confirmationNumber}`,
      emailShell('Facility Repair Report Received', `
        <p style="font-size: 15px; color: #111827;">A facility repair report was submitted using this email address.</p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin-bottom: 4px;">Confirmation Number</div>
          <div style="font-size: 26px; font-weight: 700; color: #1e40af;">${escapeHtml(confirmationNumber)}</div>
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">Keep this number for your records. Submitting a report does not guarantee follow-up.</p>`),
    )

    // MSD and the City Manager's Office: a heads-up with minimal detail -- they log in to see
    // the report itself. (Both can open the JLC tab, so both are told when something arrives.)
    const recipients = new Set<string>()
    for (const deptName of ['MSD', 'City Manager']) {
      const deptRes = await rest(`departments?select=id&name=eq.${encodeURIComponent(deptName)}`)
      const deptId = (await deptRes.json())?.[0]?.id
      if (!deptId) continue
      for (const e of await resolveDepartmentRecipients(deptId, deptName, serviceRoleKey, SUPABASE_URL)) {
        recipients.add(e.toLowerCase())
      }
    }
    for (const e of (Deno.env.get('JLC_NOTIFY_EMAIL') || '').split(',')) {
      if (e.trim()) recipients.add(e.trim())
    }
    const notifyHtml = emailShell('New Facility Repair Report', `
      <p style="font-size: 15px; color: #111827;">A new facility repair report has been submitted.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;"><tbody>
        <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; width: 150px;">Confirmation #</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${escapeHtml(confirmationNumber)}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Building</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${escapeHtml(facilityName)}</td></tr>
        <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Reported by</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${escapeHtml(reportedByName)} (${escapeHtml(department)})</td></tr>
      </tbody></table>
      <div style="margin: 24px 0;">
        <a href="${SITE_URL}/?page=jlc-repairs" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Log In to View the Report</a>
      </div>`)
    for (const to of recipients) {
      await sendBrevoEmail(to, `New JLC Facility Repair Report — ${confirmationNumber}`, notifyHtml)
    }
  } catch (e) {
    console.error('JLC email error', e)
  }

  return json({ ok: true, confirmationNumber })
})
