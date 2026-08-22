import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL, MOU_REVIEWERS, MOU_STAGE_LABELS, MOU_ORG_REVIEW_DECISION_LABELS, mouReviewerRole } from './mouConfig'
import { buildFieldsByKey, resolveSectionText } from './mouTextRender'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px' },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', marginBottom: '16px', display: 'inline-block' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af', marginBottom: '20px', marginRight: '10px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '24px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  editableText: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: '#374151', lineHeight: 1.7, boxSizing: 'border-box', minHeight: '90px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '4px' },
  originalAnswersBox: { fontSize: '12px', color: '#6b7280', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px', marginBottom: '8px' },
  originalAnswerLabel: { fontWeight: '700', color: '#374151' },
  revertLink: { fontSize: '11px', color: '#991b1b', cursor: 'pointer', fontWeight: '600' },
  editedMeta: { fontSize: '11px', color: '#9ca3af', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orgNote: { fontSize: '12px', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' },
  reviewBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' },
  reviewBoxTitle: { fontSize: '13px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', marginBottom: '6px' },
  commentCard: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px', marginBottom: '8px' },
  commentMeta: { fontSize: '11px', color: '#6b7280', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' },
  visiblePill: { fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#065f46' },
  hiddenPill: { fontSize: '10px', fontWeight: '700', padding: '1px 8px', borderRadius: '10px', backgroundColor: '#f3f4f6', color: '#9ca3af' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', minHeight: '70px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '8px' },
  input: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginRight: '8px' },
  button: { padding: '10px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  buttonSecondary: { padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  buttonDanger: { padding: '10px 20px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginBottom: '8px' },
  activityRow: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  activityDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a56a0', marginTop: '5px', flexShrink: 0 },
  actionBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '18px 20px', marginTop: '24px' },
  actionBoxTitle: { fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  noAccess: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', fontSize: '13px', color: '#991b1b', marginTop: '20px' },
  contactBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px', marginBottom: '8px' },
  pinRevealBox: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' },
  pinValue: { fontSize: '24px', fontWeight: '700', color: '#92400e', letterSpacing: '3px' },
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
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

function MouSubmissionDetail({ submissionId, userEmail, onBack, onPrint }) {
  const [submission, setSubmission] = useState(null)
  const [sections, setSections] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [sectionText, setSectionText] = useState([])
  const [editedDraft, setEditedDraft] = useState({})
  const [reviewComments, setReviewComments] = useState([])
  const [supportingDocuments, setSupportingDocuments] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [loading, setLoading] = useState(true)

  const [newComment, setNewComment] = useState('')
  const [newCommentSectionId, setNewCommentSectionId] = useState(null)
  const [newCommentVisible, setNewCommentVisible] = useState(false)
  const [sendBackNotes, setSendBackNotes] = useState('')
  const [councilDate, setCouncilDate] = useState('')
  const [working, setWorking] = useState(false)
  const [newPin, setNewPin] = useState(null)
  const [resettingPin, setResettingPin] = useState(false)

  const role = mouReviewerRole(userEmail)
  const roleName = role === 'brenda' ? MOU_REVIEWERS.brenda.name : role === 'cityManager' ? MOU_REVIEWERS.cityManager.name : userEmail

  useEffect(() => {
    load()
  }, [submissionId])

  async function load() {
    setLoading(true)
    const { data: sub } = await supabase.from('mou_submissions').select('*').eq('id', submissionId).single()
    if (sub) {
      setSubmission(sub)
      setCouncilDate(sub.council_date || '')
      const [secRes, valRes, textRes, revRes, docRes, actRes] = await Promise.all([
        supabase.from('mou_template_sections').select('*').eq('template_id', sub.template_id).order('section_order'),
        supabase.from('mou_submission_field_values').select('*').eq('submission_id', submissionId),
        supabase.from('mou_submission_section_text').select('*').eq('submission_id', submissionId),
        supabase.from('mou_review_comments').select('*').eq('submission_id', submissionId).order('created_at'),
        supabase.from('mou_supporting_documents').select('*').eq('submission_id', submissionId),
        supabase.from('mou_activity_log').select('*').eq('submission_id', submissionId).order('created_at'),
      ])
      const secList = secRes.data || []
      setSections(secList)
      const values = {}
      for (const fv of valRes.data || []) values[fv.field_key] = fv.value
      setFieldValues(values)
      const textList = textRes.data || []
      setSectionText(textList)
      const fieldsByKey = buildFieldsByKey(secList)
      const textBySectionId = Object.fromEntries(textList.map(row => [row.template_section_id, row.edited_text]))
      const draft = {}
      for (const section of secList) draft[section.id] = resolveSectionText(section, values, fieldsByKey, textBySectionId[section.id])
      setEditedDraft(draft)
      setReviewComments(revRes.data || [])
      setSupportingDocuments(docRes.data || [])
      setActivityLog(actRes.data || [])
    }
    setLoading(false)
  }

  async function logActivity(action_type, extra = {}) {
    await supabase.from('mou_activity_log').insert([{ submission_id: submissionId, actor_type: 'admin', actor_name: roleName, action_type, ...extra }])
  }

  async function handleResetPin() {
    setResettingPin(true)
    const pin = generatePin()
    const pinHash = await hashPin(pin)
    await supabase.from('mou_submissions').update({
      pin_hash: pinHash,
      pin_failed_attempts: 0,
      pin_locked_until: null,
    }).eq('id', submissionId)
    await logActivity('pin_reset', { notes: 'PIN reset by admin' })
    setNewPin(pin)
    setResettingPin(false)
  }

  async function sendMouEmail(type, extra) {
    await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ type, submissionNumber: submission.submission_number, orgName: submission.org_name, ...extra }),
    })
  }

  async function handlePostComment() {
    if (!newComment.trim()) return
    setWorking(true)
    await supabase.from('mou_review_comments').insert([{
      submission_id: submissionId,
      template_section_id: newCommentSectionId,
      author_email: userEmail,
      author_name: roleName,
      comment_text: newComment.trim(),
      org_visible: newCommentVisible,
    }])
    setNewComment('')
    setNewCommentVisible(false)
    setNewCommentSectionId(null)
    await load()
    setWorking(false)
  }

  async function handleSectionTextBlur(sectionId) {
    const text = editedDraft[sectionId]
    await supabase.from('mou_submission_section_text').upsert(
      { submission_id: submissionId, template_section_id: sectionId, edited_text: text, edited_by: roleName, edited_at: new Date().toISOString() },
      { onConflict: 'submission_id,template_section_id' }
    )
    await load()
  }

  async function handleRevertSection(sectionId) {
    await supabase.from('mou_submission_section_text').delete().eq('submission_id', submissionId).eq('template_section_id', sectionId)
    await load()
  }

  async function transitionStage(newStage, patch = {}) {
    setWorking(true)
    await supabase.from('mou_submissions').update({ current_stage: newStage, ...patch }).eq('id', submissionId)
    setWorking(false)
  }

  async function handleSendBack(targetStage) {
    const note = sendBackNotes || null
    await transitionStage(targetStage, { return_to_stage: submission.current_stage })
    await logActivity(targetStage === 'missing_information' ? 'sent_back_missing_information' : 'sent_back_submitter_review', {
      old_value: submission.current_stage, new_value: targetStage, notes: note,
    })
    await sendMouEmail(targetStage === 'missing_information' ? 'mou_sent_back_missing_information' : 'mou_sent_back_submitter_review', {
      orgEmail: submission.org_email, notes: note,
    })
    setSendBackNotes('')
    await load()
  }

  async function handlePushToCityManager() {
    await transitionStage('manager_review_city_manager')
    await logActivity('pushed_to_city_manager', { old_value: submission.current_stage, new_value: 'manager_review_city_manager' })
    await sendMouEmail('mou_pushed_to_city_manager', {})
    await load()
  }

  async function handleSendBackToBrenda() {
    await transitionStage('manager_review_brenda')
    await logActivity('sent_back_to_brenda', { old_value: submission.current_stage, new_value: 'manager_review_brenda', notes: sendBackNotes || null })
    await sendMouEmail('mou_sent_back_to_brenda', {})
    setSendBackNotes('')
    await load()
  }

  async function handleSendBackToCityManagerReview() {
    await transitionStage('manager_review_city_manager')
    await logActivity('sent_back_to_city_manager_review', { old_value: submission.current_stage, new_value: 'manager_review_city_manager' })
    await sendMouEmail('mou_pushed_to_city_manager', {})
    await load()
  }

  async function handleMarkReadyForCouncil() {
    await transitionStage('ready_for_council')
    await logActivity('ready_for_council', { old_value: submission.current_stage, new_value: 'ready_for_council' })
    await sendMouEmail('mou_ready_for_council', {})
    await load()
  }

  async function handleSaveCouncilDate() {
    if (!councilDate) return
    setWorking(true)
    await supabase.from('mou_submissions').update({ council_date: councilDate }).eq('id', submissionId)
    await logActivity('council_scheduled', { new_value: councilDate })
    setWorking(false)
    await load()
  }

  async function handleRecordDecision(decision) {
    setWorking(true)
    await supabase.from('mou_submissions').update({ current_stage: decision }).eq('id', submissionId)
    await logActivity('council_decision_recorded', { new_value: decision })
    await sendMouEmail('mou_council_decision', { decision, orgEmail: submission.org_email })
    setWorking(false)
    await load()
  }

  if (loading) {
    return <div style={s.page}><div style={s.card}>Loading…</div></div>
  }
  if (!submission) {
    return <div style={s.page}><div style={s.card}>Submission not found.</div></div>
  }

  const stage = submission.current_stage
  const fieldsByKey = buildFieldsByKey(sections)
  const textBySectionId = Object.fromEntries(sectionText.map(row => [row.template_section_id, row]))
  const canReviewAsBrenda = role === 'brenda' && stage === 'manager_review_brenda'
  const canReviewAsCityManager = role === 'cityManager' && stage === 'manager_review_city_manager'
  const canMarkReadyForCouncil = role === 'cityManager' && stage === 'manager_review_city_manager'
  const canScheduleCouncil = stage === 'ready_for_council'
  const canRecordDecision = stage === 'ready_for_council'

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.backLink} onClick={onBack}>← Back to MOU Submissions</span>
        <h1 style={s.title}>{submission.org_name}</h1>
        <p style={s.subtitle}>{submission.submission_number} · Contact: {submission.org_contact_name} ({submission.org_email})</p>
        <span style={s.badge}>{MOU_STAGE_LABELS[stage] || stage}</span>
        <button style={s.buttonSecondary} onClick={() => onPrint(submissionId)}>🖨️ Print Agreement</button>

        {role && (
          <div style={s.contactBox}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Lost their submission number or PIN? The submission number is above. PINs are never stored in plain text, so issue a new one and relay it by phone — not email.
            </span>
            <button style={s.buttonSecondary} disabled={resettingPin} onClick={handleResetPin}>
              {resettingPin ? 'Resetting…' : 'Reset PIN'}
            </button>
          </div>
        )}

        {newPin && (
          <div style={s.pinRevealBox}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>New PIN — shown once</div>
            <div style={s.pinValue}>{newPin}</div>
            <div style={{ fontSize: '12px', color: '#92400e' }}>Relay this to {submission.org_contact_name} by phone. The old PIN no longer works.</div>
          </div>
        )}

        {!role && (
          <div style={s.noAccess}>
            Your login ({userEmail}) isn't recognized as an MOU reviewer (Brenda or the City Manager), so review actions are unavailable. You can still view this submission's contents below.
          </div>
        )}

        {submission.org_review_decision && (
          <div style={s.reviewBox}>
            <div style={s.reviewBoxTitle}>Submitter's Review</div>
            <div style={{ fontSize: '13px', color: '#111827', marginBottom: '4px' }}>
              <strong>{MOU_ORG_REVIEW_DECISION_LABELS[submission.org_review_decision] || submission.org_review_decision}</strong>
              {submission.org_review_decided_at ? ` · ${formatDateTime(submission.org_review_decided_at)}` : ''}
            </div>
            {submission.org_review_comment && <div style={{ fontSize: '13px', color: '#374151' }}>"{submission.org_review_comment}"</div>}
          </div>
        )}

        <div style={s.sectionTitle}>Agreement Contents</div>
        {sections.map(section => {
          const sectionReviewComments = reviewComments.filter(c => c.template_section_id === section.id)
          const editedRow = textBySectionId[section.id]
          const fieldsForSection = section.field_definitions || []
          return (
            <div key={section.id}>
              <div style={{ fontWeight: '700', color: '#374151', fontSize: '14px', marginTop: '18px', marginBottom: '6px' }}>{section.title}</div>

              {fieldsForSection.length > 0 && (
                <div style={s.originalAnswersBox}>
                  {fieldsForSection.map(field => (
                    <div key={field.key}><span style={s.originalAnswerLabel}>{field.label}:</span> {fieldValues[field.key] || '—'}</div>
                  ))}
                </div>
              )}

              {role ? (
                <>
                  <textarea
                    style={s.editableText}
                    value={editedDraft[section.id] ?? ''}
                    onChange={e => setEditedDraft(prev => ({ ...prev, [section.id]: e.target.value }))}
                    onBlur={() => handleSectionTextBlur(section.id)}
                  />
                  <div style={s.editedMeta}>
                    <span>{editedRow ? `Edited by ${editedRow.edited_by} · ${formatDateTime(editedRow.edited_at)}` : 'Not yet edited — showing generated text'}</span>
                    {editedRow && <span style={s.revertLink} onClick={() => handleRevertSection(section.id)}>Revert to Submitter's Answer</span>}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{editedDraft[section.id]}</div>
              )}

              {sectionReviewComments.map(c => (
                <div key={c.id} style={s.commentCard}>
                  <div style={s.commentMeta}>
                    <span>{c.author_name} · {formatDateTime(c.created_at)}</span>
                    <span style={c.org_visible ? s.visiblePill : s.hiddenPill}>{c.org_visible ? 'Visible to org' : 'Internal only'}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#111827' }}>{c.comment_text}</div>
                </div>
              ))}
              {role && (
                <div style={{ marginTop: '6px', marginBottom: '16px' }}>
                  <textarea
                    style={{ ...s.textarea, minHeight: '50px' }}
                    placeholder={`Add a note on "${section.title}"...`}
                    value={newCommentSectionId === section.id ? newComment : ''}
                    onFocus={() => setNewCommentSectionId(section.id)}
                    onChange={e => { setNewCommentSectionId(section.id); setNewComment(e.target.value) }}
                  />
                  {newCommentSectionId === section.id && newComment && (
                    <>
                      <label style={s.checkboxRow}>
                        <input type="checkbox" checked={newCommentVisible} onChange={e => setNewCommentVisible(e.target.checked)} />
                        Visible to organization
                      </label>
                      <button style={s.buttonSecondary} disabled={working} onClick={handlePostComment}>Post Note</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <div style={s.sectionTitle}>General Notes</div>
        {reviewComments.filter(c => !c.template_section_id).length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>No general notes.</div>
        ) : (
          reviewComments.filter(c => !c.template_section_id).map(c => (
            <div key={c.id} style={s.commentCard}>
              <div style={s.commentMeta}>
                <span>{c.author_name} · {formatDateTime(c.created_at)}</span>
                <span style={c.org_visible ? s.visiblePill : s.hiddenPill}>{c.org_visible ? 'Visible to org' : 'Internal only'}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#111827' }}>{c.comment_text}</div>
            </div>
          ))
        )}
        {role && (
          <div style={{ marginTop: '8px' }}>
            <textarea
              style={s.textarea}
              placeholder="Add a general note..."
              value={newCommentSectionId === null ? newComment : ''}
              onFocus={() => setNewCommentSectionId(null)}
              onChange={e => { setNewCommentSectionId(null); setNewComment(e.target.value) }}
            />
            {newCommentSectionId === null && newComment && (
              <>
                <label style={s.checkboxRow}>
                  <input type="checkbox" checked={newCommentVisible} onChange={e => setNewCommentVisible(e.target.checked)} />
                  Visible to organization
                </label>
                <button style={s.buttonSecondary} disabled={working} onClick={handlePostComment}>Post Note</button>
              </>
            )}
          </div>
        )}

        <div style={s.sectionTitle}>Supporting Documents</div>
        {supportingDocuments.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>No documents uploaded.</div>
        ) : (
          <ul style={{ fontSize: '13px', color: '#374151' }}>
            {supportingDocuments.map(f => (
              <li key={f.id}>
                <a href={`${SUPABASE_URL}/storage/v1/object/public/mou-documents/${f.file_path}`} target="_blank" rel="noreferrer" style={{ color: '#1a56a0' }}>{f.file_name}</a>
              </li>
            ))}
          </ul>
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

        {canReviewAsBrenda && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Brenda's Review Actions</div>
            <textarea style={s.textarea} placeholder="Reason / notes for sending back (included in the notification email)..." value={sendBackNotes} onChange={e => setSendBackNotes(e.target.value)} />
            <div>
              <button style={s.buttonSecondary} disabled={working} onClick={() => handleSendBack('missing_information')}>Send Back — Missing Information</button>
              <button style={s.buttonSecondary} disabled={working} onClick={() => handleSendBack('submitter_needs_review')}>Send Back — Submitter Needs to Review/Approve</button>
              <button style={s.button} disabled={working} onClick={handlePushToCityManager}>Push to City Manager</button>
            </div>
          </div>
        )}

        {canReviewAsCityManager && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>City Manager's Review Actions</div>
            <textarea style={s.textarea} placeholder="Reason / notes for sending back (included in the notification email)..." value={sendBackNotes} onChange={e => setSendBackNotes(e.target.value)} />
            <div>
              <button style={s.buttonSecondary} disabled={working} onClick={() => handleSendBack('missing_information')}>Send Back — Missing Information</button>
              <button style={s.buttonSecondary} disabled={working} onClick={() => handleSendBack('submitter_needs_review')}>Send Back — Submitter Needs to Review/Approve</button>
              <button style={s.buttonSecondary} disabled={working} onClick={handleSendBackToBrenda}>Send Back to Brenda</button>
              {canMarkReadyForCouncil && <button style={s.button} disabled={working} onClick={handleMarkReadyForCouncil}>Mark Ready for Council</button>}
            </div>
          </div>
        )}

        {canScheduleCouncil && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Schedule for City Council</div>
            <input type="date" style={s.input} value={councilDate} onChange={e => setCouncilDate(e.target.value)} />
            <button style={s.button} disabled={working} onClick={handleSaveCouncilDate}>Save Council Date</button>
          </div>
        )}

        {canRecordDecision && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Record City Council Decision</div>
            <button style={s.button} disabled={working} onClick={() => handleRecordDecision('approved')}>Approved</button>
            <button style={s.buttonDanger} disabled={working} onClick={() => handleRecordDecision('denied')}>Denied</button>
            <button style={s.buttonSecondary} disabled={working} onClick={handleSendBackToCityManagerReview}>Send Back to City Manager Review</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MouSubmissionDetail
