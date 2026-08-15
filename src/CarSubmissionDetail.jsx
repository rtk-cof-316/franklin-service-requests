import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL, CAR_ADMINS, CAR_STATUS_LABELS, carAdminRole } from './carConfig'
import { CAR_FIELD_GUIDANCE } from './carGuidance'
import CarAttachments from './CarAttachments'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '860px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px' },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', marginBottom: '16px', display: 'inline-block' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '24px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  fieldLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  fieldValue: { fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', marginBottom: '10px' },
  contactBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px', marginBottom: '8px' },
  pinRevealBox: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' },
  pinValue: { fontSize: '24px', fontWeight: '700', color: '#92400e', letterSpacing: '3px' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', minHeight: '70px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '8px' },
  input: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginRight: '8px' },
  button: { padding: '10px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  buttonSecondary: { padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  buttonDanger: { padding: '10px 20px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  activityRow: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  activityDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a56a0', marginTop: '5px', flexShrink: 0 },
  actionBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '18px 20px', marginTop: '24px' },
  actionBoxTitle: { fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  noAccess: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', fontSize: '13px', color: '#991b1b', marginTop: '20px' },
}

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

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CarSubmissionDetail({ submissionId, userEmail, onBack }) {
  const [submission, setSubmission] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [workSessions, setWorkSessions] = useState([])
  const [futureCycles, setFutureCycles] = useState([])
  const [loading, setLoading] = useState(true)

  const [reviewNote, setReviewNote] = useState('')
  const [selectedWorkSessionId, setSelectedWorkSessionId] = useState('')
  const [reassignCycleId, setReassignCycleId] = useState('')
  const [reassignStatus, setReassignStatus] = useState('under_review')
  const [reassignReason, setReassignReason] = useState('')
  const [newPin, setNewPin] = useState(null)
  const [working, setWorking] = useState(false)

  const role = carAdminRole(userEmail)
  const roleName = role === 'brenda' ? CAR_ADMINS.brenda.name : role === 'cityManager' ? CAR_ADMINS.cityManager.name : userEmail

  useEffect(() => {
    load()
  }, [submissionId])

  async function load() {
    setLoading(true)
    const { data: sub } = await supabase.from('car_submissions').select('*').eq('id', submissionId).single()
    if (sub) {
      setSubmission(sub)
      const [attRes, actRes, wsRes, cyclesRes] = await Promise.all([
        supabase.from('car_attachments').select('*').eq('car_submission_id', submissionId),
        supabase.from('car_activity_log').select('*').eq('car_submission_id', submissionId).order('created_at'),
        supabase.from('work_sessions').select('*').eq('meeting_cycle_id', sub.meeting_cycle_id).order('session_date'),
        supabase.from('meeting_cycles').select('*').gte('meeting_date', new Date().toISOString().slice(0, 10)).order('meeting_date'),
      ])
      setAttachments(attRes.data || [])
      setActivityLog(actRes.data || [])
      setWorkSessions(wsRes.data || [])
      setFutureCycles(cyclesRes.data || [])
    }
    setLoading(false)
  }

  async function logActivity(action_type, extra = {}) {
    await supabase.from('car_activity_log').insert([{ car_submission_id: submissionId, actor_type: 'admin', actor_name: roleName, action_type, ...extra }])
  }

  async function sendCarEmail(type, extra) {
    await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ type, submissionNumber: submission.submission_number, subject: submission.subject, ...extra }),
    })
  }

  async function handleResetPin() {
    setWorking(true)
    const pin = generatePin()
    const pinHash = await hashPin(pin)
    await supabase.from('car_submissions').update({ pin_hash: pinHash, pin_failed_attempts: 0, pin_locked_until: null }).eq('id', submissionId)
    await logActivity('pin_reset', { notes: 'PIN reset by admin' })
    setNewPin(pin)
    setWorking(false)
  }

  async function handleReviewDecision(decision) {
    setWorking(true)
    const nextStatus = decision === 'rejected' ? 'rejected' : decision === 'approved_normal' ? 'included_in_packet' : 'pending_work_session_assignment'
    await supabase.from('car_submissions').update({
      status: nextStatus,
      review_decision: decision,
      review_note: reviewNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: roleName,
    }).eq('id', submissionId)
    await logActivity('review_decision', { old_value: submission.status, new_value: nextStatus, notes: reviewNote || null })
    const emailType = decision === 'rejected' ? 'car_rejected' : decision === 'approved_normal' ? 'car_approved_normal' : 'car_approved_hot'
    await sendCarEmail(emailType, { toEmail: submission.submitter_email, toName: submission.submitter_name, reviewNote })
    setReviewNote('')
    setWorking(false)
    await load()
  }

  async function handleAssignWorkSession() {
    if (!selectedWorkSessionId) return
    setWorking(true)
    await supabase.from('car_submissions').update({ status: 'scheduled_for_work_session', work_session_id: selectedWorkSessionId }).eq('id', submissionId)
    await logActivity('assigned_to_work_session', { new_value: selectedWorkSessionId })
    const ws = workSessions.find(w => w.id === selectedWorkSessionId)
    await sendCarEmail('car_scheduled_work_session', {
      toEmail: submission.submitter_email, toName: submission.submitter_name,
      workSessionDate: ws ? formatDate(ws.answers_due_override || ws.session_date) : null,
    })
    setWorking(false)
    await load()
  }

  async function handleMarkWorkSessionHeld() {
    setWorking(true)
    await supabase.from('car_submissions').update({ status: 'answer_due' }).eq('id', submissionId)
    await logActivity('work_session_held', { old_value: 'scheduled_for_work_session', new_value: 'answer_due' })
    setWorking(false)
    await load()
  }

  async function handleSignOffAnswer() {
    setWorking(true)
    await supabase.from('car_submissions').update({
      status: 'included_in_packet', answer_signed_off_at: new Date().toISOString(), answer_signed_off_by: roleName,
    }).eq('id', submissionId)
    await logActivity('answer_signed_off', { old_value: 'answer_submitted', new_value: 'included_in_packet' })
    await sendCarEmail('car_answer_signed_off', { toEmail: submission.submitter_email, toName: submission.submitter_name })
    setWorking(false)
    await load()
  }

  async function handleSendBackAnswer() {
    setWorking(true)
    await supabase.from('car_submissions').update({ status: 'answer_due' }).eq('id', submissionId)
    await logActivity('answer_sent_back', { old_value: 'answer_submitted', new_value: 'answer_due' })
    setWorking(false)
    await load()
  }

  async function handleMarkMissedDeadline() {
    setWorking(true)
    await supabase.from('car_submissions').update({ status: 'pushed_to_reassignment' }).eq('id', submissionId)
    await logActivity('missed_deadline', { old_value: submission.status, new_value: 'pushed_to_reassignment' })
    await sendCarEmail('car_pushed_to_reassignment', { toEmail: submission.submitter_email, toName: submission.submitter_name })
    setWorking(false)
    await load()
  }

  async function handleReassign() {
    if (!reassignCycleId || !reassignStatus) return
    setWorking(true)
    await supabase.from('car_reassignment_history').insert([{
      car_submission_id: submissionId,
      from_meeting_cycle_id: submission.meeting_cycle_id,
      to_meeting_cycle_id: reassignCycleId,
      from_status: submission.status,
      to_status: reassignStatus,
      reason: reassignReason || null,
      reassigned_by: roleName,
    }])
    await supabase.from('car_submissions').update({ meeting_cycle_id: reassignCycleId, status: reassignStatus }).eq('id', submissionId)
    await logActivity('reassigned', { old_value: submission.status, new_value: reassignStatus, notes: reassignReason || null })
    await sendCarEmail('car_reassigned', { toEmail: submission.submitter_email, toName: submission.submitter_name, reason: reassignReason })
    setReassignReason('')
    setWorking(false)
    await load()
  }

  if (loading) return <div style={s.page}><div style={s.card}>Loading…</div></div>
  if (!submission) return <div style={s.page}><div style={s.card}>Submission not found.</div></div>

  const stage = submission.status
  const canReview = stage === 'submitted' && submission.submitter_confirmed_at
  const canAssignWorkSession = stage === 'pending_work_session_assignment'
  const canMarkHeld = stage === 'scheduled_for_work_session'
  const canSignOff = stage === 'answer_submitted'
  const canMarkMissed = ['scheduled_for_work_session', 'answer_due', 'answer_submitted'].includes(stage)

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.backLink} onClick={onBack}>← Back to CARs</span>
        <h1 style={s.title}>{submission.subject || submission.submission_number}</h1>
        <p style={s.subtitle}>{submission.submission_number} · From: {submission.from_field || '—'} · Contact: {submission.submitter_name} ({submission.submitter_email})</p>
        <span style={s.badge}>{CAR_STATUS_LABELS[stage] || stage}</span>

        {!role && (
          <div style={s.noAccess}>Your login ({userEmail}) isn't recognized as a CAR administrator.</div>
        )}

        {role && (
          <div style={s.contactBox}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Lost their submission number or PIN? Issue a new one and relay it by phone — not email.</span>
            <button style={s.buttonSecondary} disabled={working} onClick={handleResetPin}>Reset PIN</button>
          </div>
        )}
        {newPin && (
          <div style={s.pinRevealBox}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>New PIN — shown once</div>
            <div style={s.pinValue}>{newPin}</div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>Relay this to {submission.submitter_name} by phone. The old PIN no longer works.</div>
          </div>
        )}

        <div style={s.sectionTitle}>CAR Contents</div>
        {Object.entries(CAR_FIELD_GUIDANCE).map(([key, field]) => (
          <div key={key}>
            <div style={s.fieldLabel}>{field.label}</div>
            <div style={s.fieldValue}>{submission[key] || '—'}</div>
          </div>
        ))}
        <div style={s.fieldLabel}>Requires a Resolution</div>
        <div style={s.fieldValue}>{submission.requires_resolution ? 'Yes' : 'No'}</div>
        <div style={s.fieldLabel}>Requires a Public Hearing</div>
        <div style={s.fieldValue}>{submission.requires_public_hearing ? 'Yes' : 'No'}</div>

        <div style={s.sectionTitle}>Attachments</div>
        <CarAttachments carSubmissionId={submissionId} canUpload={false} />

        {submission.answer_text && (
          <>
            <div style={s.sectionTitle}>Submitted Answer</div>
            <div style={s.fieldValue}>{submission.answer_text}</div>
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

        {role && canReview && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Review Decision</div>
            <textarea style={s.textarea} placeholder="Note (optional, included in the notification email)..." value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            <button style={s.buttonDanger} disabled={working} onClick={() => handleReviewDecision('rejected')}>Reject</button>
            <button style={s.buttonSecondary} disabled={working} onClick={() => handleReviewDecision('approved_normal')}>Approve – Normal Business</button>
            <button style={s.button} disabled={working} onClick={() => handleReviewDecision('approved_hot')}>Approve – Hot Button</button>
          </div>
        )}

        {role && canAssignWorkSession && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Assign to Work Session</div>
            {workSessions.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280' }}>No work sessions scheduled yet for this meeting cycle — create one from the cycle's detail page first.</p>
            ) : (
              <>
                <select style={s.input} value={selectedWorkSessionId} onChange={e => setSelectedWorkSessionId(e.target.value)}>
                  <option value="">-- Select a work session --</option>
                  {workSessions.map(ws => <option key={ws.id} value={ws.id}>{formatDate(ws.session_date)}</option>)}
                </select>
                <button style={s.button} disabled={working} onClick={handleAssignWorkSession}>Assign</button>
              </>
            )}
          </div>
        )}

        {role && canMarkHeld && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Work Session</div>
            <button style={s.button} disabled={working} onClick={handleMarkWorkSessionHeld}>Mark Work Session Held (Answer Now Due)</button>
          </div>
        )}

        {role && canSignOff && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Sign Off on Answer</div>
            <button style={s.button} disabled={working} onClick={handleSignOffAnswer}>Sign Off — Include in Packet</button>
            <button style={s.buttonSecondary} disabled={working} onClick={handleSendBackAnswer}>Send Back for Revision</button>
          </div>
        )}

        {role && canMarkMissed && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Missed Sign-Off Deadline</div>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>If this CAR missed its sign-off deadline before the cycle's Packet Publish Date, push it to reassignment.</p>
            <button style={s.buttonDanger} disabled={working} onClick={handleMarkMissedDeadline}>Mark Missed Deadline — Push to Reassignment</button>
          </div>
        )}

        {role && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Reassign to a Different Cycle</div>
            <select style={s.input} value={reassignCycleId} onChange={e => setReassignCycleId(e.target.value)}>
              <option value="">-- Select target meeting cycle --</option>
              {futureCycles.map(c => <option key={c.id} value={c.id}>{formatDate(c.meeting_date)}</option>)}
            </select>
            <select style={s.input} value={reassignStatus} onChange={e => setReassignStatus(e.target.value)}>
              {Object.entries(CAR_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <textarea style={s.textarea} placeholder="Reason for reassignment..." value={reassignReason} onChange={e => setReassignReason(e.target.value)} />
            <button style={s.button} disabled={working} onClick={handleReassign}>Reassign</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CarSubmissionDetail
