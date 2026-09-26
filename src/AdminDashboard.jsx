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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
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
    marginBottom: '24px',
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

function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = new Date() - new Date(dateStr)
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function AdminDashboard({ onViewCase, refreshKey }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [deptFilter, setDeptFilter] = useState('all')
  const [issueTypeFilter, setIssueTypeFilter] = useState('all')
  const [escalatedFilter, setEscalatedFilter] = useState('all')
  const [networkFolderFilter, setNetworkFolderFilter] = useState('all')
  const [initialExportFilter, setInitialExportFilter] = useState('all')
  const [closedExportFilter, setClosedExportFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState([])
  const [departments, setDepartments] = useState([])
  const [issueTypeOptions, setIssueTypeOptions] = useState([])
  const [accountability, setAccountability] = useState([])
  const [accountabilityLoading, setAccountabilityLoading] = useState(true)

  useEffect(() => {
    loadCases()
    loadStatuses()
    loadDepartments()
    loadIssueTypeOptions()
    loadAccountability()
  }, [refreshKey])

  async function loadStatuses() {
    const { data } = await supabase.from('statuses').select('*').order('name')
    setStatuses(data || [])
  }

  async function loadDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data || [])
  }

  async function loadIssueTypeOptions() {
    const { data } = await supabase.from('issue_types').select('*').order('name')
    setIssueTypeOptions(data || [])
  }

  async function loadCases() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id, case_number, date_submitted, location, description, is_91a,
        followup_due_date, closed_date,
        archive_network_folder, archive_initial_export, archive_closed_export,
        statuses ( name, is_closing ),
        issue_types ( name ),
        case_departments ( departments ( name ), statuses ( name, is_closing ), escalated_at )
      `)
      .order('date_submitted', { ascending: false })
    if (!error) setCases(data || [])
    setLoading(false)
  }

  async function loadAccountability() {
    setAccountabilityLoading(true)
    // Track accountability per department ASSIGNMENT (case_departments row), not per case —
    // a department whose own assignment is already closed (e.g. referred out) shouldn't be
    // counted just because the case as a whole is still open under some other department.
    const { data: caseDepts } = await supabase
      .from('case_departments')
      .select('case_id, department_id, status_changed_at, departments ( name ), statuses ( name, is_closing )')

    const { data: allCases } = await supabase
      .from('cases')
      .select('id, date_submitted')

    const { data: allComments } = await supabase
      .from('case_comments')
      .select('case_id, department_id')

    if (!caseDepts || !allCases) {
      setAccountabilityLoading(false)
      return
    }

    const dateSubmittedByCaseId = {}
    allCases.forEach(c => { dateSubmittedByCaseId[c.id] = c.date_submitted })

    const hasCommentByCaseAndDept = new Set(
      (allComments || []).map(c => `${c.case_id}:${c.department_id}`)
    )

    const deptMap = {}
    caseDepts.forEach(cd => {
      // A status change is real, public-visible movement just like a comment is — only
      // count against a department if it's shown NEITHER since being assigned. Once a
      // department's own row is closed (done/referred out), it's no longer theirs to track.
      if (cd.statuses?.is_closing) return
      const deptName = cd.departments?.name
      if (!deptName) return
      if (!deptMap[deptName]) {
        deptMap[deptName] = { department: deptName, open_cases: 0, no_comment: 0, over_7_days: 0 }
      }
      deptMap[deptName].open_cases++
      const hasComment = hasCommentByCaseAndDept.has(`${cd.case_id}:${cd.department_id}`)
      const hasStatusChange = Boolean(cd.status_changed_at)
      if (!hasComment && !hasStatusChange) {
        deptMap[deptName].no_comment++
        const daysOpen = daysSince(dateSubmittedByCaseId[cd.case_id])
        if (daysOpen >= 7) deptMap[deptName].over_7_days++
      }
    })

    const sorted = Object.values(deptMap).sort((a, b) => b.over_7_days - a.over_7_days)
    setAccountability(sorted)
    setAccountabilityLoading(false)
  }

  const filteredCases = cases.filter(c => {
    const isOpen = !c.statuses?.is_closing
    if (statusFilter === 'open' && !isOpen) return false
    if (statusFilter === 'closed' && isOpen) return false
    if (deptFilter !== 'all') {
      const assignedDepts = c.case_departments?.map(cd => cd.departments?.name) || []
      if (!assignedDepts.includes(deptFilter)) return false
    }
    if (issueTypeFilter !== 'all' && c.issue_types?.name !== issueTypeFilter) return false
    if (escalatedFilter === 'escalated' && !c.case_departments?.some(cd => cd.escalated_at)) return false
    if (networkFolderFilter === 'done' && !c.archive_network_folder) return false
    if (networkFolderFilter === 'not_done' && c.archive_network_folder) return false
    if (initialExportFilter === 'done' && !c.archive_initial_export) return false
    if (initialExportFilter === 'not_done' && c.archive_initial_export) return false
    if (closedExportFilter === 'done' && !c.archive_closed_export) return false
    if (closedExportFilter === 'not_done' && c.archive_closed_export) return false
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

  const openCases = cases.filter(c => !c.statuses?.is_closing)
  const upcomingFollowups = cases.filter(c => {
    if (!c.followup_due_date) return false
    const days = daysUntil(c.followup_due_date)
    return days !== null && days >= -999 && days <= 10
  }).sort((a, b) => new Date(a.followup_due_date) - new Date(b.followup_due_date))

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Admin Dashboard</h1>

      {/* Scorecards */}
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
                  <span style={styles.alertLocation}>{c.location || c.description?.slice(0, 40)}</span>
                  <span style={days <= 0 ? styles.alertDate : days <= 3 ? styles.alertDate : styles.alertDateSoon}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Department Accountability Table */}
      <div style={{ ...styles.tableCard, marginBottom: '24px' }}>
        <div style={styles.tableHeader}>
          <div>
            <div style={styles.tableTitle}>📊 Department Accountability</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Open cases · public comment status · cases silent for 7+ days</div>
          </div>
        </div>
        {accountabilityLoading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Open Cases</th>
                <th style={styles.th}>No Status Change or Comment</th>
                <th style={styles.th}>Silent 7+ Days</th>
              </tr>
            </thead>
            <tbody>
              {accountability.map((row, i) => (
                <tr key={i}>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{row.department}</td>
                  <td style={styles.td}>{row.open_cases}</td>
                  <td style={styles.td}>
                    {row.no_comment > 0
                      ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e' }}>{row.no_comment}</span>
                      : <span style={{ color: '#065f46', fontWeight: '600' }}>✓ 0</span>
                    }
                  </td>
                  <td style={styles.td}>
                    {row.over_7_days > 0
                      ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: '#fee2e2', color: '#991b1b' }}>{row.over_7_days} ⚠</span>
                      : <span style={{ color: '#065f46', fontWeight: '600' }}>✓ 0</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cases Table */}
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
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">All Cases</option>
              <option value="open">Open Cases</option>
              <option value="closed">Closed Cases</option>
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <select value={issueTypeFilter} onChange={e => setIssueTypeFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">All Issue Types</option>
              {issueTypeOptions.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <select value={escalatedFilter} onChange={e => setEscalatedFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">All Cases</option>
              <option value="escalated">Escalated to CM</option>
            </select>
            <select value={networkFolderFilter} onChange={e => setNetworkFolderFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">Network Folder: All</option>
              <option value="done">Network Folder: Created</option>
              <option value="not_done">Network Folder: Not Created</option>
            </select>
            <select value={initialExportFilter} onChange={e => setInitialExportFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">Initial Export: All</option>
              <option value="done">Initial Export: Complete</option>
              <option value="not_done">Initial Export: Not Complete</option>
            </select>
            <select value={closedExportFilter} onChange={e => setClosedExportFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">Closed Export: All</option>
              <option value="done">Closed Export: Complete</option>
              <option value="not_done">Closed Export: Not Complete</option>
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
                    <span style={styles.caseNumLink} onClick={() => onViewCase && onViewCase(c.id)}>{c.case_number}</span>
                    {c.is_91a && <span style={styles.tag91a}>91-A</span>}
                  </td>
                  <td style={styles.td}>{formatDate(c.date_submitted)}</td>
                  <td style={{ ...styles.td, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location || '—'}</td>
                  <td style={{ ...styles.td, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue_types?.name || '—'}</td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(c.statuses?.name)}>{c.statuses?.name || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    {c.case_departments?.length > 0
                      ? c.case_departments.map((cd, i) => {
                          const isClosed = Boolean(cd.statuses?.is_closing)
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
                    <button style={styles.viewBtn} onClick={() => onViewCase && onViewCase(c.id)}>View</button>
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
