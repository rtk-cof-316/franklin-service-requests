import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { loadDepartmentPerformance } from './departmentPerformance'

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
    margin: '0 0 4px 0',
  },
  pageSub: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  urgentBanner: {
    backgroundColor: '#fee2e2',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  urgentIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  urgentText: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#991b1b',
    lineHeight: '1.4',
  },
  urgentSub: {
    fontSize: '13px',
    color: '#b91c1c',
    marginTop: '2px',
    fontWeight: '400',
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
  bulkBar: {
    padding: '10px 24px',
    backgroundColor: '#eff6ff',
    borderBottom: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: '#1e40af',
  },
  bulkPrintBtn: {
    padding: '6px 14px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '6px 10px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
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
  perfSection: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '20px 24px',
    marginBottom: '24px',
  },
  perfTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '4px',
  },
  perfSub: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '18px',
  },
  perfGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  perfCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  perfCardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  perfCardValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a56a0',
  },
  perfCardSub: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  perfCompareRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#374151',
    marginTop: '8px',
  },
  perfBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  perfBarLabel: {
    fontSize: '12px',
    color: '#374151',
    width: '150px',
    flexShrink: 0,
  },
  perfBarTrack: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    height: '10px',
    overflow: 'hidden',
  },
  perfBarFill: {
    backgroundColor: '#1a56a0',
    height: '100%',
  },
  perfBarCount: {
    fontSize: '12px',
    color: '#6b7280',
    width: '30px',
    textAlign: 'right',
    flexShrink: 0,
  },
  resourceNote: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    padding: '14px 16px',
    fontSize: '13px',
    color: '#92400e',
    marginTop: '4px',
  },
  perfNoData: {
    fontSize: '13px',
    color: '#9ca3af',
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
  if (!dateStr) return 0
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
}

function DepartmentDashboard({ departmentId, onViewCase, refreshKey, onBulkPrint, isAdminView = false }) {
  const [cases, setCases] = useState([])
  const [departmentName, setDepartmentName] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [urgentCount, setUrgentCount] = useState(0)
  const [urgentCaseIds, setUrgentCaseIds] = useState(new Set())
  const [perf, setPerf] = useState(null)

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    loadDepartmentName()
    loadCases()
    loadDepartmentPerformance(departmentId).then(setPerf)
  }, [departmentId, refreshKey])

  useEffect(() => {
    setSelectedIds([])
  }, [statusFilter, search])

  async function loadDepartmentName() {
    const { data } = await supabase.from('departments').select('name').eq('id', departmentId).single()
    if (data) setDepartmentName(data.name)
  }

  async function loadCases() {
    setLoading(true)

    const { data: caseDepts } = await supabase
      .from('case_departments')
      .select('case_id, statuses ( name, is_closing )')
      .eq('department_id', departmentId)

    if (!caseDepts || caseDepts.length === 0) {
      setCases([])
      setLoading(false)
      return
    }

    const caseIds = caseDepts.map(cd => cd.case_id)
    const deptStatusMap = {}
    const deptStatusClosingMap = {}
    caseDepts.forEach(cd => {
      deptStatusMap[cd.case_id] = cd.statuses?.name || null
      deptStatusClosingMap[cd.case_id] = Boolean(cd.statuses?.is_closing)
    })

    const { data, error } = await supabase
      .from('cases')
      .select(`id, case_number, date_submitted, location, description, is_91a, followup_due_date, closed_date, issue_types ( name )`)
      .in('id', caseIds)
      .order('date_submitted', { ascending: false })

    if (!error) {
      const enriched = (data || []).map(c => ({
        ...c,
        dept_status: deptStatusMap[c.id] || null,
        dept_status_is_closing: deptStatusClosingMap[c.id] || false,
      }))
      setCases(enriched)

      // Calculate urgent cases — open with no public comment for 7+ days
      const openCaseIds = enriched
        .filter(c => !c.dept_status_is_closing)
        .map(c => c.id)

      if (openCaseIds.length > 0) {
        const { data: comments } = await supabase
          .from('case_comments')
          .select('case_id')
          .in('case_id', openCaseIds)

        const casesWithComments = new Set(comments?.map(c => c.case_id) || [])
        const urgentCases = enriched.filter(c => {
          const isOpen = !c.dept_status_is_closing
          const hasNoComment = !casesWithComments.has(c.id)
          const daysOpen = daysSince(c.date_submitted)
          return isOpen && hasNoComment && daysOpen >= 7
        })
        setUrgentCount(urgentCases.length)
        setUrgentCaseIds(new Set(urgentCases.map(c => c.id)))
      } else {
        setUrgentCount(0)
        setUrgentCaseIds(new Set())
      }
    }
    setLoading(false)
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' })
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    }
    setSavingPassword(false)
  }

  const filteredCases = cases.filter(c => {
    const isOpen = !c.dept_status_is_closing
    if (statusFilter === 'open' && !isOpen) return false
    if (statusFilter === 'closed' && isOpen) return false
    if (statusFilter === 'urgent' && !urgentCaseIds.has(c.id)) return false
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

  const openCases = cases.filter(c => !c.dept_status_is_closing)

  const upcomingFollowups = cases.filter(c => {
    if (!c.followup_due_date) return false
    const days = daysUntil(c.followup_due_date)
    const isOpen = !c.dept_status_is_closing
    return isOpen && days !== null && days >= -999 && days <= 10
  }).sort((a, b) => new Date(a.followup_due_date) - new Date(b.followup_due_date))

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredCases.length) setSelectedIds([])
    else setSelectedIds(filteredCases.map(c => c.id))
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>{departmentName} Dashboard</h1>
      <p style={styles.pageSub}>Showing cases assigned to your department only</p>

      {/* Urgent alert banner */}
      {urgentCount > 0 && (
        <div style={styles.urgentBanner}>
          <div style={styles.urgentIcon}>🚨</div>
          <div>
            <div style={styles.urgentText}>
              {urgentCount} open case{urgentCount !== 1 ? 's have' : ' has'} not received a public update in over 7 days.
            </div>
            <div style={styles.urgentSub}>
              Please open these cases and post a public update so residents can see that work is in progress. Use the "Needs Public Update" filter to find them quickly.
            </div>
          </div>
        </div>
      )}

      <div style={styles.cardsRow}>
        <div style={styles.scoreCard}>
          <div style={styles.scoreCardLabel}>Open Cases</div>
          <div style={styles.scoreCardValue}>{openCases.length}</div>
          <div style={styles.scoreCardSub}>Your department's active cases</div>
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

      {perf && perf.hasData && (
        <div style={styles.perfSection}>
          <div style={styles.perfTitle}>Department Performance</div>
          <div style={styles.perfSub}>Year-to-date, compared against the citywide average — not against other departments.</div>

          <div style={styles.perfGrid}>
            <div style={styles.perfCard}>
              <div style={styles.perfCardLabel}>Volume</div>
              <div style={styles.perfCardValue}>{perf.deptVolume} case{perf.deptVolume !== 1 ? 's' : ''}</div>
              {perf.volumeSharePct !== null && (
                <div style={styles.perfCardSub}>{perf.volumeSharePct}% of all {perf.citywideCaseCount} cases received by the City this year</div>
              )}
            </div>

            <div style={styles.perfCard}>
              <div style={styles.perfCardLabel}>Resolution Time</div>
              {perf.deptMedian !== null ? (
                <>
                  <div style={styles.perfCardValue}>{perf.deptMedian} day{perf.deptMedian !== 1 ? 's' : ''} <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280' }}>typical</span></div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Fastest: {perf.deptFastest}d · Longest: {perf.deptLongest}d</div>
                  {perf.citywideMedian !== null && (
                    <div style={styles.perfCompareRow}>
                      <span>Your median: {perf.deptMedian}d</span>
                      <span>Citywide median: {perf.citywideMedian}d</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.perfNoData}>Not enough closed cases yet</div>
              )}
            </div>

            <div style={styles.perfCard}>
              <div style={styles.perfCardLabel}>Public Comment Rate</div>
              {perf.deptCommentRatePct !== null ? (
                <>
                  <div style={styles.perfCardValue}>{perf.deptCommentRatePct}%</div>
                  {perf.citywideCommentRatePct !== null && (
                    <div style={styles.perfCompareRow}>
                      <span>Yours: {perf.deptCommentRatePct}%</span>
                      <span>Citywide: {perf.citywideCommentRatePct}%</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.perfNoData}>Not enough data yet</div>
              )}
            </div>
          </div>

          <div style={{ ...styles.perfCardLabel, marginBottom: '10px' }}>Status Breakdown (This Year)</div>
          {Object.entries(perf.statusBreakdown).map(([name, count]) => (
            <div key={name} style={styles.perfBarRow}>
              <div style={styles.perfBarLabel}>{name}</div>
              <div style={styles.perfBarTrack}>
                <div style={{ ...styles.perfBarFill, width: `${(count / perf.deptVolume) * 100}%` }} />
              </div>
              <div style={styles.perfBarCount}>{count}</div>
            </div>
          ))}

          {perf.showResourceNeedNote && (
            <div style={styles.resourceNote}>
              Your department is handling a higher-than-average caseload with longer-than-average resolution times. This may reflect a need for additional resources.
            </div>
          )}
        </div>
      )}

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <div style={styles.tableTitle}>My Cases</div>
            {statusFilter === 'urgent' && urgentCaseIds.size > 0 && (
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>
                Showing {urgentCaseIds.size} case{urgentCaseIds.size !== 1 ? 's' : ''} needing a public update
              </div>
            )}
          </div>
          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.filterInput}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={styles.filterSelect}>
              <option value="open">Open Cases</option>
              <option value="urgent">⚠️ Needs Public Update ({urgentCount})</option>
              <option value="closed">Closed Cases</option>
              <option value="all">All Cases</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div style={styles.bulkBar}>
            <span>{selectedIds.length} case{selectedIds.length !== 1 ? 's' : ''} selected</span>
            <button style={styles.bulkPrintBtn} onClick={() => onBulkPrint && onBulkPrint(selectedIds)}>Print Work Orders</button>
            <button style={styles.clearBtn} onClick={() => setSelectedIds([])}>Clear</button>
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>Loading cases...</div>
        ) : filteredCases.length === 0 ? (
          <div style={styles.empty}>
            {statusFilter === 'urgent' ? 'No cases need a public update right now. Great work!' : 'No cases found.'}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredCases.length && filteredCases.length > 0}
                    onChange={toggleSelectAll}
                    style={{ accentColor: '#1a56a0', cursor: 'pointer' }}
                  />
                </th>
                <th style={styles.th}>Case #</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Location / Subject</th>
                <th style={styles.th}>Issue Type</th>
                <th style={styles.th}>My Status</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => (
                <tr key={c.id} style={{ backgroundColor: selectedIds.includes(c.id) ? '#f0f7ff' : urgentCaseIds.has(c.id) ? '#fff7f7' : 'transparent' }}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      style={{ accentColor: '#1a56a0', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={styles.td}>
                    <span style={styles.caseNumLink} onClick={() => onViewCase && onViewCase(c.id)}>
                      {c.case_number}
                    </span>
                    {c.is_91a && <span style={styles.tag91a}>91-A</span>}
                    {urgentCaseIds.has(c.id) && (
                      <span title="No public update in 7+ days — please post an update" style={{ marginLeft: '6px', fontSize: '13px' }}>💬⚠️</span>
                    )}
                  </td>
                  <td style={styles.td}>{formatDate(c.date_submitted)}</td>
                  <td style={styles.td}>{c.location || '—'}</td>
                  <td style={styles.td}>{c.issue_types?.name || '—'}</td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(c.dept_status)}>
                      {c.dept_status || '—'}
                    </span>
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

      {/* Password change */}
      {!isAdminView && (
        <>
          <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Need to update your login credentials?</span>
            <button
              onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordMsg(null) }}
              style={{ padding: '6px 14px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151', fontSize: '13px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer' }}
            >
              Change My Password
            </button>
          </div>

          {showPasswordForm && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginTop: '8px', maxWidth: '400px', marginLeft: 'auto' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Change Password</div>
              {passwordMsg && (
                <div style={{ fontSize: '13px', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', backgroundColor: passwordMsg.type === 'error' ? '#fee2e2' : '#d1fae5', color: passwordMsg.type === 'error' ? '#991b1b' : '#065f46' }}>
                  {passwordMsg.text}
                </div>
              )}
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' }}
              />
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                style={{ padding: '8px 20px', backgroundColor: savingPassword ? '#93afd4' : '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: savingPassword ? 'not-allowed' : 'pointer' }}
              >
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  )
}

export default DepartmentDashboard
