import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatMoney(n) {
  if (!n) return '—'
  return `$${parseFloat(n).toFixed(2)}`
}

function formatHours(n) {
  if (!n) return '—'
  return `${parseFloat(n).toFixed(1)} hrs`
}

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'

function PrintCaseDetail({ caseId, onClose }) {
  const [caseData, setCaseData] = useState(null)
  const [rtkData, setRtkData] = useState(null)
  const [departments, setDepartments] = useState([])
  const [notes, setNotes] = useState([])
  const [comments, setComments] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [files, setFiles] = useState([])
  const [timeLog, setTimeLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [caseId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([
      loadCase(),
      loadNotes(),
      loadComments(),
      loadAuditLog(),
      loadFiles(),
    ])
    setLoading(false)
  }

  async function loadCase() {
    const { data } = await supabase
      .from('cases')
      .select(`
        *,
        statuses ( name ),
        issue_types ( name ),
        case_departments (
          id,
          department_id,
          departments ( name ),
          statuses ( name )
        )
      `)
      .eq('id', caseId)
      .single()
    if (data) {
      setCaseData(data)
      if (data.is_91a) {
        const { data: rtk } = await supabase.from('details_91a').select('*').eq('case_id', caseId).single()
        setRtkData(rtk || null)
        const { data: tl } = await supabase.from('case_time_log').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
        setTimeLog(tl || [])
      }
    }
  }

  async function loadNotes() {
    const { data } = await supabase.from('internal_notes').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
    setNotes(data || [])
  }

  async function loadComments() {
    const { data } = await supabase.from('case_comments').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function loadAuditLog() {
    const { data } = await supabase.from('case_audit_log').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
    setAuditLog(data || [])
  }

  async function loadFiles() {
    const { data } = await supabase.from('case_files').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
    setFiles(data || [])
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>
        Loading case for export...
      </div>
    )
  }

  if (!caseData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>
        Case not found.
      </div>
    )
  }

  const totalTimeMinutes = timeLog.reduce((sum, e) => sum + e.minutes, 0)
  const totalTimeCost = timeLog.reduce((sum, e) => sum + parseFloat(e.cost || 0), 0)

  const s = {
    page: { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#111827', maxWidth: '800px', margin: '0 auto', padding: '0' },
    header: { backgroundColor: '#1a56a0', color: '#ffffff', padding: '20px 28px', marginBottom: '0' },
    headerTitle: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' },
    headerSub: { margin: 0, fontSize: '12px', opacity: 0.85 },
    body: { padding: '20px 28px' },
    sectionTitle: { fontSize: '13px', fontWeight: '700', color: '#1a56a0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e5e7eb', paddingBottom: '4px', marginTop: '20px', marginBottom: '10px' },
    field: { marginBottom: '8px', display: 'flex', gap: '8px' },
    fieldLabel: { fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '140px', flexShrink: 0 },
    fieldValue: { fontSize: '12px', color: '#111827', flex: 1 },
    twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
    badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
    noteBox: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '10px 12px', marginBottom: '8px' },
    commentBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '10px 12px', marginBottom: '8px' },
    meta: { fontSize: '10px', color: '#9ca3af', marginBottom: '4px' },
    text: { fontSize: '12px', color: '#374151', lineHeight: '1.5' },
    auditRow: { display: 'flex', gap: '10px', padding: '6px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' },
    auditDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a56a0', marginTop: '4px', flexShrink: 0 },
    deptRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '12px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '11px' },
    th: { padding: '6px 8px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700', textAlign: 'left', border: '1px solid #bfdbfe', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' },
    td: { padding: '6px 8px', border: '1px solid #e5e7eb', verticalAlign: 'top' },
    divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' },
    footer: { textAlign: 'center', fontSize: '10px', color: '#9ca3af', padding: '16px 0', borderTop: '1px solid #e5e7eb', marginTop: '24px' },
    noPrint: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  }

  function getStatusBadge(name) {
    const n = (name || '').toLowerCase()
    let bg = '#f3f4f6', color = '#374151'
    if (n === 'resolved' || n === 'closed') { bg = '#d1fae5'; color = '#065f46' }
    else if (['in progress','assigned','scheduled','gathering records','reviewing records'].includes(n)) { bg = '#dbeafe'; color = '#1e40af' }
    else if (['lacks resources to resolve','unfounded','request abandoned'].includes(n)) { bg = '#fee2e2'; color = '#991b1b' }
    else if (['clarification needed','records ready - please schedule pick up'].includes(n)) { bg = '#fef3c7'; color = '#92400e' }
    return <span style={{ ...s.badge, backgroundColor: bg, color }}>{name || '—'}</span>
  }

  return (
    <div>
      {/* Print/Close buttons — hidden on print */}
      <div style={s.noPrint} className="no-print">
        <button onClick={() => window.print()} style={{ padding: '8px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back to Case
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>

      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTitle}>City of Franklin, NH — Case Export</div>
          <div style={s.headerSub}>
            Case #{caseData.case_number} &nbsp;|&nbsp; {formatDateTime(new Date().toISOString())} &nbsp;|&nbsp; Confidential — Internal Use Only
          </div>
        </div>

        <div style={s.body}>

          {/* Case Details */}
          <div style={s.sectionTitle}>Case Details</div>
          <div style={s.twoCol}>
            <div>
              <div style={s.field}><span style={s.fieldLabel}>Case Number</span><span style={{ ...s.fieldValue, fontWeight: '700', color: '#1a56a0', fontSize: '16px' }}>#{caseData.case_number}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Status</span><span style={s.fieldValue}>{getStatusBadge(caseData.statuses?.name)}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Issue Type</span><span style={s.fieldValue}>{caseData.issue_types?.name || '—'}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>91-A Request</span><span style={s.fieldValue}>{caseData.is_91a ? 'Yes' : 'No'}</span></div>
            </div>
            <div>
              <div style={s.field}><span style={s.fieldLabel}>Date Submitted</span><span style={s.fieldValue}>{formatDate(caseData.date_submitted)}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Date Closed</span><span style={s.fieldValue}>{formatDate(caseData.closed_date)}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Follow-up Date</span><span style={s.fieldValue}>{formatDate(caseData.followup_due_date)}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Policy Acknowledged</span><span style={s.fieldValue}>{caseData.policy_acknowledged ? 'Yes' : 'No (pre-policy)'}</span></div>
            </div>
          </div>
          <div style={s.field}><span style={s.fieldLabel}>Location / Subject</span><span style={s.fieldValue}>{caseData.location || '—'}</span></div>
          <div style={s.field}><span style={s.fieldLabel}>Description</span><span style={s.fieldValue}>{caseData.description || '—'}</span></div>

          {/* Archive Checklist */}
          <div style={s.sectionTitle}>Archive Checklist</div>
          <div style={s.twoCol}>
            <div style={s.field}><span style={s.fieldLabel}>Network Folder Created</span><span style={s.fieldValue}>{caseData.archive_network_folder ? '✓ Yes' : '☐ No'}</span></div>
            <div style={s.field}><span style={s.fieldLabel}>Initial Export Complete</span><span style={s.fieldValue}>{caseData.archive_initial_export ? '✓ Yes' : '☐ No'}</span></div>
            <div style={s.field}><span style={s.fieldLabel}>Closed Export Complete</span><span style={s.fieldValue}>{caseData.archive_closed_export ? '✓ Yes' : '☐ No'}</span></div>
          </div>

          {/* Submitter Information */}
          <div style={s.sectionTitle}>Submitter Information</div>
          <div style={s.twoCol}>
            <div>
              <div style={s.field}><span style={s.fieldLabel}>Name</span><span style={s.fieldValue}>{caseData.submitter_name || 'Anonymous'}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Email</span><span style={s.fieldValue}>{caseData.submitter_email || '—'}</span></div>
            </div>
            <div>
              <div style={s.field}><span style={s.fieldLabel}>Phone</span><span style={s.fieldValue}>{caseData.submitter_phone || '—'}</span></div>
              <div style={s.field}><span style={s.fieldLabel}>Requestor ID</span><span style={s.fieldValue}>{caseData.requestor_id || '—'}</span></div>
            </div>
          </div>

          {/* Assigned Departments */}
          <div style={s.sectionTitle}>Assigned Departments</div>
          {caseData.case_departments?.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No departments assigned.</div>
          ) : (
            caseData.case_departments?.map((cd, i) => (
              <div key={i} style={s.deptRow}>
                <span style={{ fontWeight: '600' }}>{cd.departments?.name}</span>
                <span style={{ color: '#6b7280' }}>{cd.statuses?.name || '—'}</span>
              </div>
            ))
          )}

          {/* 91-A Details */}
          {caseData.is_91a && rtkData && (
            <>
              <div style={s.sectionTitle}>Right-to-Know (RSA 91-A) Details</div>
              <div style={s.twoCol}>
                <div>
                  <div style={s.field}><span style={s.fieldLabel}>Acknowledged Date</span><span style={s.fieldValue}>{formatDate(rtkData.acknowledged_date)}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Request Topic</span><span style={s.fieldValue}>{rtkData.request_topic || '—'}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Number of Records</span><span style={s.fieldValue}>{rtkData.number_of_records ?? '—'}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Hours Worked</span><span style={s.fieldValue}>{formatHours(rtkData.hours_worked)}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Hours (Final)</span><span style={s.fieldValue}>{formatHours(rtkData.hours_worked_closed)}</span></div>
                </div>
                <div>
                  <div style={s.field}><span style={s.fieldLabel}>Fees Assessed</span><span style={s.fieldValue}>{formatMoney(rtkData.fees_assessed)}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Fees Collected</span><span style={s.fieldValue}>{formatMoney(rtkData.fees_collected)}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Tax Dollars Spent</span><span style={s.fieldValue}>{formatMoney(rtkData.tax_dollar_spent)}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Delivery Method</span><span style={s.fieldValue}>{rtkData.delivery_method || '—'}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Date Records Ready</span><span style={s.fieldValue}>{formatDate(rtkData.date_records_ready)}</span></div>
                  <div style={s.field}><span style={s.fieldLabel}>Requestor Notified</span><span style={s.fieldValue}>{formatDate(rtkData.date_requestor_notified)}</span></div>
                  {rtkData.appointment_datetime && <div style={s.field}><span style={s.fieldLabel}>Appointment</span><span style={s.fieldValue}>{formatDateTime(rtkData.appointment_datetime)}</span></div>}
                  {rtkData.tracking_number && <div style={s.field}><span style={s.fieldLabel}>Tracking #</span><span style={s.fieldValue}>{rtkData.tracking_number}</span></div>}
                </div>
              </div>

              {/* Time Log */}
              {timeLog.length > 0 && (
                <>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginTop: '12px', marginBottom: '6px' }}>Time Log</div>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Date</th>
                        <th style={s.th}>Staff</th>
                        <th style={s.th}>Minutes</th>
                        <th style={s.th}>Rate</th>
                        <th style={s.th}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeLog.map(entry => (
                        <tr key={entry.id}>
                          <td style={s.td}>{formatDateTime(entry.created_at)}</td>
                          <td style={s.td}>{entry.initials}</td>
                          <td style={s.td}>{entry.minutes}m</td>
                          <td style={s.td}>${parseFloat(entry.hourly_rate).toFixed(2)}/hr</td>
                          <td style={s.td}>${parseFloat(entry.cost).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#eff6ff' }}>
                        <td colSpan={2} style={{ ...s.td, fontWeight: '700' }}>Total</td>
                        <td style={{ ...s.td, fontWeight: '700' }}>{totalTimeMinutes}m ({(totalTimeMinutes / 60).toFixed(1)}h)</td>
                        <td style={s.td}></td>
                        <td style={{ ...s.td, fontWeight: '700' }}>${totalTimeCost.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          <hr style={s.divider} />

          {/* Public Comments */}
          <div style={s.sectionTitle}>Public Updates (Visible to Residents)</div>
          {comments.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No public updates posted.</div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={s.commentBox}>
                <div style={s.meta}>{c.created_by} · {formatDateTime(c.created_at)}</div>
                <div style={s.text}>{c.comment}</div>
              </div>
            ))
          )}

          {/* Internal Notes */}
          <div style={s.sectionTitle}>Internal Notes (Staff Only)</div>
          {notes.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No internal notes.</div>
          ) : (
            notes.map(n => (
              <div key={n.id} style={s.noteBox}>
                <div style={s.meta}>{n.created_by} · {formatDateTime(n.created_at)}</div>
                <div style={s.text}>{n.note}</div>
              </div>
            ))
          )}

          {/* File Attachments */}
          <div style={s.sectionTitle}>File Attachments</div>
          {files.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No files attached.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>File Name</th>
                  <th style={s.th}>Size</th>
                  <th style={s.th}>Uploaded By</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>URL</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id}>
                    <td style={s.td}>{f.file_name}</td>
                    <td style={s.td}>{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                    <td style={s.td}>{f.uploaded_by}</td>
                    <td style={s.td}>{formatDateTime(f.created_at)}</td>
                    <td style={{ ...s.td, fontSize: '9px', color: '#6b7280', wordBreak: 'break-all' }}>
                      {`${SUPABASE_URL}/storage/v1/object/public/case-files/${f.file_path}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Full Activity Log */}
          <div style={s.sectionTitle}>Complete Activity Log</div>
          {auditLog.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No activity recorded.</div>
          ) : (
            auditLog.map(entry => (
              <div key={entry.id} style={s.auditRow}>
                <div style={s.auditDot} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#374151' }}>{entry.action}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{entry.performed_by} · {formatDateTime(entry.created_at)}</div>
                </div>
              </div>
            ))
          )}

          <div style={s.footer}>
            City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System &nbsp;|&nbsp; Confidential — Internal Use Only
            <br />Case #{caseData.case_number} &nbsp;|&nbsp; Exported {formatDateTime(new Date().toISOString())}
          </div>

        </div>
      </div>
    </div>
  )
}

export default PrintCaseDetail
