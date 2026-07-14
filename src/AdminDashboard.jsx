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
  exportBtn: {
    padding: '7px 16px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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

const closedStatuses = ['resolved', 'closed', 'unfounded', 'referred to another department', 'lacks resources to resolve', 'request abandoned']

function AdminDashboard({ onViewCase, refreshKey }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState([])
  const [departments, setDepartments] = useState([])
  const [accountability, setAccountability] = useState([])
  const [accountabilityLoading, setAccountabilityLoading] = useState(true)
  const [exportingReport, setExportingReport] = useState(false)

  useEffect(() => {
    loadCases()
    loadStatuses()
    loadDepartments()
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

  async function loadCases() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id, case_number, date_submitted, location, description, is_91a,
        followup_due_date, closed_date,
        statuses ( name ),
        issue_types ( name ),
        case_departments ( departments ( name ), statuses ( name ) )
      `)
      .order('date_submitted', { ascending: false })
    if (!error) setCases(data || [])
    setLoading(false)
  }

  async function loadAccountability() {
    setAccountabilityLoading(true)
    // Get all open cases with their departments and comments
    const { data: caseDepts } = await supabase
      .from('case_departments')
      .select('case_id, department_id, departments ( name ), statuses ( name )')

    const { data: openCases } = await supabase
      .from('cases')
      .select('id, date_submitted, status_id, statuses ( name )')

    const { data: allComments } = await supabase
      .from('case_comments')
      .select('case_id, created_at')

    if (!caseDepts || !openCases) {
      setAccountabilityLoading(false)
      return
    }

    const openCaseIds = new Set(
      openCases
        .filter(c => !closedStatuses.includes((c.statuses?.name || '').toLowerCase()))
        .map(c => c.id)
    )

    const commentsByCaseId = {}
    allComments?.forEach(c => {
      if (!commentsByCaseId[c.case_id]) commentsByCaseId[c.case_id] = []
      commentsByCaseId[c.case_id].push(c.created_at)
    })

    const deptMap = {}
    caseDepts.forEach(cd => {
      if (!openCaseIds.has(cd.case_id)) return
      const deptName = cd.departments?.name
      if (!deptName) return
      if (!deptMap[deptName]) {
        deptMap[deptName] = { department: deptName, open_cases: 0, no_comment: 0, over_7_days: 0 }
      }
      deptMap[deptName].open_cases++
      const caseComments = commentsByCaseId[cd.case_id] || []
      const hasComment = caseComments.length > 0
      const caseData = openCases.find(c => c.id === cd.case_id)
      const daysOpen = daysSince(caseData?.date_submitted)
      if (!hasComment) {
        deptMap[deptName].no_comment++
        if (daysOpen >= 7) deptMap[deptName].over_7_days++
      }
    })

    const sorted = Object.values(deptMap).sort((a, b) => b.over_7_days - a.over_7_days)
    setAccountability(sorted)
    setAccountabilityLoading(false)
  }

  async function handleExportReport() {
    setExportingReport(true)

    // Get full data for report
    const { data: allCaseDepts } = await supabase
      .from('case_departments')
      .select('case_id, department_id, departments ( name )')

    const { data: allCases } = await supabase
      .from('cases')
      .select('id, case_number, date_submitted, closed_date, location, description, statuses ( name ), issue_types ( name )')

    const { data: allComments } = await supabase
      .from('case_comments')
      .select('case_id, created_at')
      .order('created_at', { ascending: false })

    const commentsByCaseId = {}
    allComments?.forEach(c => {
      if (!commentsByCaseId[c.case_id]) commentsByCaseId[c.case_id] = []
      commentsByCaseId[c.case_id].push(c.created_at)
    })

    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(`${currentYear}-01-01`)

    // Build dept summary
    const deptSummary = {}
    departments.forEach(d => {
      deptSummary[d.name] = { ytd: 0, open: 0, closedDays: [], avgDaysToClose: '—' }
    })

    allCaseDepts?.forEach(cd => {
      const deptName = cd.departments?.name
      if (!deptName || !deptSummary[deptName]) return
      const c = allCases?.find(x => x.id === cd.case_id)
      if (!c) return
      if (new Date(c.date_submitted) >= startOfYear) deptSummary[deptName].ytd++
      const isOpen = !closedStatuses.includes((c.statuses?.name || '').toLowerCase())
      if (isOpen) deptSummary[deptName].open++
      if (!isOpen && c.date_submitted && c.closed_date) {
        const days = Math.round((new Date(c.closed_date) - new Date(c.date_submitted)) / (1000 * 60 * 60 * 24))
        deptSummary[deptName].closedDays.push(days)
      }
    })

    Object.keys(deptSummary).forEach(dept => {
      const days = deptSummary[dept].closedDays
      if (days.length > 0) {
        deptSummary[dept].avgDaysToClose = Math.round(days.reduce((a, b) => a + b, 0) / days.length) + ' days'
      }
    })

    // Build open case detail rows
    const openCaseRows = []
    allCaseDepts?.forEach(cd => {
      const deptName = cd.departments?.name
      const c = allCases?.find(x => x.id === cd.case_id)
      if (!c) return
      const isOpen = !closedStatuses.includes((c.statuses?.name || '').toLowerCase())
      if (!isOpen) return
      const comments = commentsByCaseId[c.id] || []
      const lastComment = comments.length > 0 ? new Date(comments[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
      const daysOpen = daysSince(c.date_submitted)
      openCaseRows.push({
        case_number: c.case_number,
        date_submitted: formatDate(c.date_submitted),
        days_open: daysOpen,
        department: deptName,
        issue_type: c.issue_types?.name || '—',
        location: c.location || '—',
        description: (c.description || '').slice(0, 500),
        last_comment: lastComment,
        no_comment: !lastComment,
      })
    })

    openCaseRows.sort((a, b) => b.days_open - a.days_open)

    // Generate printable HTML report
    const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Department Accountability Report — ${reportDate}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111827; margin: 0; padding: 0; }
  @media print {
    .no-print { display: none; }
    body { margin: 0; }
    .page-break { page-break-before: always; }
  }
  .header { background-color: #1a56a0; color: white; padding: 24px 32px; }
  .header h1 { margin: 0 0 4px 0; font-size: 20px; }
  .header p { margin: 0; font-size: 13px; opacity: 0.85; }
  .body { padding: 24px 32px; }
  .section-title { font-size: 14px; font-weight: 700; color: #1a56a0; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
  th { background-color: #dbeafe; color: #1e40af; padding: 8px 10px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border: 1px solid #bfdbfe; }
  td { padding: 7px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) { background-color: #f9fafb; }
  .red { color: #dc2626; font-weight: 700; }
  .orange { color: #d97706; font-weight: 600; }
  .green { color: #065f46; }
  .badge-red { background-color: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 10px; }
  .badge-orange { background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 10px; }
  .badge-green { background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
  .dept-section { margin-bottom: 32px; }
  .dept-header { background-color: #1a56a0; color: white; padding: 8px 12px; font-weight: 700; font-size: 13px; margin-bottom: 0; }
  .print-btn { background-color: #1a56a0; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; margin: 16px 32px; display: block; }
  .footer { text-align: center; font-size: 10px; color: #9ca3af; padding: 16px; border-top: 1px solid #e5e7eb; margin-top: 24px; }
</style>
</head>
<body>
<button class="no-print print-btn" onclick="window.print()">🖨️ Print Report</button>
<div class="header">
  <h1>Department Accountability Report</h1>
  <p>City of Franklin, New Hampshire &nbsp;|&nbsp; Generated: ${reportDate} &nbsp;|&nbsp; Confidential — City Manager Use</p>
</div>
<div class="body">

<div class="section-title">Department Summary — Year to Date ${currentYear}</div>
<table>
  <thead>
    <tr>
      <th>Department</th>
      <th>Total Cases YTD</th>
      <th>Currently Open</th>
      <th>Avg Days to Close</th>
      <th>Open w/ No Public Comment</th>
      <th>Open 7+ Days, No Comment</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(deptSummary).map(([dept, data]) => {
      const acct = accountability.find(a => a.department === dept) || { no_comment: 0, over_7_days: 0 }
      return `<tr>
        <td><strong>${dept}</strong></td>
        <td>${data.ytd}</td>
        <td>${data.open}</td>
        <td>${data.avgDaysToClose}</td>
        <td>${acct.no_comment > 0 ? `<span class="badge-orange">${acct.no_comment}</span>` : '<span class="badge-green">0</span>'}</td>
        <td>${acct.over_7_days > 0 ? `<span class="badge-red">${acct.over_7_days}</span>` : '<span class="badge-green">0</span>'}</td>
      </tr>`
    }).join('')}
  </tbody>
</table>

<div class="section-title page-break">Open Case Detail by Department</div>
${Object.keys(deptSummary).map(dept => {
  const deptCases = openCaseRows.filter(r => r.department === dept)
  if (deptCases.length === 0) return ''
  return `
  <div class="dept-section">
    <div class="dept-header">${dept} — ${deptCases.length} Open Case${deptCases.length !== 1 ? 's' : ''}</div>
    <table>
      <thead>
        <tr>
          <th>Case #</th>
          <th>Submitted</th>
          <th>Days Open</th>
          <th>Issue Type</th>
          <th>Location</th>
          <th>Description</th>
          <th>Last Public Comment</th>
        </tr>
      </thead>
      <tbody>
        ${deptCases.map(c => `<tr>
          <td><strong>${c.case_number}</strong></td>
          <td>${c.date_submitted}</td>
          <td>${c.days_open >= 30 ? `<span class="badge-red">${c.days_open}d</span>` : c.days_open >= 7 ? `<span class="badge-orange">${c.days_open}d</span>` : `${c.days_open}d`}</td>
          <td>${c.issue_type}</td>
          <td>${(c.location || '—').slice(0, 100)}${c.location?.length > 100 ? '...' : ''}</td>
          <td style="max-width:200px">${c.description}</td>
          <td>${c.no_comment ? '<span class="badge-red">No comment</span>' : `<span class="badge-green">${c.last_comment}</span>`}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`
}).join('')}

</div>
<div class="footer">City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System &nbsp;|&nbsp; Confidential — Internal Use Only</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) win.focus()
    setExportingReport(false)
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

  const openCases = cases.filter(c => !closedStatuses.includes((c.statuses?.name || '').toLowerCase()))
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
          <button
            style={styles.exportBtn}
            onClick={handleExportReport}
            disabled={exportingReport}
          >
            {exportingReport ? 'Generating...' : '📄 Export Report for City Manager'}
          </button>
        </div>
        {accountabilityLoading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Open Cases</th>
                <th style={styles.th}>No Public Comment</th>
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
