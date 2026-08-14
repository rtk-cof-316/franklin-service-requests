import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL, MOU_REVIEWERS, MOU_STAGE_LABELS, mouReviewerRole } from './mouConfig'
import { buildFieldsByKey, parseMouLockedText } from './mouTextRender'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '860px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px' },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', marginBottom: '16px', display: 'inline-block' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginTop: '24px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '2px solid #e5e7eb' },
  lockedText: { fontSize: '13px', color: '#374151', lineHeight: 1.7, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px 16px', marginBottom: '8px', whiteSpace: 'pre-wrap' },
  token: { color: '#1a56a0', fontWeight: '600', backgroundColor: '#eff6ff', padding: '0 3px', borderRadius: '3px' },
  orgNote: { fontSize: '12px', color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' },
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

function MouSubmissionDetail({ submissionId, userEmail, onBack, onPrint }) {
  const [submission, setSubmission] = useState(null)
  const [sections, setSections] = useState([])
  const [fieldValues, setFieldValues] = useState({})
  const [sectionComments, setSectionComments] = useState([])
  const [reviewComments, setReviewComments] = useState([])
  const [supportingDocuments, setSupportingDocuments] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [loading, setLoading] = useState(true)

  const [newComment, setNewComment] = useState('')
  const [newCommentSectionId, setNewCommentSectionId] = useState(null)
  const [newCommentVisible, setNewCommentVisible] = useState(false)
  const [sendBackNotes, setSendBackNotes] = useState('')
  const [councilDate, setCouncilDate] = useState('')
  const [decisionType, setDecisionType] = useState('approved')
  const [reopenStage, setReopenStage] = useState('brenda_review')
  const [working, setWorking] = useState(false)

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
      const [secRes, valRes, cmtRes, revRes, docRes, actRes] = await Promise.all([
        supabase.from('mou_template_sections').select('*').eq('template_id', sub.template_id).order('section_order'),
        supabase.from('mou_submission_field_values').select('*').eq('submission_id', submissionId),
        supabase.from('mou_submission_section_comments').select('*').eq('submission_id', submissionId),
        supabase.from('mou_review_comments').select('*').eq('submission_id', submissionId).order('created_at'),
        supabase.from('mou_supporting_documents').select('*').eq('submission_id', submissionId),
        supabase.from('mou_activity_log').select('*').eq('submission_id', submissionId).order('created_at'),
      ])
      setSections(secRes.data || [])
      const values = {}
      for (const fv of valRes.data || []) values[fv.field_key] = fv.value
      setFieldValues(values)
      setSectionComments(cmtRes.data || [])
      setReviewComments(revRes.data || [])
      setSupportingDocuments(docRes.data || [])
      setActivityLog(actRes.data || [])
    }
    setLoading(false)
  }

  async function logActivity(action_type, extra = {}) {
    await supabase.from('mou_activity_log').insert([{ submission_id: submissionId, actor_type: 'admin', actor_name: roleName, action_type, ...extra }])
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

  async function transitionStage(newStage, patch = {}) {
    setWorking(true)
    await supabase.from('mou_submissions').update({ current_stage: newStage, ...patch }).eq('id', submissionId)
    setWorking(false)
  }

  async function handlePushToCityManager() {
    await transitionStage('city_manager_review')
    await logActivity('pushed_to_city_manager', { old_value: submission.current_stage, new_value: 'city_manager_review' })
    await sendMouEmail('mou_pushed_to_city_manager', {})
    await load()
  }

  async function handleSendBackToBrenda() {
    await transitionStage('brenda_review')
    await logActivity('sent_back_to_brenda', { old_value: submission.current_stage, new_value: 'brenda_review', notes: sendBackNotes || null })
    await sendMouEmail('mou_sent_back_to_brenda', {})
    setSendBackNotes('')
    await load()
  }

  async function handleSendBackToOrg() {
    const returnTo = submission.current_stage === 'city_manager_review' ? 'city_manager_review' : 'brenda_review'
    await transitionStage('org_revision', { return_to_stage: returnTo })
    await logActivity('sent_back_to_org', { old_value: submission.current_stage, new_value: 'org_revision', notes: sendBackNotes || null })
    await sendMouEmail('mou_sent_back_to_org', { orgEmail: submission.org_email, notes: sendBackNotes || null })
    setSendBackNotes('')
    await load()
  }

  async function handleFinalize() {
    setWorking(true)
    await supabase.from('mou_submissions').update({ current_stage: 'finalized', finalized_at: new Date().toISOString() }).eq('id', submissionId)
    await logActivity('finalized', { old_value: submission.current_stage, new_value: 'finalized' })
    await sendMouEmail('mou_finalized', {})
    setWorking(false)
    await load()
  }

  async function handleGoToExport() {
    if (submission.current_stage === 'finalized') {
      await supabase.from('mou_submissions').update({ current_stage: 'exported', exported_at: new Date().toISOString() }).eq('id', submissionId)
      await logActivity('exported', { old_value: 'finalized', new_value: 'exported' })
    }
    onPrint(submissionId)
  }

  async function handleSaveCouncilDate() {
    if (!councilDate) return
    setWorking(true)
    const patch = { council_date: councilDate }
    if (submission.current_stage === 'exported') patch.current_stage = 'scheduled_council'
    await supabase.from('mou_submissions').update(patch).eq('id', submissionId)
    await logActivity('council_scheduled', { new_value: councilDate })
    setWorking(false)
    await load()
  }

  async function handleRecordDecision() {
    setWorking(true)
    const patch = { council_decision: decisionType, council_decision_date: new Date().toISOString().slice(0, 10) }
    patch.current_stage = decisionType === 'sent_back_for_edits' ? reopenStage : 'council_decided'
    await supabase.from('mou_submissions').update(patch).eq('id', submissionId)
    await logActivity('council_decision_recorded', { new_value: decisionType })
    await sendMouEmail('mou_council_decision', {
      decision: decisionType,
      notifyOrg: decisionType === 'sent_back_for_edits',
      orgEmail: submission.org_email,
    })
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
  const canReviewAsBrenda = role === 'brenda' && (stage === 'submitted' || stage === 'brenda_review')
  const canReviewAsCityManager = role === 'cityManager' && stage === 'city_manager_review'
  const canFinalize = role === 'cityManager' && stage === 'city_manager_review'
  const canExport = stage === 'finalized' || stage === 'exported' || stage === 'scheduled_council'
  const canScheduleCouncil = stage === 'exported' || stage === 'scheduled_council'
  const canRecordDecision = stage === 'scheduled_council'

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.backLink} onClick={onBack}>← Back to MOU Submissions</span>
        <h1 style={s.title}>{submission.org_name}</h1>
        <p style={s.subtitle}>{submission.submission_number} · Contact: {submission.org_contact_name} ({submission.org_email})</p>
        <span style={s.badge}>{MOU_STAGE_LABELS[stage] || stage}</span>

        {!role && (
          <div style={s.noAccess}>
            Your login ({userEmail}) isn't recognized as an MOU reviewer (Brenda or the City Manager), so review actions are unavailable. You can still view this submission's contents below.
          </div>
        )}

        <div style={s.sectionTitle}>Submission Contents</div>
        {sections.map(section => {
          const ownComments = sectionComments.filter(c => c.template_section_id === section.id)
          const sectionReviewComments = reviewComments.filter(c => c.template_section_id === section.id)
          return (
            <div key={section.id}>
              <div style={{ fontWeight: '700', color: '#374151', fontSize: '14px', marginTop: '18px', marginBottom: '6px' }}>{section.title}</div>
              <div style={s.lockedText}>{renderLockedText(section.locked_text, fieldValues, fieldsByKey)}</div>
              {ownComments.map(c => (
                <div key={c.id} style={s.orgNote}>Organization's note: "{c.comment_text}"</div>
              ))}
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
                    placeholder={`Add a comment on "${section.title}"...`}
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
                      <button style={s.buttonSecondary} disabled={working} onClick={handlePostComment}>Post Comment</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <div style={s.sectionTitle}>General Comments</div>
        {reviewComments.filter(c => !c.template_section_id).length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>No general comments.</div>
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
              placeholder="Add a general comment..."
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
                <button style={s.buttonSecondary} disabled={working} onClick={handlePostComment}>Post Comment</button>
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
              <button style={s.buttonSecondary} disabled={working} onClick={handleSendBackToOrg}>Send Back to Organization</button>
              <button style={s.button} disabled={working} onClick={handlePushToCityManager}>Push to City Manager</button>
            </div>
          </div>
        )}

        {canReviewAsCityManager && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>City Manager's Review Actions</div>
            <textarea style={s.textarea} placeholder="Reason / notes for sending back (included in the notification email)..." value={sendBackNotes} onChange={e => setSendBackNotes(e.target.value)} />
            <div>
              <button style={s.buttonSecondary} disabled={working} onClick={handleSendBackToBrenda}>Send Back to Brenda</button>
              <button style={s.buttonSecondary} disabled={working} onClick={handleSendBackToOrg}>Send Back to Organization</button>
              {canFinalize && <button style={s.button} disabled={working} onClick={handleFinalize}>Finalize Agreement</button>}
            </div>
          </div>
        )}

        {canExport && (
          <div style={s.actionBox}>
            <div style={s.actionBoxTitle}>Export</div>
            <button style={s.button} disabled={working} onClick={handleGoToExport}>🖨️ Print / Export Agreement</button>
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
            <select style={s.input} value={decisionType} onChange={e => setDecisionType(e.target.value)}>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
              <option value="sent_back_for_edits">Sent Back for Edits</option>
            </select>
            {decisionType === 'sent_back_for_edits' && (
              <select style={s.input} value={reopenStage} onChange={e => setReopenStage(e.target.value)}>
                <option value="brenda_review">Reopen to Brenda's Review</option>
                <option value="city_manager_review">Reopen to City Manager's Review</option>
              </select>
            )}
            <button style={s.button} disabled={working} onClick={handleRecordDecision}>Record Decision</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MouSubmissionDetail
