import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL } from './mouConfig'
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
  pinBox: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '24px' },
  pinValue: { fontSize: '32px', fontWeight: '700', color: '#92400e', letterSpacing: '4px', margin: '8px 0' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '28px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  lockedText: { fontSize: '13px', color: '#374151', lineHeight: 1.7, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px', whiteSpace: 'pre-wrap' },
  token: { color: '#1a56a0', fontWeight: '600', backgroundColor: '#eff6ff', padding: '0 3px', borderRadius: '3px' },
  fieldRow: { marginBottom: '14px' },
  guidance: { fontSize: '12px', color: '#9ca3af', marginTop: '-12px', marginBottom: '10px' },
  commentBox: { fontSize: '12px', color: '#6b7280', marginTop: '8px' },
  toggleRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
  toggleBtn: (active) => ({ padding: '8px 18px', borderRadius: '6px', border: active ? '2px solid #1a56a0' : '1px solid #d1d5db', backgroundColor: active ? '#eff6ff' : '#ffffff', color: active ? '#1a56a0' : '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }),
  errorBox: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
  successBox: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '24px', textAlign: 'center' },
  saveHint: { fontSize: '11px', color: '#9ca3af', marginTop: '-10px', marginBottom: '14px' },
}

function renderLockedText(text, valuesByKey, fieldsByKey) {
  return parseMouLockedText(text, valuesByKey, fieldsByKey).map((seg, i) =>
    seg.type === 'text'
      ? <span key={i}>{seg.text}</span>
      : <span key={i} style={s.token}>{seg.displayValue || `[${seg.key.replace(/_/g, ' ')}]`}</span>
  )
}

function MouSubmit() {
  const [phase, setPhase] = useState('start')
  const [orgName, setOrgName] = useState('')
  const [orgContactName, setOrgContactName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(null)

  const [submissionNumber, setSubmissionNumber] = useState(null)
  const [pin, setPin] = useState(null)
  const [templateId, setTemplateId] = useState(null)
  const [sections, setSections] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [sectionComments, setSectionComments] = useState({})
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [missingFields, setMissingFields] = useState([])

  useEffect(() => {
    if (templateId) loadSections()
  }, [templateId])

  async function loadSections() {
    const { data } = await supabase
      .from('mou_template_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('section_order')
    setSections(data || [])
  }

  async function handleStart(e) {
    e.preventDefault()
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mou-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ orgName, orgContactName, orgEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start submission')
      setSubmissionNumber(data.submissionNumber)
      setPin(data.pin)
      setTemplateId(data.templateId)
      setPhase('filling')
    } catch (err) {
      setStartError(err.message)
    } finally {
      setStarting(false)
    }
  }

  async function callOrgAction(action, extra) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/mou-org-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ submissionNumber, pin, action, ...extra }),
    })
    return res.json()
  }

  function handleFieldChange(sectionId, key, value) {
    setFieldValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleFieldBlur(sectionId, key) {
    await callOrgAction('save_field', { templateSectionId: sectionId, fieldKey: key, value: fieldValues[key] ?? '' })
  }

  function handleCommentChange(sectionId, value) {
    setSectionComments(prev => ({ ...prev, [sectionId]: value }))
  }

  async function handleCommentBlur(sectionId) {
    const text = (sectionComments[sectionId] || '').trim()
    if (!text) return
    await callOrgAction('save_section_comment', { templateSectionId: sectionId, commentText: text })
  }

  async function handleUpload(selectedFiles) {
    if (!selectedFiles || selectedFiles.length === 0) return
    setUploading(true)
    for (const file of selectedFiles) {
      if (files.length >= MAX_FILES) break
      if (file.size > MAX_FILE_SIZE) continue
      const safeName = `${submissionNumber}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: uploadErr } = await supabase.storage.from('mou-documents').upload(safeName, file)
      if (uploadErr) continue
      const { data: subRow } = await supabase.from('mou_submissions').select('id').eq('submission_number', submissionNumber).single()
      if (subRow) {
        await supabase.from('mou_supporting_documents').insert([{
          submission_id: subRow.id,
          file_name: file.name,
          file_path: safeName,
          file_size: file.size,
          uploaded_by: orgContactName || 'Organization',
        }])
        setFiles(prev => [...prev, { file_name: file.name, file_path: safeName }])
      }
    }
    setUploading(false)
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
          <h1 style={s.title}>Submit a Memorandum of Understanding</h1>
          <p style={s.subtitle}>
            Start a new MOU proposal with the City of Franklin. You'll receive a submission number and PIN
            so you can save your progress and come back to finish filling it out — you don't need an account.
          </p>
          {startError && <div style={s.errorBox}>{startError}</div>}
          <form onSubmit={handleStart}>
            <label style={s.label}>Organization Name</label>
            <input style={s.input} value={orgName} onChange={e => setOrgName(e.target.value)} required />
            <label style={s.label}>Your Name (Primary Contact)</label>
            <input style={s.input} value={orgContactName} onChange={e => setOrgContactName(e.target.value)} required />
            <label style={s.label}>Your Email</label>
            <input style={s.input} type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} required />
            <button type="submit" disabled={starting} style={starting ? s.buttonDisabled : s.button}>
              {starting ? 'Starting…' : 'Start MOU Proposal'}
            </button>
          </form>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '20px' }}>
            Already started one? <a href="?page=mou-status" style={{ color: '#1a56a0' }}>Check status / resume filling</a>
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
              Your MOU proposal <strong>{submissionNumber}</strong> has been submitted for City review.
              Keep your PIN — you'll need it to check status or make changes if the City requests any.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // phase === 'filling'
  const fieldsByKey = buildFieldsByKey(sections)
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

        <h1 style={s.title}>{orgName}</h1>
        <p style={s.subtitle}>Fill in each section below. Your answers are saved automatically as you go — you can leave and come back anytime using your submission number and PIN.</p>

        {sections.map(section => (
          <div key={section.id}>
            <div style={s.sectionTitle}>{section.title}</div>
            <div style={s.lockedText}>{renderLockedText(section.locked_text, fieldValues, fieldsByKey)}</div>
            {(section.field_definitions || []).map(field => {
              if (field.conditional_on && fieldValues[field.conditional_on] !== 'yes') return null
              return (
                <div key={field.key} style={s.fieldRow}>
                  <label style={s.label}>{field.label}{field.required && !field.conditional_on ? ' *' : ''}</label>
                  {field.type === 'yes_na_toggle' ? (
                    <div style={s.toggleRow}>
                      <button type="button" style={s.toggleBtn(fieldValues[field.key] === 'yes')}
                        onClick={() => { handleFieldChange(section.id, field.key, 'yes'); callOrgAction('save_field', { templateSectionId: section.id, fieldKey: field.key, value: 'yes' }) }}>
                        Yes
                      </button>
                      <button type="button" style={s.toggleBtn(fieldValues[field.key] === 'no')}
                        onClick={() => { handleFieldChange(section.id, field.key, 'no'); callOrgAction('save_field', { templateSectionId: section.id, fieldKey: field.key, value: 'no' }) }}>
                        Not Applicable
                      </button>
                    </div>
                  ) : field.type === 'long_text' || field.type === 'list' ? (
                    <textarea
                      style={s.textarea}
                      value={fieldValues[field.key] || ''}
                      placeholder={field.type === 'list' ? 'One item per line' : ''}
                      onChange={e => handleFieldChange(section.id, field.key, e.target.value)}
                      onBlur={() => handleFieldBlur(section.id, field.key)}
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      style={s.input}
                      value={fieldValues[field.key] || ''}
                      onChange={e => handleFieldChange(section.id, field.key, e.target.value)}
                      onBlur={() => handleFieldBlur(section.id, field.key)}
                    />
                  ) : (
                    <input
                      type="text"
                      style={s.input}
                      value={fieldValues[field.key] || ''}
                      onChange={e => handleFieldChange(section.id, field.key, e.target.value)}
                      onBlur={() => handleFieldBlur(section.id, field.key)}
                    />
                  )}
                  {field.guidance && <div style={s.guidance}>{field.guidance}</div>}
                </div>
              )
            })}
            {section.allow_section_comment && (
              <div style={s.commentBox}>
                <label style={{ ...s.label, fontSize: '12px', color: '#6b7280' }}>Suggest a change to this section (optional)</label>
                <textarea
                  style={{ ...s.textarea, minHeight: '60px' }}
                  value={sectionComments[section.id] || ''}
                  onChange={e => handleCommentChange(section.id, e.target.value)}
                  onBlur={() => handleCommentBlur(section.id)}
                  placeholder="Explain any requested deviation from the standard language above — you're not editing it directly."
                />
              </div>
            )}
          </div>
        ))}

        <div style={s.sectionTitle}>Supporting Documentation</div>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>Upload Articles of Incorporation, Bylaws, IRS Determination Letter, Form 990, insurance certificates, or other required documents (max {MAX_FILES} files, 5MB each).</p>
        <input type="file" multiple disabled={uploading} onChange={e => handleUpload(Array.from(e.target.files))} style={{ marginBottom: '10px' }} />
        {files.length > 0 && (
          <ul style={{ fontSize: '13px', color: '#374151' }}>
            {files.map((f, i) => <li key={i}>{f.file_name}</li>)}
          </ul>
        )}

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
            {submitting ? 'Submitting…' : 'Submit for City Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MouSubmit
