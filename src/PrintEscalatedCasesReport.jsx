import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function latestDate(...dates) {
  return dates.filter(Boolean).sort().pop() || null
}

const s = {
  page: { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#111827', maxWidth: '900px', margin: '0 auto', padding: '0' },
  noPrint: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  header: { backgroundColor: '#991b1b', color: '#ffffff', padding: '20px 28px' },
  headerTitle: { margin: '0 0 4px 0', fontSize: '19px', fontWeight: '700' },
  headerSub: { margin: 0, fontSize: '12px', opacity: 0.9 },
  body: { padding: '20px 28px' },
  summaryBar: { display: 'flex', gap: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '14px 18px', marginBottom: '20px' },
  summaryItem: { fontSize: '12px', color: '#7f1d1d' },
  summaryNum: { fontSize: '20px', fontWeight: '700', color: '#991b1b', marginRight: '6px' },
  deptSection: { marginBottom: '28px', pageBreakInside: 'avoid' },
  deptHeader: { backgroundColor: '#1a56a0', color: '#ffffff', padding: '8px 14px', fontWeight: '700', fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '11px' },
  th: { padding: '7px 10px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700', textAlign: 'left', border: '1px solid #bfdbfe', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' },
  td: { padding: '7px 10px', border: '1px solid #e5e7eb', verticalAlign: 'top' },
  reasonText: { color: '#991b1b' },
  empty: { padding: '60px', textAlign: 'center', color: '#6b7280' },
  footer: { textAlign: 'center', fontSize: '10px', color: '#9ca3af', padding: '16px 0', borderTop: '1px solid #e5e7eb', marginTop: '12px' },
}

function PrintEscalatedCasesReport({ onClose }) {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const { data: caseDepts } = await supabase
      .from('case_departments')
      .select('id, case_id, department_id, escalated_at, status_changed_at, created_at, departments(name), statuses(is_closing), cases(case_number, description, date_submitted)')
      .not('escalated_at', 'is', null)

    const escalatedRows = caseDepts?.filter(cd => !cd.statuses?.is_closing) || []

    let commentsByKey = {}
    if (escalatedRows.length > 0) {
      const caseIds = [...new Set(escalatedRows.map(cd => cd.case_id))]
      const { data: comments } = await supabase
        .from('case_comments')
        .select('case_id, department_id, created_at')
        .in('case_id', caseIds)
      for (const c of comments || []) {
        const key = `${c.case_id}:${c.department_id}`
        commentsByKey[key] = latestDate(commentsByKey[key], c.created_at)
      }
    }

    // Still actively escalated only — if the department has had real movement (a status
    // change or public comment, same "valid movement" rule used everywhere else in this
    // app) SINCE the escalation fired, it's been addressed and shouldn't keep showing up
    // here just because escalated_at is never cleared.
    const stillEscalated = escalatedRows
      .map(cd => {
        const lastComment = commentsByKey[`${cd.case_id}:${cd.department_id}`] || null
        const lastMovementAt = latestDate(cd.status_changed_at, lastComment, cd.created_at)
        return { ...cd, lastMovementAt }
      })
      .filter(cd => cd.escalated_at >= cd.lastMovementAt)

    const byDept = {}
    for (const cd of stillEscalated) {
      const deptName = cd.departments?.name || 'Unassigned'
      if (!byDept[deptName]) byDept[deptName] = []
      byDept[deptName].push(cd)
    }

    const groupList = Object.entries(byDept)
      .map(([department, rows]) => ({
        department,
        rows: rows.sort((a, b) => daysSince(b.lastMovementAt) - daysSince(a.lastMovementAt)),
      }))
      .sort((a, b) => b.rows.length - a.rows.length)

    setGroups(groupList)
    setTotalCount(stillEscalated.length)
    setLoading(false)
  }

  const reportDate = formatDateTime(new Date().toISOString())

  return (
    <div>
      <div style={s.noPrint} className="no-print">
        <button onClick={() => window.print()} style={{ padding: '8px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>

      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerTitle}>Escalated Cases Report</div>
          <div style={s.headerSub}>City of Franklin, New Hampshire &nbsp;|&nbsp; Prepared for the City Manager &nbsp;|&nbsp; {reportDate} &nbsp;|&nbsp; Confidential</div>
        </div>

        <div style={s.body}>
          {loading ? (
            <div style={s.empty}>Loading escalated cases...</div>
          ) : totalCount === 0 ? (
            <div style={s.empty}>No cases are currently escalated. Nothing needs your attention right now.</div>
          ) : (
            <>
              <div style={s.summaryBar}>
                <div style={s.summaryItem}><span style={s.summaryNum}>{totalCount}</span>case{totalCount !== 1 ? 's' : ''} currently escalated</div>
                <div style={s.summaryItem}><span style={s.summaryNum}>{groups.length}</span>department{groups.length !== 1 ? 's' : ''} affected</div>
              </div>

              {groups.map(group => (
                <div key={group.department} style={s.deptSection}>
                  <div style={s.deptHeader}>{group.department} — {group.rows.length} escalated case{group.rows.length !== 1 ? 's' : ''}</div>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Case #</th>
                        <th style={s.th}>Description</th>
                        <th style={s.th}>Date Created</th>
                        <th style={s.th}>Last Movement</th>
                        <th style={s.th}>Why the City Manager Is Seeing This</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map(cd => (
                        <tr key={cd.id}>
                          <td style={{ ...s.td, fontWeight: '700', color: '#1a56a0', whiteSpace: 'nowrap' }}>#{cd.cases?.case_number}</td>
                          <td style={{ ...s.td, maxWidth: '260px' }}>{(cd.cases?.description || '—').slice(0, 400)}</td>
                          <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDate(cd.cases?.date_submitted)}</td>
                          <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDate(cd.lastMovementAt)}</td>
                          <td style={{ ...s.td, ...s.reasonText }}>
                            No status change or public comment in {daysSince(cd.lastMovementAt)} days — escalated {formatDate(cd.escalated_at)}.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}

          <div style={s.footer}>
            City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System &nbsp;|&nbsp; Confidential — City Manager Use Only
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintEscalatedCasesReport
