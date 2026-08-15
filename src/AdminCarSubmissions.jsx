import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { CAR_STATUS_LABELS } from './carConfig'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  navLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', fontWeight: '600' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  filterBtn: (active) => ({
    padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    border: active ? '1px solid #1a56a0' : '1px solid #d1d5db',
    backgroundColor: active ? '#1a56a0' : '#ffffff',
    color: active ? '#ffffff' : '#374151',
  }),
  searchInput: { padding: '7px 14px', border: '1px solid #d1d5db', borderRadius: '16px', fontSize: '12px', minWidth: '240px', marginLeft: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dbeafe' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  row: { cursor: 'pointer' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' },
}

const STATUS_COLORS = {
  submitted: { bg: '#f3f4f6', color: '#6b7280' },
  under_review: { bg: '#dbeafe', color: '#1e40af' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  pending_work_session_assignment: { bg: '#fef3c7', color: '#92400e' },
  scheduled_for_work_session: { bg: '#fef3c7', color: '#92400e' },
  answer_due: { bg: '#fef3c7', color: '#92400e' },
  answer_submitted: { bg: '#fef3c7', color: '#92400e' },
  pushed_to_reassignment: { bg: '#fee2e2', color: '#991b1b' },
  included_in_packet: { bg: '#d1fae5', color: '#065f46' },
  packet_published: { bg: '#d1fae5', color: '#065f46' },
  decided_at_meeting: { bg: '#d1fae5', color: '#065f46' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AdminCarSubmissions({ onViewSubmission, onManageCycles }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('car_submissions')
      .select('*, meeting_cycles(meeting_date)')
      .order('created_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  const DONE_STATUSES = ['rejected', 'packet_published', 'decided_at_meeting']

  const filtered = submissions.filter(sub => {
    if (filter === 'active' && DONE_STATUSES.includes(sub.status)) return false
    if (filter === 'done' && !DONE_STATUSES.includes(sub.status)) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const haystack = `${sub.submission_number} ${sub.from_field || ''} ${sub.subject || ''} ${sub.submitter_name} ${sub.submitter_email}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>Council Action Reports</h1>
        <span style={styles.navLink} onClick={onManageCycles}>Manage Meeting Cycles →</span>
      </div>

      <div style={styles.filterRow}>
        <button style={styles.filterBtn(filter === 'active')} onClick={() => setFilter('active')}>Active</button>
        <button style={styles.filterBtn(filter === 'done')} onClick={() => setFilter('done')}>Rejected / Decided</button>
        <button style={styles.filterBtn(filter === 'all')} onClick={() => setFilter('all')}>All</button>
        <input
          style={styles.searchInput}
          placeholder="Search by submission #, From, Subject, submitter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No CAR submissions in this view.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Submission #</th>
              <th style={styles.th}>From</th>
              <th style={styles.th}>Subject</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Meeting Date</th>
              <th style={styles.th}>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sub => {
              const color = STATUS_COLORS[sub.status] || STATUS_COLORS.submitted
              return (
                <tr key={sub.id} style={styles.row} onClick={() => onViewSubmission(sub.id)}>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#1a56a0' }}>{sub.submission_number}</td>
                  <td style={styles.td}>{sub.from_field || '—'}</td>
                  <td style={styles.td}>{sub.subject || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: color.bg, color: color.color }}>
                      {CAR_STATUS_LABELS[sub.status] || sub.status}
                    </span>
                  </td>
                  <td style={styles.td}>{formatDate(sub.meeting_cycles?.meeting_date)}</td>
                  <td style={styles.td}>{formatDate(sub.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminCarSubmissions
