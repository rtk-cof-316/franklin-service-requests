import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { isTopicOpen } from './publicInputValidation'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '32px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1a56a0',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  printBtn: {
    marginLeft: 'auto',
    padding: '7px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #1a56a0',
    color: '#1a56a0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  headerBand: {
    backgroundColor: '#1a56a0',
    padding: '24px 28px',
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
    color: '#93afd4',
  },
  headerBody: {
    padding: '20px 28px',
  },
  hearingInfo: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  refLink: {
    fontSize: '13px',
    color: '#1a56a0',
    fontWeight: '600',
    textDecoration: 'underline',
  },
  windowLine: {
    marginTop: '10px',
    fontSize: '13px',
    fontWeight: '600',
  },
  windowOpen: { color: '#065f46' },
  windowClosed: { color: '#991b1b' },
  submitBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#1a56a0',
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  analysisCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '24px',
    marginBottom: '20px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6b7280',
    marginBottom: '16px',
    paddingBottom: '6px',
    borderBottom: '2px solid #e2e8f0',
  },
  positionRow: {
    marginBottom: '14px',
  },
  positionLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '4px',
  },
  positionLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  positionCount: {
    color: '#6b7280',
    fontSize: '13px',
  },
  barTrack: {
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#1a56a0',
    borderRadius: '5px',
  },
  totalLine: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '12px',
  },
  feedCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '24px',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box',
  },
  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '24px',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box',
  },
  commentItem: {
    borderBottom: '1px solid #f3f4f6',
    padding: '14px 0',
  },
  commentMetaRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  commentName: {
    fontWeight: '700',
    color: '#111827',
    fontSize: '14px',
  },
  wardTag: {
    fontSize: '11px',
    color: '#6b7280',
  },
  positionTag: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  commentText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  questionItem: {
    borderBottom: '1px solid #f3f4f6',
    padding: '12px 0',
  },
  questionText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '4px',
  },
  questionMeta: {
    fontSize: '11px',
    color: '#9ca3af',
  },
}

function formatHearing(topic) {
  if (!topic.hearing_date) return null
  const date = new Date(`${topic.hearing_date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const time = topic.hearing_time
    ? new Date(`2000-01-01T${topic.hearing_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null
  return [date, time, topic.hearing_location].filter(Boolean).join(' · ')
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function PublicInputTopic({ topicId, onBack, onSubmit, onPrint }) {
  const [topic, setTopic] = useState(null)
  const [positions, setPositions] = useState([])
  const [comments, setComments] = useState([])
  const [themeCounts, setThemeCounts] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [topicId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadTopic(), loadPositions(), loadComments(), loadThemeCounts(), loadQuestions()])
    setLoading(false)
  }

  async function loadTopic() {
    const { data } = await supabase.from('topics').select('*').eq('id', topicId).single()
    setTopic(data || null)
  }

  async function loadPositions() {
    const { data } = await supabase
      .from('topic_positions')
      .select('*')
      .eq('topic_id', topicId)
      .order('sort_order')
    setPositions(data || [])
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('id, name, ward, comment_text, position_id, created_at')
      .eq('topic_id', topicId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    setComments(data || [])
  }

  async function loadThemeCounts() {
    const { data } = await supabase
      .from('comment_concern_themes')
      .select('theme_id, concern_themes ( label, group_label ), comments!inner ( status, topic_id )')
      .eq('comments.status', 'approved')
      .eq('comments.topic_id', topicId)

    const counts = {}
    ;(data || []).forEach(row => {
      const key = row.theme_id
      if (!counts[key]) counts[key] = { label: row.concern_themes?.label || 'Unknown', count: 0 }
      counts[key].count += 1
    })
    setThemeCounts(Object.values(counts).sort((a, b) => b.count - a.count))
  }

  async function loadQuestions() {
    const { data } = await supabase
      .from('comment_questions')
      .select('id, question_text, sort_order, comments!inner ( status, topic_id, name )')
      .eq('comments.status', 'approved')
      .eq('comments.topic_id', topicId)
      .order('sort_order')
    setQuestions(data || [])
  }

  if (loading || !topic) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.emptyState}>Loading topic...</div>
        </div>
      </div>
    )
  }

  const open = isTopicOpen(topic)
  const hearingLine = formatHearing(topic)
  const totalApproved = comments.length
  const positionCounts = positions.map(p => ({
    ...p,
    count: comments.filter(c => c.position_id === p.id).length,
  }))
  const maxThemeCount = Math.max(0, ...themeCounts.map(t => t.count))

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={onBack}>← Back to all topics</button>
          <button style={styles.printBtn} onClick={() => onPrint(topicId)}>🖨️ Print / Save as PDF</button>
        </div>

        <div style={styles.headerCard}>
          <div style={styles.headerBand}>
            <h1 style={styles.headerTitle}>{topic.title}</h1>
            <p style={styles.headerSub}>City Council Public Input</p>
          </div>
          <div style={styles.headerBody}>
            {hearingLine && <div style={styles.hearingInfo}>🗓️ {hearingLine}</div>}
            {topic.reference_url && (
              <a href={topic.reference_url} target="_blank" rel="noopener noreferrer" style={styles.refLink}>
                Read the full proposal →
              </a>
            )}
            <div style={{ ...styles.windowLine, ...(open ? styles.windowOpen : styles.windowClosed) }}>
              {open
                ? `Comment period open until ${formatDateTime(topic.comment_closes_at)}`
                : 'Comments are closed for this topic — this page is archived and read-only.'}
            </div>
            {open && (
              <button style={styles.submitBtn} onClick={() => onSubmit(topicId)}>
                Submit public comment on this topic
              </button>
            )}
          </div>
        </div>

        <div style={styles.analysisCard}>
          <div style={styles.sectionLabel}>Analysis</div>
          {positionCounts.map(p => {
            const pct = totalApproved > 0 ? Math.round((p.count / totalApproved) * 100) : 0
            return (
              <div key={p.id} style={styles.positionRow}>
                <div style={styles.positionLabelRow}>
                  <span style={styles.positionLabel}>{p.label}</span>
                  <span style={styles.positionCount}>{p.count} ({pct}%)</span>
                </div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          <div style={styles.totalLine}>{totalApproved} total published comment{totalApproved === 1 ? '' : 's'}</div>
        </div>

        <div style={styles.sidebarCard}>
          <div style={styles.sectionLabel}>Concern Themes</div>
          {themeCounts.length === 0 ? (
            <div style={styles.emptyState}>No concern themes reported yet.</div>
          ) : (
            themeCounts.map(t => {
              const pct = maxThemeCount > 0 ? Math.round((t.count / maxThemeCount) * 100) : 0
              return (
                <div key={t.label} style={styles.positionRow}>
                  <div style={styles.positionLabelRow}>
                    <span style={styles.positionLabel}>{t.label}</span>
                    <span style={styles.positionCount}>{t.count}</span>
                  </div>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={styles.feedCard}>
          <div style={styles.sectionLabel}>Public Comments</div>
          {comments.length === 0 ? (
            <div style={styles.emptyState}>No comments published yet.</div>
          ) : (
            comments.map(c => {
              const position = positions.find(p => p.id === c.position_id)
              return (
                <div key={c.id} style={styles.commentItem}>
                  <div style={styles.commentMetaRow}>
                    <span style={styles.commentName}>{c.name}</span>
                    <span style={styles.wardTag}>{c.ward}</span>
                    {position && <span style={styles.positionTag}>{position.label}</span>}
                  </div>
                  <div style={styles.commentText}>{c.comment_text}</div>
                </div>
              )
            })
          )}
        </div>

        <div style={styles.feedCard}>
          <div style={styles.sectionLabel}>Questions</div>
          {questions.length === 0 ? (
            <div style={styles.emptyState}>No questions submitted yet.</div>
          ) : (
            questions.map(q => (
              <div key={q.id} style={styles.questionItem}>
                <div style={styles.questionText}>{q.question_text}</div>
                <div style={styles.questionMeta}>Asked by {q.comments?.name}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicInputTopic
