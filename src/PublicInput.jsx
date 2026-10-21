import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { PUBLIC_COMMENT_DISCLAIMER_TITLE, PUBLIC_COMMENT_DISCLAIMER_BODY, isTopicOpen } from './publicInputValidation'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '40px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
  },
  headerCard: {
    backgroundColor: '#1a56a0',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    padding: '28px 32px',
    marginBottom: '20px',
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    color: '#e8eef6',
  },
  headerSub: {
    margin: 0,
    fontSize: '14px',
    color: '#93afd4',
  },
  disclaimer: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    fontSize: '13px',
    color: '#92400e',
    lineHeight: '1.6',
  },
  disclaimerTitle: {
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6b7280',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '2px solid #e2e8f0',
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '24px',
    marginBottom: '16px',
  },
  topicTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a56a0',
    margin: '0 0 8px 0',
  },
  topicDescription: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '14px',
  },
  hearingInfo: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '10px',
    lineHeight: '1.6',
  },
  deadline: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: '10px',
  },
  refLink: {
    display: 'inline-block',
    fontSize: '13px',
    color: '#1a56a0',
    fontWeight: '600',
    textDecoration: 'underline',
    marginBottom: '14px',
  },
  tally: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '16px',
  },
  archiveFilter: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  archiveFilterLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  },
  archiveFilterInput: {
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
  },
  archiveFilterClear: {
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    cursor: 'pointer',
  },
  archiveFilterNote: {
    fontSize: '12px',
    color: '#6b7280',
    width: '100%',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  viewBtn: {
    padding: '9px 18px',
    backgroundColor: '#ffffff',
    border: '1px solid #1a56a0',
    color: '#1a56a0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '9px 18px',
    backgroundColor: '#1a56a0',
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  closedBadge: {
    display: 'inline-block',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  archiveCard: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#ffffff',
    border: '2px solid #1a56a0',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '18px 24px',
    marginTop: '28px',
    marginBottom: '16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  archiveIcon: {
    fontSize: '20px',
  },
  archiveTextWrap: {
    flex: 1,
  },
  archiveTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a56a0',
  },
  archiveHint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  archiveCount: {
    display: 'inline-block',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    borderRadius: '20px',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: '700',
  },
  archiveChevron: {
    fontSize: '14px',
    color: '#1a56a0',
    fontWeight: '700',
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
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function TopicCard({ topic, tally, onViewTopic, onSubmitTopic }) {
  const open = isTopicOpen(topic)
  const hearingLine = formatHearing(topic)
  const closesLine = formatDateTime(topic.comment_closes_at)
  return (
    <div style={styles.topicCard}>
      {!open && <div style={styles.closedBadge}>Archived</div>}
      <h3 style={styles.topicTitle}>{topic.title}</h3>
      {topic.description && <p style={styles.topicDescription}>{topic.description}</p>}
      {hearingLine && <div style={styles.hearingInfo}>🗓️ {hearingLine}</div>}
      {open && closesLine && (
        <div style={styles.deadline}>⏰ Public comment closes: {closesLine}</div>
      )}
      {topic.reference_url && (
        <div>
          <a href={topic.reference_url} target="_blank" rel="noopener noreferrer" style={styles.refLink}>
            Read the full proposal →
          </a>
        </div>
      )}
      <div>
        <span style={styles.tally}>{tally || 0} comment{tally === 1 ? '' : 's'} submitted</span>
      </div>
      <div style={styles.actionRow}>
        <button style={styles.viewBtn} onClick={() => onViewTopic(topic.id)}>View Comments &amp; Analysis</button>
        {open && (
          <button style={styles.submitBtn} onClick={() => onSubmitTopic(topic.id)}>
            Submit public comment on this topic
          </button>
        )}
      </div>
    </div>
  )
}

function PublicInput({ onViewTopic, onSubmitTopic }) {
  const [topics, setTopics] = useState([])
  const [tallies, setTallies] = useState({})
  const [loading, setLoading] = useState(true)
  const [showArchive, setShowArchive] = useState(false)
  const [hearingFrom, setHearingFrom] = useState('')
  const [hearingTo, setHearingTo] = useState('')

  useEffect(() => {
    loadTopics()
  }, [])

  async function loadTopics() {
    setLoading(true)
    const { data: topicData } = await supabase
      .from('topics')
      .select('*')
      .order('hearing_date', { ascending: true })
    setTopics(topicData || [])

    const { data: commentData } = await supabase
      .from('comments')
      .select('topic_id')
      .eq('status', 'approved')
    const counts = {}
    ;(commentData || []).forEach(c => {
      counts[c.topic_id] = (counts[c.topic_id] || 0) + 1
    })
    setTallies(counts)
    setLoading(false)
  }

  const activeTopics = topics.filter(t => isTopicOpen(t))
  const archivedTopics = topics.filter(t => !isTopicOpen(t))

  // hearing_date is a plain 'YYYY-MM-DD' date, as are the date inputs, so string comparison
  // is a correct date comparison. A topic with no hearing date can't match a date range.
  const dateFilterOn = Boolean(hearingFrom || hearingTo)
  const visibleArchived = archivedTopics.filter(t => {
    if (!dateFilterOn) return true
    if (!t.hearing_date) return false
    if (hearingFrom && t.hearing_date < hearingFrom) return false
    if (hearingTo && t.hearing_date > hearingTo) return false
    return true
  })
  const undatedArchived = archivedTopics.filter(t => !t.hearing_date).length
  const rangeBackwards = Boolean(hearingFrom && hearingTo && hearingFrom > hearingTo)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.headerTitle}>Public Comment</h1>
          <p style={styles.headerSub}>
            Public input page to offer comment on issues being addressed by the Franklin City Council.
            This does not replace in-person public comment at a public hearing, but it increases
            accessibility for Franklin residents who cannot attend in person to provide feedback and
            have their voice heard.
          </p>
        </div>

        <div style={styles.disclaimer}>
          <span style={styles.disclaimerTitle}>{PUBLIC_COMMENT_DISCLAIMER_TITLE}</span> {PUBLIC_COMMENT_DISCLAIMER_BODY}
        </div>

        <div style={styles.sectionLabel}>Open for Comment</div>
        {loading ? (
          <div style={styles.emptyState}>Loading topics...</div>
        ) : activeTopics.length === 0 ? (
          <div style={styles.emptyState}>There are no topics currently open for public comment.</div>
        ) : (
          activeTopics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              tally={tallies[topic.id]}
              onViewTopic={onViewTopic}
              onSubmitTopic={onSubmitTopic}
            />
          ))
        )}

        {archivedTopics.length > 0 && (
          <>
            <button style={styles.archiveCard} onClick={() => setShowArchive(prev => !prev)}>
              <span style={styles.archiveIcon}>🗂️</span>
              <span style={styles.archiveTextWrap}>
                <div>
                  <span style={styles.archiveTitle}>Archived Topics </span>
                  <span style={styles.archiveCount}>{archivedTopics.length}</span>
                </div>
                <div style={styles.archiveHint}>Comment period closed — view past topics and results</div>
              </span>
              <span style={styles.archiveChevron}>{showArchive ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showArchive && (
              <div style={styles.archiveFilter}>
                <label style={styles.archiveFilterLabel}>
                  Hearing date from
                  <input type="date" style={styles.archiveFilterInput} value={hearingFrom} onChange={e => setHearingFrom(e.target.value)} />
                </label>
                <label style={styles.archiveFilterLabel}>
                  to
                  <input type="date" style={styles.archiveFilterInput} value={hearingTo} onChange={e => setHearingTo(e.target.value)} />
                </label>
                {dateFilterOn && (
                  <button style={styles.archiveFilterClear} onClick={() => { setHearingFrom(''); setHearingTo('') }}>Clear</button>
                )}
                <div style={styles.archiveFilterNote}>
                  {dateFilterOn
                    ? `Showing ${visibleArchived.length} of ${archivedTopics.length} archived topic${archivedTopics.length === 1 ? '' : 's'}.${undatedArchived > 0 ? ` ${undatedArchived} with no hearing date ${undatedArchived === 1 ? 'is' : 'are'} hidden while a date is set.` : ''}`
                    : 'Choose a start and/or end date to find topics by the date of their public hearing.'}
                  {rangeBackwards && ' The start date is after the end date.'}
                </div>
              </div>
            )}
            {showArchive && visibleArchived.length === 0 && (
              <div style={styles.emptyState}>No archived topics have a public hearing in that date range.</div>
            )}
            {showArchive && visibleArchived.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                tally={tallies[topic.id]}
                onViewTopic={onViewTopic}
                onSubmitTopic={onSubmitTopic}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default PublicInput
