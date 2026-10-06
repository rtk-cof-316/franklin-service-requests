import { useEffect, useRef, useState } from 'react'
import {
  JLC_FORM_TITLE, JLC_FORM_SUBTITLE, JLC_DISCLAIMER, JLC_EMAIL_ERROR, JLC_MAX_PHOTOS, JLC_MAX_PHOTO_BYTES,
  SUPABASE_URL, SUPABASE_ANON_KEY, TURNSTILE_SITE_KEY, isValidJlcEmail,
} from './jlcConfig'

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '680px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px', textAlign: 'left' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a56a0', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' },
  req: { color: '#dc2626' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', minHeight: '110px', fontFamily: 'inherit', resize: 'vertical' },
  hint: { fontSize: '12px', color: '#6b7280', marginTop: '-10px', marginBottom: '16px' },
  button: { padding: '12px 28px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '12px 28px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  linkBtn: { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px', marginLeft: '8px' },
  error: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
  disclaimer: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px 14px', margin: '8px 0 20px 0', fontSize: '12px', color: '#92400e', lineHeight: 1.5 },
  success: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '28px', textAlign: 'center' },
  number: { fontSize: '30px', fontWeight: '700', color: '#065f46', letterSpacing: '1px', margin: '10px 0' },
  // Visually hidden but still in the DOM for bots; real people never see or tab to it.
  honeypot: { position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' },
}

const EMPTY = { facility_id: '', facility_other_name: '', department: '', issue_location: '', problem_description: '', reported_by_name: '', reporter_email: '', reporter_phone: '' }

function JlcReportForm() {
  const [facilities, setFacilities] = useState([])
  const [facilitiesError, setFacilitiesError] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const honeypotRef = useRef(null)
  const turnstileRef = useRef(null)
  const turnstileWidgetId = useRef(null)

  // Unlisted page: keep it out of search indexes (a header does the same server-side).
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow, noarchive'
    document.head.appendChild(meta)
    const previousTitle = document.title
    document.title = JLC_FORM_TITLE
    return () => { document.head.removeChild(meta); document.title = previousTitle }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`${SUPABASE_URL}/functions/v1/jlc-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ action: 'facilities' }),
    })
      .then(r => r.json())
      .then(d => { if (!cancelled) setFacilities(d.facilities || []) })
      .catch(() => { if (!cancelled) setFacilitiesError(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || confirmation) return
    function render() {
      if (!window.turnstile || !turnstileRef.current || turnstileWidgetId.current !== null) return
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: setTurnstileToken,
        'expired-callback': () => setTurnstileToken(''),
      })
    }
    if (window.turnstile) { render(); return }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = render
    document.head.appendChild(script)
  }, [confirmation])

  function update(name, value) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handlePhotos(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    const next = [...photos]
    for (const file of picked) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED_EXT.includes(ext)) { setError('Only image files (JPG, PNG, WEBP, HEIC) can be attached.'); return }
      if (file.size > JLC_MAX_PHOTO_BYTES) { setError('Each photo must be 5 MB or smaller.'); return }
      if (next.length >= JLC_MAX_PHOTOS) { setError(`You can attach up to ${JLC_MAX_PHOTOS} photos.`); return }
      next.push(file)
    }
    setError('')
    setPhotos(next)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.facility_id) { setError('Please choose a building.'); return }
    if (form.facility_id === 'other' && !form.facility_other_name.trim()) { setError('Please enter the building or property name.'); return }
    if (!form.department.trim() || !form.issue_location.trim() || !form.problem_description.trim() || !form.reported_by_name.trim()) {
      setError('Please fill in all required fields.'); return
    }
    if (!isValidJlcEmail(form.reporter_email)) { setError(JLC_EMAIL_ERROR); return }
    if (TURNSTILE_SITE_KEY && !turnstileToken) { setError('Please complete the verification challenge.'); return }

    const body = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'facility_other_name' && form.facility_id !== 'other') return
      body.append(k, v.trim())
    })
    body.append('hp_website', honeypotRef.current?.value || '')
    if (turnstileToken) body.append('cf-turnstile-response', turnstileToken)
    photos.forEach(p => body.append('photos', p))

    setSubmitting(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/jlc-submit`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        if (window.turnstile && turnstileWidgetId.current !== null) { window.turnstile.reset(turnstileWidgetId.current); setTurnstileToken('') }
      } else {
        setConfirmation(data.confirmationNumber)
      }
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  function startOver() {
    setForm(EMPTY)
    setPhotos([])
    setConfirmation(null)
    setTurnstileToken('')
    turnstileWidgetId.current = null
  }

  if (confirmation) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.success}>
            <div style={{ fontSize: '36px', lineHeight: 1.2, marginBottom: '8px' }}>✓</div>
            <h1 style={{ ...s.title, color: '#065f46' }}>Your report has been received.</h1>
            <div style={{ fontSize: '13px', color: '#065f46' }}>Confirmation number</div>
            <div style={s.number}>{confirmation}</div>
            <div style={{ fontSize: '12px', color: '#047857' }}>Please keep this number for your records.</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button style={s.button} onClick={startOver}>Submit another report</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <form style={s.card} onSubmit={handleSubmit} noValidate>
        <h1 style={s.title}>{JLC_FORM_TITLE}</h1>
        <p style={s.subtitle}>{JLC_FORM_SUBTITLE}</p>

        {error && <div style={s.error} role="alert">{error}</div>}
        {facilitiesError && <div style={s.error}>The building list could not be loaded. You can still choose "Other city building."</div>}

        <label style={s.label} htmlFor="jlc-facility">Building <span style={s.req}>*</span></label>
        <select id="jlc-facility" style={s.input} value={form.facility_id} onChange={e => update('facility_id', e.target.value)}>
          <option value="">-- Select a building --</option>
          {facilities.map(f => <option key={f.id} value={f.id}>{f.name}{f.address ? ` — ${f.address}` : ''}</option>)}
          <option value="other">Other city building</option>
        </select>

        {form.facility_id === 'other' && (
          <>
            <label style={s.label} htmlFor="jlc-other">Building or property name <span style={s.req}>*</span></label>
            <input id="jlc-other" style={s.input} value={form.facility_other_name} maxLength={150} onChange={e => update('facility_other_name', e.target.value)} />
          </>
        )}

        <label style={s.label} htmlFor="jlc-dept">Department / office <span style={s.req}>*</span></label>
        <input id="jlc-dept" style={s.input} value={form.department} maxLength={150} placeholder="Which department or office are you in?" onChange={e => update('department', e.target.value)} />

        <label style={s.label} htmlFor="jlc-location">Specific location of the issue <span style={s.req}>*</span></label>
        <input id="jlc-location" style={s.input} value={form.issue_location} maxLength={250} placeholder="e.g. back stairwell, 2nd floor" onChange={e => update('issue_location', e.target.value)} />

        <label style={s.label} htmlFor="jlc-problem">Problem or repair needed <span style={s.req}>*</span></label>
        <textarea id="jlc-problem" style={s.textarea} value={form.problem_description} maxLength={4000} onChange={e => update('problem_description', e.target.value)} />

        <label style={s.label} htmlFor="jlc-name">Reported by <span style={s.req}>*</span></label>
        <input id="jlc-name" style={s.input} value={form.reported_by_name} maxLength={150} placeholder="Your name" onChange={e => update('reported_by_name', e.target.value)} />

        <label style={s.label} htmlFor="jlc-email">Your city email <span style={s.req}>*</span></label>
        <input id="jlc-email" type="email" style={s.input} value={form.reporter_email} maxLength={254} placeholder="name@franklinnh.gov" onChange={e => update('reporter_email', e.target.value)} />

        <label style={s.label} htmlFor="jlc-phone">Phone (optional)</label>
        <input id="jlc-phone" type="tel" style={s.input} value={form.reporter_phone} maxLength={40} onChange={e => update('reporter_phone', e.target.value)} />

        <label style={s.label} htmlFor="jlc-photos">Photos (optional, up to {JLC_MAX_PHOTOS}, 5 MB each)</label>
        <input id="jlc-photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple style={{ ...s.input, padding: '8px' }} onChange={handlePhotos} disabled={photos.length >= JLC_MAX_PHOTOS} />
        {photos.length > 0 && (
          <div style={{ marginTop: '-8px', marginBottom: '16px', fontSize: '13px', color: '#374151' }}>
            {photos.map((p, i) => (
              <div key={`${p.name}-${i}`}>
                {p.name} ({(p.size / 1024 / 1024).toFixed(1)} MB)
                <button type="button" style={s.linkBtn} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* Honeypot: hidden from people, irresistible to form-filling bots. */}
        <div style={s.honeypot} aria-hidden="true">
          <label>Leave this empty<input ref={honeypotRef} type="text" name="hp_website" tabIndex={-1} autoComplete="off" /></label>
        </div>

        {TURNSTILE_SITE_KEY && <div ref={turnstileRef} style={{ marginBottom: '16px' }} />}

        <div style={s.disclaimer}>{JLC_DISCLAIMER}</div>

        <button type="submit" style={submitting ? s.buttonDisabled : s.button} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit report'}
        </button>
      </form>
    </div>
  )
}

export default JlcReportForm
