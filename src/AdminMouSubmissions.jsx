import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { MOU_STAGE_LABELS } from './mouConfig'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { padding: '7px 14px', border: '1px solid #d1d5db', borderRadius: '16px', fontSize: '12px', minWidth: '240px', marginLeft: 'auto' },
  filterBtn: (active) => ({
    padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    border: active ? '1px solid #1a56a0' : '1px solid #d1d5db',
    backgroundColor: active ? '#1a56a0' : '#ffffff',
    color: active ? '#ffffff' : '#374151',
  }),
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dbeafe' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  row: { cursor: 'pointer' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' },
}

const STAGE_COLORS = {
  org_intake: { bg: '#f3f4f6', color: '#6b7280' },
  missing_information: { bg: '#fef3c7', color: '#92400e' },
  manager_review_brenda: { bg: '#dbeafe', color: '#1e40af' },
  manager_review_city_manager: { bg: '#e0e7ff', color: '#3730a3' },
  submitter_needs_review: { bg: '#fef3c7', color: '#92400e' },
  ready_for_council: { bg: '#fce7f3', color: '#9d174d' },
  approved: { bg: '#d1fae5', color: '#065f46' },
  denied: { bg: '#fee2e2', color: '#991b1b' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AdminMouSubmissions({ onViewSubmission, onEditTemplate }) {
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
      .from('mou_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  const DECIDED_STAGES = ['approved', 'denied']
  const filtered = submissions.filter(sub => {
    if (filter === 'active' && DECIDED_STAGES.includes(sub.current_stage)) return false
    if (filter === 'decided' && !DECIDED_STAGES.includes(sub.current_stage)) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const haystack = `${sub.org_name} ${sub.org_contact_name} ${sub.org_email} ${sub.submission_number}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>MOU Submissions</h1>
        <span style={{ fontSize: '13px', color: '#1a56a0', cursor: 'pointer', fontWeight: '600' }} onClick={onEditTemplate}>
          Edit Master Template →
        </span>
      </div>

      <div style={styles.filterRow}>
        <button style={styles.filterBtn(filter === 'active')} onClick={() => setFilter('active')}>Active</button>
        <button style={styles.filterBtn(filter === 'decided')} onClick={() => setFilter('decided')}>Council Decided</button>
        <button style={styles.filterBtn(filter === 'all')} onClick={() => setFilter('all')}>All</button>
        <input
          style={styles.searchInput}
          placeholder="Search by org name, contact, email, or submission #..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>No MOU submissions in this view.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Submission #</th>
              <th style={styles.th}>Organization</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Stage</th>
              <th style={styles.th}>Submitted</th>
              <th style={styles.th}>Council Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sub => {
              const color = STAGE_COLORS[sub.current_stage] || STAGE_COLORS.org_intake
              return (
                <tr key={sub.id} style={styles.row} onClick={() => onViewSubmission(sub.id)}>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#1a56a0' }}>{sub.submission_number}</td>
                  <td style={styles.td}>{sub.org_name}</td>
                  <td style={styles.td}>{sub.org_contact_name} · {sub.org_email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: color.bg, color: color.color }}>
                      {MOU_STAGE_LABELS[sub.current_stage] || sub.current_stage}
                    </span>
                  </td>
                  <td style={styles.td}>{formatDate(sub.created_at)}</td>
                  <td style={styles.td}>{formatDate(sub.council_date)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminMouSubmissions
