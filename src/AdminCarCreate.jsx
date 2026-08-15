// Lets Brenda/Mitch create a CAR themselves (e.g. on behalf of a councilor or department
// that asked them to add an item) instead of only ever working off publicly submitted ones.
// Admins already have direct RLS write access to car_submissions (is_car_admin()), so this
// writes straight to the table rather than going through the anon-facing car-submit Edge
// Function — but it mints submission_number/PIN the same way and, critically, sets
// submitter_confirmed_at immediately so the new CAR shows up in CarBatchReview.jsx for the
// chosen cycle exactly like a real submission, reusing that review pipeline instead of adding
// a second way to approve CARs.
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { CAR_ADMINS, carAdminRole } from './carConfig'
import { CAR_FIELD_GUIDANCE, CAR_RESOLUTION_NOTE, CAR_ATTACHMENTS_GUIDANCE } from './carGuidance'
import CarAttachments from './CarAttachments'

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '760px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px' },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', fontWeight: '600', marginBottom: '16px', display: 'inline-block' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: 1.5 },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box', minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' },
  guidance: { fontSize: '12px', color: '#6b7280', marginBottom: '4px', lineHeight: 1.5 },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '28px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  toggleRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
  toggleBtn: (active) => ({ padding: '8px 18px', borderRadius: '6px', border: active ? '2px solid #1a56a0' : '1px solid #d1d5db', backgroundColor: active ? '#eff6ff' : '#ffffff', color: active ? '#1a56a0' : '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }),
  motionWrapper: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 },
  button: { padding: '12px 28px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '12px 28px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  buttonSecondary: { padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' },
  errorBox: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
  successBox: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '20px 24px', marginBottom: '20px' },
  pinRevealBox: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' },
  pinValue: { fontSize: '24px', fontWeight: '700', color: '#92400e', letterSpacing: '3px' },
}

const REQUIRED_FIELDS = [
  { key: 'from_field', label: 'From' },
  { key: 'subject', label: 'Subject' },
  { key: 'history', label: 'History' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'suggested_motion', label: 'Suggested Motion' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'alternatives', label: 'Alternatives' },
]

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generatePin() {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 100000000).padStart(8, '0')
}

function formatCycleLabel(cycle) {
  const date = new Date(cycle.meeting_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${date} — ${cycle.meeting_type.replace(/_/g, ' ')} (${cycle.status.replace(/_/g, ' ')})`
}

function AdminCarCreate({ userEmail, onBack, onViewSubmission, onGoToBatchReview }) {
  const role = carAdminRole(userEmail)
  const roleName = role === 'brenda' ? CAR_ADMINS.brenda.name : role === 'cityManager' ? CAR_ADMINS.cityManager.name : userEmail

  const [cycles, setCycles] = useState([])
  const [meetingCycleId, setMeetingCycleId] = useState('')
  const [submitterType, setSubmitterType] = useState('staff')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [submitterPhone, setSubmitterPhone] = useState('')
  const [fields, setFields] = useState({ requires_resolution: 'false', requires_public_hearing: 'false' })

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [missingFields, setMissingFields] = useState([])
  const [created, setCreated] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('meeting_cycles')
      .select('*')
      .neq('status', 'closed')
      .order('meeting_date', { ascending: true })
    setCycles(data || [])
    if (data && data.length > 0) setMeetingCycleId(data[0].id)
  }

  function handleFieldChange(key, value) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    setMissingFields([])

    if (!meetingCycleId) {
      setError('Choose a meeting cycle to assign this CAR to.')
      return
    }
    if (!submitterName.trim() || !submitterEmail.trim()) {
      setError('Submitter name and email are required.')
      return
    }
    const missing = REQUIRED_FIELDS.filter(f => !fields[f.key] || !String(fields[f.key]).trim()).map(f => f.label)
    if (missing.length > 0) {
      setError('Fill in all required CAR fields before creating.')
      setMissingFields(missing)
      return
    }

    setCreating(true)
    try {
      const currentYear = new Date().getFullYear()
      const { data: seqData } = await supabase
        .from('car_submissions')
        .select('sequence_number')
        .eq('year', currentYear)
        .order('sequence_number', { ascending: false })
        .limit(1)
      const nextSequence = seqData?.[0]?.sequence_number ? seqData[0].sequence_number + 1 : 1
      const submissionNumber = `CAR-${currentYear}-${nextSequence}`
      const pin = generatePin()
      const pinHash = await hashPin(pin)
      const now = new Date().toISOString()

      const { data: inserted, error: insertError } = await supabase
        .from('car_submissions')
        .insert([{
          submission_number: submissionNumber,
          sequence_number: nextSequence,
          year: currentYear,
          pin_hash: pinHash,
          submitter_type: submitterType,
          submitter_name: submitterName.trim(),
          submitter_email: submitterEmail.trim(),
          submitter_phone: submitterPhone.trim() || null,
          from_field: fields.from_field,
          subject: fields.subject,
          history: fields.history,
          recommendation: fields.recommendation,
          suggested_motion: fields.suggested_motion,
          discussion: fields.discussion,
          alternatives: fields.alternatives,
          requires_resolution: fields.requires_resolution === 'true',
          requires_public_hearing: fields.requires_public_hearing === 'true',
          submitter_confirmed_at: now,
          status: 'submitted',
          meeting_cycle_id: meetingCycleId,
        }])
        .select()
        .single()

      if (insertError) throw insertError

      await supabase.from('car_activity_log').insert([{
        car_submission_id: inserted.id,
        actor_type: 'admin',
        actor_name: roleName,
        action_type: 'submission_created_by_admin',
        notes: `Created directly by ${roleName} on behalf of ${submitterName.trim()} (${submitterType})`,
      }])

      setCreated({ id: inserted.id, submissionNumber, pin, meetingCycleId })
    } catch (err) {
      setError(err.message || 'Failed to create CAR')
    } finally {
      setCreating(false)
    }
  }

  if (created) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.successBox}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>CAR Created</div>
            <div style={{ fontSize: '13px', color: '#065f46' }}>{created.submissionNumber} was created and is ready for batch review in its assigned cycle.</div>
          </div>
          <div style={s.pinRevealBox}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Submission Number & PIN — shown once</div>
            <div style={s.pinValue}>{created.submissionNumber}</div>
            <div style={s.pinValue}>{created.pin}</div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>If the actual requestor wants to edit this or check its status themselves later, give them both of these.</div>
          </div>

          <div style={s.sectionTitle}>Attachments / Exhibits</div>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>{CAR_ATTACHMENTS_GUIDANCE}</p>
          <CarAttachments carSubmissionId={created.id} canUpload={true} uploadedBy={roleName} />

          <div style={{ marginTop: '24px' }}>
            <button style={s.buttonSecondary} onClick={() => onViewSubmission(created.id)}>View Submission →</button>
            <button style={s.buttonSecondary} onClick={() => onGoToBatchReview(created.meetingCycleId)}>Go to Batch Review →</button>
            <button style={s.buttonSecondary} onClick={onBack}>← Back to List</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.backLink} onClick={onBack}>← Back to CARs</span>
        <h1 style={s.title}>Create a CAR</h1>
        <p style={s.subtitle}>Use this to add a Council Action Report yourselves — e.g. one a councilor or department asked you to add — instead of waiting for a public submission. It goes straight into batch review for the cycle you choose.</p>

        {error && (
          <div style={s.errorBox}>
            <div>{error}</div>
            {missingFields.length > 0 && (
              <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                {missingFields.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <label style={s.label}>Meeting Cycle</label>
          <select style={s.input} value={meetingCycleId} onChange={e => setMeetingCycleId(e.target.value)} required>
            <option value="">Choose a cycle…</option>
            {cycles.map(c => <option key={c.id} value={c.id}>{formatCycleLabel(c)}</option>)}
          </select>
          {cycles.length === 0 && <p style={{ fontSize: '12px', color: '#991b1b', marginTop: '-10px', marginBottom: '14px' }}>No open meeting cycles exist yet — create one first under Manage Meeting Cycles.</p>}

          <div style={s.sectionTitle}>Submitted On Behalf Of</div>
          <label style={s.label}>Submitter Type</label>
          <select style={s.input} value={submitterType} onChange={e => setSubmitterType(e.target.value)}>
            <option value="staff">Staff</option>
            <option value="council">Council</option>
            <option value="public">Public</option>
          </select>
          <label style={s.label}>Name</label>
          <input style={s.input} value={submitterName} onChange={e => setSubmitterName(e.target.value)} required />
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)} required />
          <label style={s.label}>Phone (optional)</label>
          <input style={s.input} type="tel" value={submitterPhone} onChange={e => setSubmitterPhone(e.target.value)} />

          <div style={s.sectionTitle}>CAR Contents</div>
          {Object.entries(CAR_FIELD_GUIDANCE).map(([key, field]) => (
            <div key={key}>
              <label style={s.label}>{field.label} *</label>
              <div style={s.guidance}>{field.guidance}</div>
              {key === 'suggested_motion' ? (
                <div style={s.motionWrapper}>
                  Councilor moves: "
                  <textarea
                    style={{ ...s.textarea, display: 'inline-block', width: 'calc(100% - 20px)', marginBottom: 0, verticalAlign: 'top' }}
                    value={fields[key] || ''}
                    onChange={e => handleFieldChange(key, e.target.value)}
                  />
                  "
                  <div style={{ marginTop: '10px' }}>Mayor calls for a second, discussion, and vote.</div>
                </div>
              ) : key === 'from_field' || key === 'subject' ? (
                <input style={s.input} value={fields[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} />
              ) : (
                <textarea style={{ ...s.textarea, marginBottom: '14px' }} value={fields[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} />
              )}
            </div>
          ))}

          <div style={s.sectionTitle}>Additional Details</div>
          <label style={s.label}>Does this request require formal Council action by resolution?</label>
          <div style={s.toggleRow}>
            <button type="button" style={s.toggleBtn(fields.requires_resolution === 'true')} onClick={() => handleFieldChange('requires_resolution', 'true')}>Yes</button>
            <button type="button" style={s.toggleBtn(fields.requires_resolution !== 'true')} onClick={() => handleFieldChange('requires_resolution', 'false')}>No</button>
          </div>
          {fields.requires_resolution === 'true' && <div style={s.guidance}>{CAR_RESOLUTION_NOTE}</div>}

          <label style={{ ...s.label, marginTop: '14px' }}>Does this item require a public hearing?</label>
          <div style={s.toggleRow}>
            <button type="button" style={s.toggleBtn(fields.requires_public_hearing === 'true')} onClick={() => handleFieldChange('requires_public_hearing', 'true')}>Yes</button>
            <button type="button" style={s.toggleBtn(fields.requires_public_hearing !== 'true')} onClick={() => handleFieldChange('requires_public_hearing', 'false')}>No</button>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" disabled={creating} style={creating ? s.buttonDisabled : s.button}>
              {creating ? 'Creating…' : 'Create CAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminCarCreate
