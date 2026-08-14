import { useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL, MOU_STAGE_LABELS, MOU_PROGRESS_STEPS } from './mouConfig'
import { buildFieldsByKey, parseMouLockedText } from './mouTextRender'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const MAX_FILES = 6
const MAX_FILE_SIZE = 5 * 1024 * 1024

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
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '28px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  lockedText: { fontSize: '13px', color: '#374151', lineHeight: 1.7, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px', whiteSpace: 'pre-wrap' },
  token: { color: '#1a56a0', fontWeight: '600', backgroundColor: '#eff6ff', padding: '0 3px', borderRadius: '3px' },
  fieldRow: { marginBottom: '14px' },
  guidance: { fontSize: '12px', color: '#9ca3af', marginTop: '-12px', marginBottom: '10px' },
  toggleRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
  toggleBtn: (active, disabled) => ({ padding: '8px 18px', borderRadius: '6px', border: active ? '2px solid #1a56a0' : '1px solid #d1d5db', backgroundColor: active ? '#eff6ff' : '#ffffff', color: active ? '#1a56a0' : '#374151', fontWeight: '600', fontSize: '13px', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1 }),
  progressWrap: { display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' },
  step: (state) => ({
    flex: 1, minWidth: '90px', textAlign: 'center', padding: '10px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
    backgroundColor: state === 'done' ? '#d1fae5' : state === 'current' ? '#dbeafe' : '#f3f4f6',
    color: state === 'done' ? '#065f46' : state === 'current' ? '#1e40af' : '#9ca3af',
  }),
  loopBanner: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#92400e' },
  commentCard: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px 14px', marginBottom: '10px' },
  commentMeta: { fontSize: '11px', color: '#6b7280', marginBottom: '4px' },
  activityRow: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  activityDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a56a0', marginTop: '5px', flexShrink: 0 },
}

function renderLockedText(text, valuesByKey, fieldsByKey) {
  return parseMouLockedText(text, valuesByKey, fieldsByKey).map((seg, i) =>
    seg.type === 'text'
      ? <span key={i}>{seg.text}</span>
      : <span key={i} style={s.token}>{seg.displayValue || `[${seg.key.replace(/_/g, ' ')}]`}</span>
  )
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function MouStatus() {
  const [submissionNumberInput, setSubmissionNumberInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupError, setLookupError] = useState(null)

  const [data, setData] = useState(null)
  const [fieldValues, setFieldValues] = useState({})
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [missingFields, setMissingFields] = useState([])
  const [justResubmitted, setJustResubmitted] = useState(false)

  async function callOrgAction(action, extra) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/mou-org-action`, {
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
    const values = {}
    for (const fv of result.fieldValues) values[fv.field_key] = fv.value
    setFieldValues(values)
  }

  function handleFieldChange(key, value) {
    setFieldValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleFieldBlur(sectionId, key) {
    await callOrgAction('save_field', { templateSectionId: sectionId, fieldKey: key, value: fieldValues[key] ?? '' })
  }

  async function handleUpload(selectedFiles) {
    if (!selectedFiles || selectedFiles.length === 0) return
    setUploading(true)
    const existing = data.supportingDocuments || []
    for (const file of selectedFiles) {
      if (existing.length >= MAX_FILES) break
      if (file.size > MAX_FILE_SIZE) continue
      const safeName = `${data.submission.submission_number}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: uploadErr } = await supabase.storage.from('mou-documents').upload(safeName, file)
      if (uploadErr) continue
      await supabase.from('mou_supporting_documents').insert([{
        submission_id: data.submission.id,
        file_name: file.name,
        file_path: safeName,
        file_size: file.size,
        uploaded_by: data.submission.org_contact_name,
      }])
    }
    setUploading(false)
    const refreshed = await callOrgAction('lookup', {})
    if (!refreshed.error) setData(refreshed)
  }

  async function handleResubmit() {
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
    setJustResubmitted(true)
    const refreshed = await callOrgAction('lookup', {})
    if (!refreshed.error) setData(refreshed)
  }

  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Check MOU Status</h1>
          <p style={s.subtitle}>Enter the submission number and PIN you received when you started your MOU proposal.</p>
          {lookupError && <div style={s.errorBox}>{lookupError}</div>}
          <form onSubmit={handleLookup}>
            <label style={s.label}>Submission Number</label>
            <input style={s.input} value={submissionNumberInput} onChange={e => setSubmissionNumberInput(e.target.value)} placeholder="MOU-2026-1" required />
            <label style={s.label}>PIN</label>
            <input style={s.input} value={pinInput} onChange={e => setPinInput(e.target.value)} required />
            <button type="submit" disabled={loading} style={loading ? s.buttonDisabled : s.button}>
              {loading ? 'Checking…' : 'Check Status'}
            </button>
          </form>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
            Lost your submission number or PIN? Email <a href="mailto:bdemers@franklinnh.gov" style={{ color: '#1a56a0' }}>bdemers@franklinnh.gov</a> with your organization name and we'll help you recover it.
          </p>
        </div>
      </div>
    )
  }

  const { submission, sections, sectionComments, reviewComments, supportingDocuments, activityLog, editable } = data
  const fieldsByKey = buildFieldsByKey(sections)
  const currentIndex = MOU_PROGRESS_STEPS.indexOf(submission.current_stage === 'org_revision' ? (submission.return_to_stage || 'brenda_review') : submission.current_stage)

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>{submission.org_name}</h1>
        <p style={s.subtitle}>Submission {submission.submission_number}</p>

        <div style={s.progressWrap}>
          {MOU_PROGRESS_STEPS.map((stepKey, i) => {
            const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
            return <div key={stepKey} style={s.step(state)}>{MOU_STAGE_LABELS[stepKey]}</div>
          })}
        </div>

        {submission.current_stage === 'org_revision' && (
          <div style={s.loopBanner}>
            <strong>Action needed:</strong> the City has sent this submission back for changes or clarification. Update the fields below and resubmit when ready.
          </div>
        )}

        {justResubmitted && (
          <div style={{ ...s.loopBanner, backgroundColor: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }}>
            Resubmitted — the City has been notified.
          </div>
        )}

        {submission.council_decision && (
          <div style={s.loopBanner}>
            <strong>City Council decision:</strong> {submission.council_decision === 'approved' ? 'Approved' : submission.council_decision === 'disapproved' ? 'Disapproved' : 'Sent back for edits'}
            {submission.council_decision_date ? ` on ${formatDateTime(submission.council_decision_date)}` : ''}
          </div>
        )}

        {reviewComments.length > 0 && (
          <>
            <div style={s.sectionTitle}>Comments from the City</div>
            {reviewComments.map(c => (
              <div key={c.id} style={s.commentCard}>
                <div style={s.commentMeta}>{c.author_name} · {formatDateTime(c.created_at)}</div>
                <div style={{ fontSize: '13px', color: '#111827' }}>{c.comment_text}</div>
              </div>
            ))}
          </>
        )}

        <div style={s.sectionTitle}>Submission Contents</div>
        {sections.map(section => {
          const ownComments = sectionComments.filter(c => c.template_section_id === section.id)
          return (
            <div key={section.id}>
              <div style={{ fontWeight: '700', color: '#374151', fontSize: '14px', marginTop: '18px', marginBottom: '6px' }}>{section.title}</div>
              <div style={s.lockedText}>{renderLockedText(section.locked_text, fieldValues, fieldsByKey)}</div>
              {editable && (section.field_definitions || []).map(field => {
                if (field.conditional_on && fieldValues[field.conditional_on] !== 'yes') return null
                return (
                  <div key={field.key} style={s.fieldRow}>
                    <label style={s.label}>{field.label}</label>
                    {field.type === 'yes_na_toggle' ? (
                      <div style={s.toggleRow}>
                        <button type="button" style={s.toggleBtn(fieldValues[field.key] === 'yes')}
                          onClick={() => { handleFieldChange(field.key, 'yes'); callOrgAction('save_field', { templateSectionId: section.id, fieldKey: field.key, value: 'yes' }) }}>Yes</button>
                        <button type="button" style={s.toggleBtn(fieldValues[field.key] === 'no')}
                          onClick={() => { handleFieldChange(field.key, 'no'); callOrgAction('save_field', { templateSectionId: section.id, fieldKey: field.key, value: 'no' }) }}>Not Applicable</button>
                      </div>
                    ) : field.type === 'long_text' || field.type === 'list' ? (
                      <textarea style={s.textarea} value={fieldValues[field.key] || ''} onChange={e => handleFieldChange(field.key, e.target.value)} onBlur={() => handleFieldBlur(section.id, field.key)} />
                    ) : field.type === 'date' ? (
                      <input type="date" style={s.input} value={fieldValues[field.key] || ''} onChange={e => handleFieldChange(field.key, e.target.value)} onBlur={() => handleFieldBlur(section.id, field.key)} />
                    ) : (
                      <input type="text" style={s.input} value={fieldValues[field.key] || ''} onChange={e => handleFieldChange(field.key, e.target.value)} onBlur={() => handleFieldBlur(section.id, field.key)} />
                    )}
                    {field.guidance && <div style={s.guidance}>{field.guidance}</div>}
                  </div>
                )
              })}
              {ownComments.map(c => (
                <div key={c.id} style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '10px' }}>Your note: "{c.comment_text}"</div>
              ))}
            </div>
          )
        })}

        <div style={s.sectionTitle}>Supporting Documents</div>
        {supportingDocuments.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>No documents uploaded.</div>
        ) : (
          <ul style={{ fontSize: '13px', color: '#374151' }}>
            {supportingDocuments.map(f => <li key={f.id}>{f.file_name}</li>)}
          </ul>
        )}
        {editable && (
          <input type="file" multiple disabled={uploading} onChange={e => handleUpload(Array.from(e.target.files))} style={{ marginTop: '8px' }} />
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

        {editable && (
          <>
            {submitError && (
              <div style={{ ...s.errorBox, marginTop: '20px' }}>
                <div>{submitError}</div>
                {missingFields.length > 0 && (
                  <ul style={{ marginTop: '8px', marginBottom: 0 }}>{missingFields.map((m, i) => <li key={i}>{m}</li>)}</ul>
                )}
              </div>
            )}
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleResubmit} disabled={submitting} style={submitting ? s.buttonDisabled : s.button}>
                {submitting ? 'Resubmitting…' : 'Resubmit for Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MouStatus
