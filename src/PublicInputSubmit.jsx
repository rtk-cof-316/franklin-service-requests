import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  PUBLIC_COMMENT_DISCLAIMER_TITLE,
  PUBLIC_COMMENT_DISCLAIMER_BODY,
  HONEYPOT_FIELD_NAME,
  isHoneypotTripped,
  isBlockedName,
  isTopicOpen,
} from './publicInputValidation'

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const WARDS = ['Ward 1', 'Ward 2', 'Ward 3']
const MAX_QUESTIONS = 15
const MAX_COMMENT_LENGTH = 2000
const MAX_QUESTION_LENGTH = 150

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '40px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    maxWidth: '640px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    padding: '28px 32px',
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#e8eef6',
  },
  headerSub: {
    margin: 0,
    fontSize: '13px',
    opacity: 0.85,
  },
  body: {
    padding: '32px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1a56a0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '16px',
  },
  disclaimer: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    padding: '14px 16px',
    marginBottom: '24px',
    fontSize: '12px',
    color: '#92400e',
    lineHeight: '1.6',
  },
  disclaimerTitle: {
    fontWeight: '700',
  },
  deadline: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: '16px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  required: {
    color: '#dc2626',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: '#111827',
    outline: 'none',
  },
  inputError: {
    border: '1px solid #dc2626',
  },
  errorText: {
    fontSize: '12px',
    color: '#dc2626',
    marginTop: '4px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  radioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  radioLabel: {
    fontSize: '14px',
    color: '#374151',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: '#111827',
    resize: 'vertical',
    minHeight: '140px',
    outline: 'none',
  },
  charCounter: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: '4px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    marginBottom: '20px',
  },
  checkbox: {
    marginTop: '2px',
    width: '16px',
    height: '16px',
    accentColor: '#1a56a0',
    flexShrink: 0,
  },
  checkboxText: {
    fontSize: '14px',
    color: '#1e3a5f',
  },
  concernSection: {
    marginBottom: '20px',
    paddingLeft: '16px',
    borderLeft: '3px solid #bfdbfe',
  },
  subLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '10px',
  },
  addQuestionBtn: {
    background: 'none',
    border: '1px dashed #93afd4',
    color: '#1a56a0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '6px',
    marginTop: '4px',
  },
  themeGroupTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6b7280',
    margin: '14px 0 8px 0',
  },
  themeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  themeLabel: {
    fontSize: '13px',
    color: '#374151',
  },
  honeypot: {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    width: '1px',
    height: '1px',
    opacity: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitBtnDisabled: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#93afd4',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
  },
  successPage: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '60px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    display: 'flex',
    justifyContent: 'center',
  },
  successCard: {
    maxWidth: '520px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    textAlign: 'center',
  },
  successHeader: {
    backgroundColor: '#1a56a0',
    padding: '28px 32px',
  },
  successIcon: {
    fontSize: '48px',
    color: '#ffffff',
    marginBottom: '8px',
  },
  successTitle: {
    color: '#ffffff',
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
  },
  successBody: {
    padding: '32px',
  },
  successText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: '8px 0',
  },
  closedNotice: {
    padding: '24px',
    textAlign: 'center',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    borderRadius: '6px',
    fontSize: '14px',
  },
}

function formatDateTime(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function PublicInputSubmit({ topicId, onBack, onSubmitted }) {
  const [topic, setTopic] = useState(null)
  const [positions, setPositions] = useState([])
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [ward, setWard] = useState('')
  const [positionId, setPositionId] = useState('')
  const [commentText, setCommentText] = useState('')
  const [hasConcern, setHasConcern] = useState(false)
  const [questions, setQuestions] = useState([])
  const [selectedThemeIds, setSelectedThemeIds] = useState([])
  const [honeypot, setHoneypot] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    loadData()
  }, [topicId])

  async function loadData() {
    setLoading(true)
    const { data: topicData } = await supabase.from('topics').select('*').eq('id', topicId).single()
    setTopic(topicData || null)

    const { data: positionData } = await supabase
      .from('topic_positions')
      .select('*')
      .eq('topic_id', topicId)
      .order('sort_order')
    setPositions(positionData || [])

    const { data: themeData } = await supabase
      .from('concern_themes')
      .select('*')
      .order('group_label')
      .order('sort_order')
    setThemes(themeData || [])

    setLoading(false)
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    setQuestions(prev => [...prev, ''])
  }

  function updateQuestion(index, value) {
    setQuestions(prev => prev.map((q, i) => (i === index ? value.slice(0, MAX_QUESTION_LENGTH) : q)))
  }

  function removeQuestion(index) {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  function toggleTheme(themeId) {
    setSelectedThemeIds(prev =>
      prev.includes(themeId) ? prev.filter(id => id !== themeId) : [...prev, themeId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Honeypot: silently drop, show success, no network call.
    if (isHoneypotTripped(honeypot)) {
      setSubmitted(true)
      return
    }

    if (isBlockedName(name)) {
      setNameError('Please enter your name. Anonymous submissions are not accepted.')
      return
    }
    setNameError('')

    if (!ward || !positionId || !commentText.trim()) return
    if (!topic || !isTopicOpen(topic)) return

    setSubmitting(true)

    // The id is generated client-side (rather than read back via .select()) because the
    // public insert RLS policy only allows selecting approved comments — a pending row's
    // id would be unreadable to the anon client immediately after insert.
    const newCommentId = crypto.randomUUID()

    const { error } = await supabase
      .from('comments')
      .insert([{
        id: newCommentId,
        topic_id: topicId,
        position_id: positionId,
        name: name.trim(),
        ward,
        comment_text: commentText.trim(),
        has_concern: hasConcern,
        status: 'pending',
      }])

    if (error) {
      console.error('Error submitting comment:', error)
      setSubmitting(false)
      return
    }

    if (hasConcern && questions.some(q => q.trim())) {
      const rows = questions
        .filter(q => q.trim())
        .map((q, i) => ({ comment_id: newCommentId, question_text: q.trim(), sort_order: i }))
      await supabase.from('comment_questions').insert(rows)
    }

    if (hasConcern && selectedThemeIds.length > 0) {
      const rows = selectedThemeIds.map(themeId => ({ comment_id: newCommentId, theme_id: themeId }))
      await supabase.from('comment_concern_themes').insert(rows)
    }

    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'public_comment_pending', topicTitle: topic.title, commentId: newCommentId }),
      })
    } catch (emailError) {
      console.error('Moderator alert email error:', emailError)
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  if (loading) {
    return <div style={styles.page}><div style={styles.card}><div style={styles.body}>Loading...</div></div></div>
  }

  if (submitted) {
    return (
      <div style={styles.successPage}>
        <div style={styles.successCard}>
          <div style={styles.successHeader}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Comment Received</h2>
          </div>
          <div style={styles.successBody}>
            <p style={styles.successText}>
              Thank you. Your public comment has been received and is pending publication.
            </p>
            <button style={{ ...styles.submitBtn, marginTop: '16px' }} onClick={onSubmitted}>
              Back to Topic
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!topic || !isTopicOpen(topic)) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.body}>
            <button style={styles.backBtn} onClick={onBack}>← Back</button>
            <div style={styles.closedNotice}>
              The comment period for this topic has closed. New comments can no longer be submitted.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const themeGroups = themes.reduce((acc, t) => {
    if (!acc[t.group_label]) acc[t.group_label] = []
    acc[t.group_label].push(t)
    return acc
  }, {})

  const canSubmit = ward && positionId && commentText.trim().length > 0 && commentText.length <= MAX_COMMENT_LENGTH

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Submit Public Comment</h1>
          <p style={styles.headerSub}>{topic.title}</p>
        </div>
        <div style={styles.body}>
          <button style={styles.backBtn} onClick={onBack}>← Back to topic</button>

          {formatDateTime(topic.comment_closes_at) && (
            <div style={styles.deadline}>⏰ Public comment closes: {formatDateTime(topic.comment_closes_at)}</div>
          )}

          <div style={styles.disclaimer}>
            <span style={styles.disclaimerTitle}>{PUBLIC_COMMENT_DISCLAIMER_TITLE}</span> {PUBLIC_COMMENT_DISCLAIMER_BODY}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Honeypot field: off-screen, not display:none, so bots that fill every field trip it */}
            <div style={styles.honeypot} aria-hidden="true">
              <label htmlFor={HONEYPOT_FIELD_NAME}>Website</label>
              <input
                type="text"
                id={HONEYPOT_FIELD_NAME}
                name={HONEYPOT_FIELD_NAME}
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Name <span style={styles.required}>*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError('') }}
                style={{ ...styles.input, ...(nameError ? styles.inputError : {}) }}
                placeholder="First and last name"
              />
              {nameError && <div style={styles.errorText}>{nameError}</div>}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Ward <span style={styles.required}>*</span></label>
              <select value={ward} onChange={e => setWard(e.target.value)} style={styles.select}>
                <option value="">-- Select your ward --</option>
                {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Position <span style={styles.required}>*</span></label>
              {positions.map(p => (
                <div key={p.id} style={styles.radioRow}>
                  <input
                    type="radio"
                    id={`position-${p.id}`}
                    name="position"
                    checked={positionId === p.id}
                    onChange={() => setPositionId(p.id)}
                  />
                  <label htmlFor={`position-${p.id}`} style={styles.radioLabel}>{p.label}</label>
                </div>
              ))}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Comment <span style={styles.required}>*</span></label>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                style={styles.textarea}
                placeholder="Share your comment for the council record."
              />
              <div style={styles.charCounter}>{commentText.length} / {MAX_COMMENT_LENGTH}</div>
            </div>

            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={hasConcern}
                onChange={e => setHasConcern(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                I have a specific question or concern for council
              </span>
            </div>

            {hasConcern && (
              <>
                <div style={styles.concernSection}>
                  <div style={styles.subLabel}>Specific Questions</div>
                  {questions.map((q, i) => (
                    <div key={i} style={styles.fieldGroup}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={q}
                          onChange={e => updateQuestion(i, e.target.value)}
                          maxLength={MAX_QUESTION_LENGTH}
                          style={styles.input}
                          placeholder={`Question ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeQuestion(i)}
                          style={{ ...styles.backBtn, marginBottom: 0, color: '#dc2626' }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={styles.charCounter}>{q.length} / {MAX_QUESTION_LENGTH}</div>
                    </div>
                  ))}
                  {questions.length < MAX_QUESTIONS && (
                    <button type="button" onClick={addQuestion} style={styles.addQuestionBtn}>
                      + Add another question
                    </button>
                  )}
                </div>

                <div style={styles.concernSection}>
                  <div style={styles.subLabel}>Concern Themes</div>
                  {Object.entries(themeGroups).map(([groupLabel, groupThemes]) => (
                    <div key={groupLabel}>
                      <div style={styles.themeGroupTitle}>{groupLabel}</div>
                      {groupThemes.map(t => (
                        <div key={t.id} style={styles.themeRow}>
                          <input
                            type="checkbox"
                            id={`theme-${t.id}`}
                            checked={selectedThemeIds.includes(t.id)}
                            onChange={() => toggleTheme(t.id)}
                          />
                          <label htmlFor={`theme-${t.id}`} style={styles.themeLabel}>{t.label}</label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              style={submitting || !canSubmit ? styles.submitBtnDisabled : styles.submitBtn}
            >
              {submitting ? 'Submitting...' : 'Submit comment for the record'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PublicInputSubmit
