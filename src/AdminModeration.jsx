import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '0 24px 32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  select: { padding: '7px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', backgroundColor: '#ffffff', outline: 'none' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' },
  nameLine: { fontSize: '15px', fontWeight: '700', color: '#111827' },
  metaLine: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  topicTag: { display: 'inline-block', backgroundColor: '#eff6ff', color: '#1a56a0', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', marginRight: '6px' },
  positionTag: { display: 'inline-block', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' },
  commentText: { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '12px 0' },
  sectionTitle: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginTop: '12px', marginBottom: '6px' },
  questionItem: { fontSize: '13px', color: '#374151', marginBottom: '4px' },
  themeChip: { display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', marginRight: '6px', marginBottom: '4px' },
  actionRow: { display: 'flex', gap: '10px', marginTop: '16px' },
  approveBtn: { padding: '8px 18px', backgroundColor: '#16a34a', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  rejectBtn: { padding: '8px 18px', backgroundColor: '#dc2626', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px', backgroundColor: '#ffffff', borderRadius: '8px' },
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function AdminModeration() {
  const [comments, setComments] = useState([])
  const [topics, setTopics] = useState([])
  const [topicFilter, setTopicFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)

  useEffect(() => {
    loadTopics()
    loadPending()
  }, [])

  async function loadTopics() {
    const { data } = await supabase.from('topics').select('id, title').order('title')
    setTopics(data || [])
  }

  async function loadPending() {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select(`
        id, name, ward, comment_text, created_at, has_concern, topic_id,
        topics ( title ),
        topic_positions ( label ),
        comment_questions ( question_text, sort_order ),
        comment_concern_themes ( concern_themes ( label ) )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  async function handleDecision(commentId, decision) {
    setActingId(commentId)
    await supabase.from('comments').update({ status: decision }).eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
    setActingId(null)
  }

  const filtered = topicFilter === 'all' ? comments : comments.filter(c => c.topic_id === topicFilter)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h1 style={styles.headerTitle}>Moderation Queue</h1>
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} style={styles.select}>
            <option value="all">All Topics</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading pending comments...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>No pending comments to review.</div>
        ) : (
          filtered.map(c => (
            <div key={c.id} style={styles.card}>
              <div style={styles.topRow}>
                <div>
                  <div style={styles.nameLine}>{c.name} · {c.ward}</div>
                  <div style={styles.metaLine}>Submitted {formatDateTime(c.created_at)}</div>
                </div>
                <div>
                  <span style={styles.topicTag}>{c.topics?.title || 'Unknown topic'}</span>
                  <span style={styles.positionTag}>{c.topic_positions?.label || 'Unknown position'}</span>
                </div>
              </div>

              <div style={styles.commentText}>{c.comment_text}</div>

              {c.comment_questions?.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Specific Questions</div>
                  {[...c.comment_questions].sort((a, b) => a.sort_order - b.sort_order).map((q, i) => (
                    <div key={i} style={styles.questionItem}>• {q.question_text}</div>
                  ))}
                </>
              )}

              {c.comment_concern_themes?.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Concern Themes</div>
                  <div>
                    {c.comment_concern_themes.map((t, i) => (
                      <span key={i} style={styles.themeChip}>{t.concern_themes?.label}</span>
                    ))}
                  </div>
                </>
              )}

              <div style={styles.actionRow}>
                <button
                  style={styles.approveBtn}
                  disabled={actingId === c.id}
                  onClick={() => handleDecision(c.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  style={styles.rejectBtn}
                  disabled={actingId === c.id}
                  onClick={() => handleDecision(c.id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminModeration
