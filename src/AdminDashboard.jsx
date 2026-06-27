import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '32px 24px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a56a0',
    margin: '0 0 24px 0',
  },
  cardsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '20px 24px',
    minWidth: '180px',
    flex: '1',
  },
  scoreCardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  scoreCardValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1a56a0',
    lineHeight: 1,
  },
  scoreCardSub: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '20px 24px',
    flex: '2',
    minWidth: '280px',
  },
  alertCardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  alertRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
  },
  alertCaseNum: {
    fontWeight: '700',
    color: '#1a56a0',
    marginRight: '12px',
    cursor: 'pointer',
  },
  alertLocation: {
    color: '#374151',
    flex: 1,
  },
  alertDate: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#dc2626',
    whiteSpace: 'nowrap',
    marginLeft: '12px',
  },
  alertDateSoon: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#d97706',
    whiteSpace: 'nowrap',
    marginLeft: '12px',
  },
  noAlerts: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  tableTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '6px 10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#374151',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  filterInput: {
    padding: '6px 10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#374151',
    outline: 'none',
    width: '160px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  },
  caseNumLink: {
    fontWeight: '700',
    color: '#1a56a0',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  statusBadge: {
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tag91a: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#1a56a0',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: '600',
    marginLeft: '6px',
  },
  deptTag: {
    display: 'inline-block',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    marginRight: '4px',
    marginBottom: '2px',
  },
  deptTagClosed: {
    display: 'inline-block',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #6ee7b7',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    marginRight: '4px',
    marginBottom: '2px',
    fontWeight: '600',
  },
  viewBtn: {
    padding: '4px 12px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    fontStyle: 'italic',
  },
}

function getStatusStyle(name) {
  const s = (name || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return { ...styles.statusBadge, backgroundColor: '#d1fae5', color: '#065f46' }
  if (s === 'in progress' || s === 'assigned' || s === 'scheduled') return { ...styles.statusBadge, backgroundColor: '#dbeafe', color: '#1e40af' }
  if (s === 'lacks resources to resolve' || s === 'unfounded') return { ...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b' }
  return { ...styles.statusBadge, backgroundColor: '#f3f4f6', color: '#374151' }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const closedStatuses = ['resolved', 'closed', 'unfounded', 'referred to another department', 'lacks resources to resolve', 'request abandoned']

function AdminDashboard({ onViewCase, refreshKey }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState([])
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    loadCases()
    loadStatuses()
    loadDepartments()
  }, [refreshKey])

  async function loadStatuses() {
    const { data } = await supabase.from('statuses').select('*').order('name')
    setStatuses(data || [])
  }

  async function loadDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data || [])
  }

  async function loadCases() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        date_submitted,
        location,
        description,
        is_91a,
        followup_due_date,
        closed_date,
        statuses ( name ),
        issue_types ( name ),
        case_departments (
          departments ( name ),
          statuses ( name )
        )
      `)
      .order('date_submitted', { ascending: false })

    if (!error) setCases(data || [])
    setLoading(false)
  }

  const filteredCases = cases.filter(c => {
    const statusName = (c.statuses?.name || '').toLowerCase()
    const isOpen = !closedStatuses.includes(statusName)
    if (statusFilter === 'open' && !isOpen) return false
    if (statusFilter === 'closed' && isOpen) return false
    if (deptFilter !== 'all') {
      const assignedDepts = c.case_departments?.map(cd => cd.departments?.name) || []
      if (!assignedDepts.includes(deptFilter)) return false
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      return (
        c.case_number?.toLowerCase().includes(s) ||
        c.location?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const openCases = cases.filter(c => {
    const s = (c.statuses?.name || '').toLowerCase()
    return !closedStatuses.includes(s)
  })

  const upcomingFollowups = cases.filter(c => {
    if (!c.followup_due_date) return false
    const days = daysUntil(c.followup_due_date)
    return days !== null && days >= -999 && days <= 10
  }).sort((a, b) => new Date(a.followup_due_date) - new Date(b.followup_due_date))

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Admin Dashboard</h1>

      <div style={styles.cardsRow}>
        <div style={styles.scoreCard}>
          <div style={styles.scoreCardLabel}>Open Cases</div>
          <div style={styles.scoreCardValue}>{openCases.length}</div>
          <div style={styles.scoreCardSub}>Currently active</div>
        </div>

        <div style={styles.scoreCard}>
          <div style={styles.scoreCardLabel}>Total Cases</div>
          <div style={styles.scoreCardValue}>{cases.length}</div>
          <div style={styles.scoreCardSub}>All time</div>
        </div>

        <div style={styles.alertCard}>
          <div style={styles.alertCardLabel}>Follow-ups Due in Next 10 Days</div>
          {upcomingFollowups.length === 0 ? (
            <div style={styles.noAlerts}>No upcoming follow-ups</div>
          ) : (
            upcomingFollowups.map(c => {
              const days = daysUntil(c.followup_due_date)
              return (
                <div key={c.id} style={styles.alertRow}>
                  <span style={styles.alertCaseNum} onClick={() => onViewCase && onViewCase(c.id)}>#{c.case_number}</span>
                  {/*Preventing text overflow in the location column*/} 
                  <span style={{ ...styles.alertLocation, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{c.location || c.description?.slice(0, 40)}</span>
                  <span style={days <= 0 ? styles.alertDate : days <= 3 ? styles.alertDate : styles.alertDateSoon}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div style={styles.tableTitle}>All Cases</div>
          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.filterInput}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Cases</option>
              <option value="open">Open Cases</option>
              <option value="closed">Closed Cases</option>
            </select>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading cases...</div>
        ) : filteredCases.length === 0 ? (
          <div style={styles.empty}>No cases found.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Case #</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Location / Subject</th>
                <th style={styles.th}>Issue Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Departments</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => (
                <tr key={c.id}>
                  <td style={styles.td}>
                    <span style={styles.caseNumLink} onClick={() => onViewCase && onViewCase(c.id)}>
                      {c.case_number}
                    </span>
                    {c.is_91a && <span style={styles.tag91a}>91-A</span>}
                  </td>
                  <td style={styles.td}>{formatDate(c.date_submitted)}</td>
                  {/* Preventing text overflow in the location and issue type columns*/}
                  <td style={{ ...styles.td, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location || '—'}</td>
                  <td style={{ ...styles.td, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue_types?.name || '—'}</td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(c.statuses?.name)}>
                      {c.statuses?.name || '—'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {c.case_departments?.length > 0
  ? c.case_departments.map((cd, i) => {
      const deptStatusName = (cd.statuses?.name || '').toLowerCase()
      const isClosed = closedStatuses.includes(deptStatusName)
      return (
        <span key={i} style={isClosed ? styles.deptTagClosed : styles.deptTag}>
          {cd.departments?.name}{isClosed ? ' ✓' : ''}
        </span>
      )
    })
  : <span style={{ color: '#9ca3af', fontSize: '12px' }}>Unassigned</span>
}
                  </td>
                  <td style={styles.td}>
                    <button style={styles.viewBtn} onClick={() => onViewCase && onViewCase(c.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
