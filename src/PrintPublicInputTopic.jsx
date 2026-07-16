import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function PrintPublicInputTopic({ topicId, onClose }) {
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

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  function formatHearing(t) {
    if (!t.hearing_date) return null
    const date = new Date(`${t.hearing_date}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
    const time = t.hearing_time
      ? new Date(`2000-01-01T${t.hearing_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null
    return [date, time, t.hearing_location].filter(Boolean).join(' · ')
  }

  function handlePrint() {
    window.print()
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  if (!topic) return <div style={{ padding: '40px', textAlign: 'center' }}>Topic not found.</div>

  const totalApproved = comments.length
  const positionCounts = positions.map(p => ({
    ...p,
    count: comments.filter(c => c.position_id === p.id).length,
  }))
  const isClosed = topic.status === 'closed' || new Date() > new Date(topic.comment_closes_at)

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .print-page { padding: 32px; font-family: Arial, sans-serif; font-size: 12px; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          .print-page { max-width: 800px; margin: 0 auto; padding: 32px; font-family: Arial, sans-serif; background: white; font-size: 13px; }
          body { background: #f0f4f8; }
        }
      `}</style>

      <div className="no-print" style={{ backgroundColor: '#0f3d7a', padding: '12px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
          ← Back
        </button>
        <button onClick={handlePrint} style={{ backgroundColor: '#1a56a0', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '13px', padding: '6px 16px', borderRadius: '4px', fontWeight: '600' }}>
          Print / Save as PDF
        </button>
      </div>

      <div className="print-page">
        {/* Header */}
        <div style={{ borderBottom: '3px solid #1a56a0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a56a0' }}>City of Franklin, NH</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                Public Comment — Analysis Report
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Exported: {formatDate(new Date().toISOString())}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: isClosed ? '#991b1b' : '#065f46', marginTop: '2px' }}>
                {isClosed ? 'Comment Period Closed' : 'Comment Period Open'}
              </div>
            </div>
          </div>
        </div>

        {/* Topic Details */}
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a56a0', marginBottom: '6px' }}>{topic.title}</div>
        {topic.description && <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', lineHeight: '1.5' }}>{topic.description}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            {[
              ['Hearing', formatHearing(topic) || '—'],
              ['Comment Period Opened', formatDateTime(topic.comment_opens_at)],
              ['Comment Period Closes', formatDateTime(topic.comment_closes_at)],
              ['Reference', topic.reference_url || '—'],
            ].map(([label, value], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '7px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', width: '180px', verticalAlign: 'top' }}>{label}</td>
                <td style={{ padding: '7px 12px', color: '#111827', borderLeft: '1px solid #e5e7eb', lineHeight: '1.5', wordBreak: 'break-word' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Analysis */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Analysis</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Position</th>
              <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '100px' }}>Count</th>
              <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '100px' }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {positionCounts.map((p, i) => {
              const pct = totalApproved > 0 ? Math.round((p.count / totalApproved) * 100) : 0
              return (
                <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '7px 12px', color: '#111827' }}>{p.label}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#111827' }}>{p.count}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#111827' }}>{pct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
          {totalApproved} total published comment{totalApproved === 1 ? '' : 's'}
        </div>

        {/* Concern Themes */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Concern Themes</div>
        {themeCounts.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '24px' }}>No concern themes reported.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Theme</th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '100px' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {themeCounts.map((t, i) => (
                <tr key={t.label} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '7px 12px', color: '#111827' }}>{t.label}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#111827' }}>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Public Comments */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Public Comments</div>
        {comments.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '24px' }}>No comments published.</div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            {comments.map(c => {
              const position = positions.find(p => p.id === c.position_id)
              return (
                <div key={c.id} style={{ borderLeft: '3px solid #1a56a0', paddingLeft: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>
                    {c.name} · {c.ward}{position ? ` · ${position.label}` : ''} · {formatDateTime(c.created_at)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{c.comment_text}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Questions */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Questions</div>
        {questions.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '24px' }}>No questions submitted.</div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            {questions.map(q => (
              <div key={q.id} style={{ borderLeft: '3px solid #1a56a0', paddingLeft: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{q.question_text}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Asked by {q.comments?.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', fontSize: '11px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>City of Franklin, NH — Public Comment Module</span>
          <span>{topic.title}</span>
        </div>
      </div>
    </div>
  )
}

export default PrintPublicInputTopic
