import { useState } from 'react'
import { SUPABASE_URL } from './carConfig'
import { CAR_INTRO, CAR_REQUIRES_LIST, CAR_REQUIRES_NOTE, CAR_SUBMISSION_TIMELINE, CAR_FIELD_GUIDANCE, CAR_ATTACHMENTS_GUIDANCE, CAR_RESOLUTION_NOTE } from './carGuidance'
import CarAttachments from './CarAttachments'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '760px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  introBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px 24px', marginBottom: '24px' },
  introList: { fontSize: '13px', color: '#374151', lineHeight: 1.8, margin: '10px 0' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box', minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' },
  guidance: { fontSize: '12px', color: '#6b7280', marginBottom: '4px', lineHeight: 1.5 },
  example: { fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '14px' },
  button: { padding: '12px 28px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '12px 28px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  pinBox: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '24px' },
  pinValue: { fontSize: '32px', fontWeight: '700', color: '#92400e', letterSpacing: '4px', margin: '8px 0' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '28px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  toggleRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
  toggleBtn: (active) => ({ padding: '8px 18px', borderRadius: '6px', border: active ? '2px solid #1a56a0' : '1px solid #d1d5db', backgroundColor: active ? '#eff6ff' : '#ffffff', color: active ? '#1a56a0' : '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }),
  motionWrapper: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 },
  errorBox: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
  successBox: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '24px', textAlign: 'center' },
}

function CarSubmit() {
  const [phase, setPhase] = useState('start')
  const [submitterType, setSubmitterType] = useState('public')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [submitterPhone, setSubmitterPhone] = useState('')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(null)

  const [submissionId, setSubmissionId] = useState(null)
  const [submissionNumber, setSubmissionNumber] = useState(null)
  const [pin, setPin] = useState(null)
  const [fields, setFields] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [missingFields, setMissingFields] = useState([])

  async function callOrgAction(action, extra) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/car-org-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ submissionNumber, pin, action, ...extra }),
    })
    return res.json()
  }

  async function handleStart(e) {
    e.preventDefault()
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/car-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ submitterType, submitterName, submitterEmail, submitterPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start submission')
      setSubmissionId(data.submissionId)
      setSubmissionNumber(data.submissionNumber)
      setPin(data.pin)
      setPhase('filling')
    } catch (err) {
      setStartError(err.message)
    } finally {
      setStarting(false)
    }
  }

  function handleFieldChange(key, value) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleFieldBlur(key) {
    await callOrgAction('save_field', { fieldKey: key, value: fields[key] ?? '' })
  }

  async function handleToggle(key, value) {
    handleFieldChange(key, value)
    await callOrgAction('save_field', { fieldKey: key, value })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    setMissingFields([])
    const result = await callOrgAction('submit', {})
    setSubmitting(false)
    if (result.error) {
      setSubmitError(result.error)
      setMissingFields(result.missing || [])
      return
    }
    setPhase('submitted')
  }

  if (phase === 'start') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Submit a Council Action Report (CAR)</h1>
          <div style={s.introBox}>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{CAR_INTRO}</p>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginTop: '14px', marginBottom: '6px' }}>A CAR should be submitted when Council is being asked to take formal action, including:</p>
            <ul style={s.introList}>
              {CAR_REQUIRES_LIST.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>{CAR_REQUIRES_NOTE}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>{CAR_SUBMISSION_TIMELINE}</p>
          </div>
          {startError && <div style={s.errorBox}>{startError}</div>}
          <form onSubmit={handleStart}>
            <label style={s.label}>Submitter Type</label>
            <select style={s.input} value={submitterType} onChange={e => setSubmitterType(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="council">Council</option>
              <option value="public">Public</option>
            </select>
            <label style={s.label}>Your Name</label>
            <input style={s.input} value={submitterName} onChange={e => setSubmitterName(e.target.value)} required />
            <label style={s.label}>Your Email</label>
            <input style={s.input} type="email" value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)} required />
            <label style={s.label}>Your Phone (optional)</label>
            <input style={{ ...s.input, marginBottom: '16px' }} type="tel" value={submitterPhone} onChange={e => setSubmitterPhone(e.target.value)} />
            <button type="submit" disabled={starting} style={starting ? s.buttonDisabled : s.button}>
              {starting ? 'Starting…' : 'Start CAR Submission'}
            </button>
          </form>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '20px' }}>
            Already started one? <a href="?page=car-status" style={{ color: '#1a56a0' }}>Check status / resume filling</a>
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.successBox}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#065f46', marginBottom: '8px' }}>Submission Received</div>
            <div style={{ fontSize: '14px', color: '#065f46' }}>
              Your CAR <strong>{submissionNumber}</strong> has been submitted for review. Submission of a CAR does not guarantee placement on a Council agenda.
              Keep your PIN — you'll need it to check status.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // phase === 'filling'
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.pinBox}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Save This Now</div>
          <div style={{ fontSize: '13px', color: '#92400e', marginTop: '4px' }}>Submission Number</div>
          <div style={s.pinValue}>{submissionNumber}</div>
          <div style={{ fontSize: '13px', color: '#92400e' }}>PIN</div>
          <div style={s.pinValue}>{pin}</div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>
            You'll need both to resume filling this out or check its status later. This PIN will not be emailed to you.
          </div>
        </div>

        <h1 style={s.title}>Council Action Report</h1>
        <p style={s.subtitle}>Fill in each field below. Your answers are saved automatically as you go.</p>

        {Object.entries(CAR_FIELD_GUIDANCE).map(([key, field]) => (
          <div key={key}>
            <label style={s.label}>{field.label} *</label>
            <div style={s.guidance}>{field.guidance}</div>
            {field.examples.map((ex, i) => <div key={i} style={s.example}>e.g. "{ex}"</div>)}
            {key === 'suggested_motion' ? (
              <div style={s.motionWrapper}>
                Councilor moves: "
                <textarea
                  style={{ ...s.textarea, display: 'inline-block', width: 'calc(100% - 20px)', marginBottom: 0, verticalAlign: 'top' }}
                  value={fields[key] || ''}
                  onChange={e => handleFieldChange(key, e.target.value)}
                  onBlur={() => handleFieldBlur(key)}
                />
                "
                <div style={{ marginTop: '10px' }}>Mayor calls for a second, discussion, and vote.</div>
              </div>
            ) : key === 'from_field' || key === 'subject' ? (
              <input style={s.input} value={fields[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} onBlur={() => handleFieldBlur(key)} />
            ) : (
              <textarea style={s.textarea} value={fields[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} onBlur={() => handleFieldBlur(key)} />
            )}
          </div>
        ))}

        <div style={s.sectionTitle}>Additional Details</div>

        <label style={s.label}>Does this request require formal Council action by resolution?</label>
        <div style={s.toggleRow}>
          <button type="button" style={s.toggleBtn(fields.requires_resolution === 'true')} onClick={() => handleToggle('requires_resolution', 'true')}>Yes</button>
          <button type="button" style={s.toggleBtn(fields.requires_resolution === 'false' || !fields.requires_resolution)} onClick={() => handleToggle('requires_resolution', 'false')}>No</button>
        </div>
        {fields.requires_resolution === 'true' && <div style={s.guidance}>{CAR_RESOLUTION_NOTE}</div>}

        <label style={{ ...s.label, marginTop: '14px' }}>Does this item require a public hearing?</label>
        <div style={s.toggleRow}>
          <button type="button" style={s.toggleBtn(fields.requires_public_hearing === 'true')} onClick={() => handleToggle('requires_public_hearing', 'true')}>Yes</button>
          <button type="button" style={s.toggleBtn(fields.requires_public_hearing === 'false' || !fields.requires_public_hearing)} onClick={() => handleToggle('requires_public_hearing', 'false')}>No</button>
        </div>

        <div style={s.sectionTitle}>Attachments / Exhibits</div>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>{CAR_ATTACHMENTS_GUIDANCE}</p>
        <CarAttachments carSubmissionId={submissionId} canUpload={true} uploadedBy={submitterName || 'Public'} />

        {submitError && (
          <div style={s.errorBox}>
            <div>{submitError}</div>
            {missingFields.length > 0 && (
              <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                {missingFields.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            )}
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <button onClick={handleSubmit} disabled={submitting} style={submitting ? s.buttonDisabled : s.button}>
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CarSubmit
