import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function PrintCaseDetail({ caseId, onClose }) {
  const [caseData, setCaseData] = useState(null)
  const [rtkData, setRtkData] = useState(null)
  const [notes, setNotes] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [caseId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCase(), loadNotes(), loadAuditLog()])
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
          departments ( name ),
          statuses ( name )
        )
      `)
      .eq('id', caseId)
      .single()
    if (data) {
      setCaseData(data)
      if (data.is_91a) loadRtkData()
    }
  }

  async function loadRtkData() {
    const { data } = await supabase
      .from('details_91a')
      .select('*')
      .eq('case_id', caseId)
      .single()
    if (data) setRtkData(data)
  }

  async function loadNotes() {
    const { data } = await supabase
      .from('internal_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    setNotes(data || [])
  }

  async function loadAuditLog() {
    const { data } = await supabase
      .from('case_audit_log')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    setAuditLog(data || [])
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  function handlePrint() {
    window.print()
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  if (!caseData) return <div style={{ padding: '40px', textAlign: 'center' }}>Case not found.</div>

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
          .print-page { max-width: 720px; margin: 0 auto; padding: 32px; font-family: Arial, sans-serif; background: white; font-size: 13px; }
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
                {caseData.is_91a ? 'Right-to-Know Request — Full Case Record' : 'Service Request — Full Case Record'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a56a0' }}>Case #{caseData.case_number}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Exported: {formatDate(new Date().toISOString())}</div>
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Case Details</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            {[
              ['Date Submitted', formatDate(caseData.date_submitted)],
              ['Status', caseData.statuses?.name || '—'],
              ['Issue Type', caseData.issue_types?.name || '—'],
              [caseData.is_91a ? 'Subject of Request' : 'Location / Address', caseData.location || '—'],
              ['Description', caseData.description],
              ['Assigned Departments', caseData.case_departments?.map(cd => `${cd.departments?.name} (${cd.statuses?.name})`).join(', ') || 'Unassigned'],
              ['Follow-up Due Date', caseData.followup_due_date ? formatDate(caseData.followup_due_date) : '—'],
              ['Date Closed', caseData.closed_date ? formatDate(caseData.closed_date) : '—'],
            ].map(([label, value], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '7px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', width: '180px', verticalAlign: 'top' }}>{label}</td>
                <td style={{ padding: '7px 12px', color: '#111827', borderLeft: '1px solid #e5e7eb', lineHeight: '1.5' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Submitter Info */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Submitter Information <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400', textTransform: 'none' }}>(Confidential — Internal Use Only)</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            {[
              ['Name', caseData.submitter_name || 'Anonymous'],
              ['Email', caseData.submitter_email || '—'],
              ['Phone', caseData.submitter_phone || '—'],
            ].map(([label, value], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '7px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', width: '180px' }}>{label}</td>
                <td style={{ padding: '7px 12px', color: '#111827', borderLeft: '1px solid #e5e7eb' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 91-A Details */}
        {caseData.is_91a && rtkData && (
          <>
            <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Right-to-Know (RSA 91-A) Details</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <tbody>
                {[
                  ['Acknowledged Date', rtkData.acknowledged_date ? formatDate(rtkData.acknowledged_date) : '—'],
                  ['Request Topic', rtkData.request_topic || '—'],
                  ['Number of Records', rtkData.number_of_records ?? '—'],
                  ['Hours Worked (Running)', rtkData.hours_worked ?? '—'],
                  ['Hours Worked (Final)', rtkData.hours_worked_closed ?? '—'],
                  ['Fees Assessed', rtkData.fees_assessed != null ? `$${parseFloat(rtkData.fees_assessed).toFixed(2)}` : '—'],
                  ['Fees Collected', rtkData.fees_collected != null ? `$${parseFloat(rtkData.fees_collected).toFixed(2)}` : '—'],
                  ['Date Records Ready', rtkData.date_records_ready ? formatDate(rtkData.date_records_ready) : '—'],
                  ['Date Requestor Notified', rtkData.date_requestor_notified ? formatDate(rtkData.date_requestor_notified) : '—'],
                  ['Appointment Date/Time', rtkData.appointment_datetime ? formatDateTime(rtkData.appointment_datetime) : '—'],
                  ['Delivery Method', rtkData.delivery_method || '—'],
                  ['Tracking Number', rtkData.tracking_number || '—'],
                  ['Hold for Pick Up', rtkData.hold_for_pickup ? 'Yes' : 'No'],
                ].map(([label, value], i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '7px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', width: '180px', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '7px 12px', color: '#111827', borderLeft: '1px solid #e5e7eb' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Internal Notes */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Internal Notes <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '400', textTransform: 'none' }}>(Confidential)</span></div>
        {notes.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '24px' }}>No internal notes.</div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            {notes.map((note, i) => (
              <div key={note.id} style={{ borderLeft: '3px solid #1a56a0', paddingLeft: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>{note.created_by} · {formatDateTime(note.created_at)}</div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{note.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Audit Log */}
        <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '10px', letterSpacing: '0.5px' }}>Activity Log</div>
        {auditLog.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '24px' }}>No activity recorded.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Date / Time</th>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Action</th>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry, i) => (
                <tr key={entry.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '7px 12px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTime(entry.created_at)}</td>
                  <td style={{ padding: '7px 12px', color: '#111827' }}>{entry.action}</td>
                  <td style={{ padding: '7px 12px', color: '#6b7280', fontSize: '12px' }}>{entry.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', fontSize: '11px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>City of Franklin, NH — Service Request System — CONFIDENTIAL</span>
          <span>Case #{caseData.case_number}</span>
        </div>
      </div>
    </div>
  )
}

export default PrintCaseDetail
