import { useState } from 'react'
import { SUPABASE_URL, CAR_STATUS_LABELS, CAR_PROGRESS_STEPS, CAR_WORK_SESSION_STATUSES } from './carConfig'
import { CAR_FIELD_GUIDANCE, CAR_ATTACHMENTS_GUIDANCE, CAR_RESOLUTION_NOTE } from './carGuidance'
import CarAttachments from './CarAttachments'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '760px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box', minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' },
  button: { padding: '12px 28px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '12px 28px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  errorBox: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '28px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  guidance: { fontSize: '12px', color: '#6b7280', marginBottom: '4px' },
  progressWrap: { display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' },
  step: (state) => ({
    flex: 1, minWidth: '90px', textAlign: 'center', padding: '10px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
    backgroundColor: state === 'done' ? '#d1fae5' : state === 'current' ? '#dbeafe' : '#f3f4f6',
    color: state === 'done' ? '#065f46' : state === 'current' ? '#1e40af' : '#9ca3af',
  }),
  banner: (tone) => ({
    backgroundColor: tone === 'warn' ? '#fef3c7' : tone === 'success' ? '#d1fae5' : '#fee2e2',
    border: `1px solid ${tone === 'warn' ? '#fde68a' : tone === 'success' ? '#6ee7b7' : '#fca5a5'}`,
    borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px',
    color: tone === 'warn' ? '#92400e' : tone === 'success' ? '#065f46' : '#991b1b',
  }),
  activityRow: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  activityDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a56a0', marginTop: '5px', flexShrink: 0 },
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function CarStatus() {
  const [submissionNumberInput, setSubmissionNumberInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupError, setLookupError] = useState(null)

  const [data, setData] = useState(null)
  const [fields, setFields] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [missingFields, setMissingFields] = useState([])
  const [answerText, setAnswerText] = useState('')
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [answerError, setAnswerError] = useState(null)

  async function callOrgAction(action, extra) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/car-org-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ submissionNumber: submissionNumberInput.trim(), pin: pinInput.trim(), action, ...extra }),
    })
    return res.json()
  }

  async function handleLookup(e) {
    e.preventDefault()
    setLoading(true)
    setLookupError(null)
    const result = await callOrgAction('lookup', {})
    setLoading(false)
    if (result.error) {
      setLookupError(result.error)
      return
    }
    setData(result)
    const f = {}
    for (const key of Object.keys(CAR_FIELD_GUIDANCE)) f[key] = result.submission[key] || ''
    f.requires_resolution = String(result.submission.requires_resolution)
    f.requires_public_hearing = String(result.submission.requires_public_hearing)
    setFields(f)
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
    const refreshed = await callOrgAction('lookup', {})
    if (!refreshed.error) setData(refreshed)
  }

  async function handleSaveAnswer() {
    setSavingAnswer(true)
    setAnswerError(null)
    const result = await callOrgAction('save_answer', { answerText })
    setSavingAnswer(false)
    if (result.error) {
      setAnswerError(result.error)
      return
    }
    const refreshed = await callOrgAction('lookup', {})
    if (!refreshed.error) setData(refreshed)
  }

  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Check CAR Status</h1>
          <p style={s.subtitle}>Enter the submission number and PIN you received when you submitted your Council Action Report.</p>
          {lookupError && <div style={s.errorBox}>{lookupError}</div>}
          <form onSubmit={handleLookup}>
            <label style={s.label}>Submission Number</label>
            <input style={s.input} value={submissionNumberInput} onChange={e => setSubmissionNumberInput(e.target.value)} placeholder="CAR-2026-1" required />
            <label style={s.label}>PIN</label>
            <input style={s.input} value={pinInput} onChange={e => setPinInput(e.target.value)} required />
            <button type="submit" disabled={loading} style={loading ? s.buttonDisabled : s.button}>
              {loading ? 'Checking…' : 'Check Status'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { submission, attachments, activityLog, editable } = data
  const isWorkSessionTrack = CAR_WORK_SESSION_STATUSES.includes(submission.status)
  const currentIndex = isWorkSessionTrack ? 1 : CAR_PROGRESS_STEPS.indexOf(submission.status)

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>{submission.subject || 'Council Action Report'}</h1>
        <p style={s.subtitle}>Submission {submission.submission_number} · Status: {CAR_STATUS_LABELS[submission.status]}</p>

        {!isWorkSessionTrack && (
          <div style={s.progressWrap}>
            {CAR_PROGRESS_STEPS.map((stepKey, i) => {
              const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
              return <div key={stepKey} style={s.step(state)}>{CAR_STATUS_LABELS[stepKey]}</div>
            })}
          </div>
        )}

        {isWorkSessionTrack && (
          <div style={s.banner('warn')}>
            <strong>Hot-button item:</strong> this CAR has been approved for a Council work session before it can move to a packet. Current status: {CAR_STATUS_LABELS[submission.status]}.
          </div>
        )}

        {submission.status === 'rejected' && (
          <div style={s.banner('error')}>
            <strong>Not approved.</strong> {submission.review_note ? `Note: ${submission.review_note}` : 'This CAR was not approved for the Council agenda.'}
          </div>
        )}

        {submission.status === 'included_in_packet' || submission.status === 'packet_published' || submission.status === 'decided_at_meeting' ? (
          <div style={s.banner('success')}>This CAR is included in the meeting packet.</div>
        ) : null}

        {editable && (
          <>
            <div style={s.sectionTitle}>Edit Your Submission</div>
            {Object.entries(CAR_FIELD_GUIDANCE).map(([key, field]) => (
              <div key={key}>
                <label style={s.label}>{field.label}</label>
                <div style={s.guidance}>{field.guidance}</div>
                {key === 'from_field' || key === 'subject' ? (
                  <input style={s.input} value={fields[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} onBlur={() => handleFieldBlur(key)} />
                ) : (
                  <textarea style={s.textarea} value={fields[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} onBlur={() => handleFieldBlur(key)} />
                )}
              </div>
            ))}

            <label style={s.label}>Requires a resolution?</label>
            <div style={{ marginBottom: '14px' }}>
              <button type="button" onClick={() => handleToggle('requires_resolution', 'true')} style={{ ...s.button, backgroundColor: fields.requires_resolution === 'true' ? '#1a56a0' : '#ffffff', color: fields.requires_resolution === 'true' ? '#fff' : '#374151', border: '1px solid #d1d5db', marginRight: '8px', padding: '8px 16px' }}>Yes</button>
              <button type="button" onClick={() => handleToggle('requires_resolution', 'false')} style={{ ...s.button, backgroundColor: fields.requires_resolution !== 'true' ? '#1a56a0' : '#ffffff', color: fields.requires_resolution !== 'true' ? '#fff' : '#374151', border: '1px solid #d1d5db', padding: '8px 16px' }}>No</button>
            </div>
            {fields.requires_resolution === 'true' && <div style={s.guidance}>{CAR_RESOLUTION_NOTE}</div>}

            <div style={s.sectionTitle}>Attachments / Exhibits</div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{CAR_ATTACHMENTS_GUIDANCE}</p>
            <CarAttachments carSubmissionId={submission.id} canUpload={true} uploadedBy={submission.submitter_name} />

            {submitError && (
              <div style={{ ...s.errorBox, marginTop: '20px' }}>
                <div>{submitError}</div>
                {missingFields.length > 0 && <ul style={{ marginTop: '8px', marginBottom: 0 }}>{missingFields.map((m, i) => <li key={i}>{m}</li>)}</ul>}
              </div>
            )}
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleSubmit} disabled={submitting} style={submitting ? s.buttonDisabled : s.button}>
                {submitting ? 'Saving…' : 'Confirm Submission'}
              </button>
            </div>
          </>
        )}

        {!editable && (
          <>
            <div style={s.sectionTitle}>Submission Details</div>
            {Object.entries(CAR_FIELD_GUIDANCE).map(([key, field]) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>{field.label}</div>
                <div style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap' }}>{submission[key] || '—'}</div>
              </div>
            ))}
            <div style={s.sectionTitle}>Attachments</div>
            <CarAttachments carSubmissionId={submission.id} canUpload={false} />
          </>
        )}

        {submission.status === 'answer_due' && (
          <>
            <div style={s.sectionTitle}>Submit Your Answer</div>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Following the Council work session, provide a written answer for the record.</p>
            <textarea style={s.textarea} value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Write your answer here..." />
            {answerError && <div style={s.errorBox}>{answerError}</div>}
            <button onClick={handleSaveAnswer} disabled={savingAnswer} style={savingAnswer ? s.buttonDisabled : s.button}>
              {savingAnswer ? 'Submitting…' : 'Submit Answer'}
            </button>
          </>
        )}

        {submission.status === 'answer_submitted' && submission.answer_text && (
          <>
            <div style={s.sectionTitle}>Your Submitted Answer</div>
            <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap' }}>{submission.answer_text}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Submitted {formatDateTime(submission.answer_submitted_at)} — awaiting sign-off.</p>
          </>
        )}

        <div style={s.sectionTitle}>Activity History</div>
        {activityLog.map(entry => (
          <div key={entry.id} style={s.activityRow}>
            <div style={s.activityDot} />
            <div>
              <div style={{ fontSize: '13px', color: '#374151' }}>{entry.action_type.replace(/_/g, ' ')}{entry.notes ? ` — ${entry.notes}` : ''}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{entry.actor_name} · {formatDateTime(entry.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CarStatus
