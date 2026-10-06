import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { JLC_DISCLAIMER, JLC_FORM_SUBTITLE, JLC_FORM_TITLE, facilityLabel, formatDateOnly } from './jlcConfig'

// Mirrors the paper form: same labels, same order. mode 'form' leaves the repair half blank
// with ruled lines for handwriting; mode 'completed' prints both halves filled in.
const css = `
  .jlc-print { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
  .jlc-sheet { max-width: 7.3in; margin: 0 auto; padding: 0.4in 0.2in; box-sizing: border-box; }
  .jlc-head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 14px; }
  .jlc-head h1 { font-size: 20px; margin: 0; }
  .jlc-head .sub { font-size: 12px; margin-top: 2px; }
  .jlc-head .num { font-size: 12px; font-weight: bold; text-align: right; }
  .jlc-section { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #000; padding: 4px 8px; margin: 14px 0 8px 0; }
  .jlc-row { margin-bottom: 10px; }
  .jlc-label { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
  .jlc-value { font-size: 13px; border-bottom: 1px solid #000; min-height: 20px; padding: 1px 2px; white-space: pre-wrap; word-break: break-word; }
  .jlc-line { border-bottom: 1px solid #000; height: 24px; }
  .jlc-cols { display: flex; gap: 20px; }
  .jlc-cols > div { flex: 1; }
  .jlc-cb { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; vertical-align: -2px; margin: 0 4px 0 10px; text-align: center; font-size: 11px; line-height: 12px; font-weight: bold; }
  .jlc-foot { margin-top: 16px; padding-top: 6px; border-top: 1px solid #000; font-size: 10px; line-height: 1.4; }
  @media print {
    @page { size: letter; margin: 0.4in; }
    .no-print { display: none !important; }
    body { margin: 0; background: #fff; }
    .jlc-sheet { padding: 0; max-width: none; page-break-after: always; break-after: page; }
    .jlc-sheet:last-of-type { page-break-after: auto; break-after: auto; }
  }
`

function Row({ label, children }) {
  return (
    <div className="jlc-row">
      <div className="jlc-label">{label}</div>
      {children}
    </div>
  )
}

function Lines({ count }) {
  return <>{Array.from({ length: count }).map((_, i) => <div key={i} className="jlc-line" />)}</>
}

function Box({ checked }) {
  return <span className="jlc-cb">{checked ? 'X' : ''}</span>
}

function Sheet({ report, filled }) {
  const building = [facilityLabel(report), report.department].filter(Boolean).join(' / ')
  return (
    <div className="jlc-sheet">
      <div className="jlc-head">
        <div>
          <h1>{JLC_FORM_TITLE}</h1>
          <div className="sub">{JLC_FORM_SUBTITLE}</div>
        </div>
        <div className="num">Confirmation # {report.confirmation_number}</div>
      </div>

      <div className="jlc-section">Report Request</div>
      <Row label="Building/Department"><div className="jlc-value">{building}</div></Row>
      <Row label="Location of the Issue"><div className="jlc-value">{report.issue_location}</div></Row>
      <Row label="Date"><div className="jlc-value">{formatDateOnly(report.reported_date)}</div></Row>
      <Row label="Problem or Repair Needed"><div className="jlc-value" style={{ minHeight: '60px' }}>{report.problem_description}</div></Row>
      <Row label="Reported by"><div className="jlc-value">{report.reported_by_name}</div></Row>

      <div className="jlc-section">Repair report</div>
      <Row label="Repairs done by">{filled ? <div className="jlc-value">{report.repaired_by}</div> : <Lines count={1} />}</Row>
      <Row label="Description of work done">{filled ? <div className="jlc-value" style={{ minHeight: '80px' }}>{report.work_description}</div> : <Lines count={4} />}</Row>
      <div className="jlc-cols">
        <Row label="Date completed">{filled ? <div className="jlc-value">{formatDateOnly(report.completed_date)}</div> : <Lines count={1} />}</Row>
        <Row label="Parts used">{filled ? <div className="jlc-value">{report.parts_used}</div> : <Lines count={1} />}</Row>
      </div>
      <Row label="Reporter notified of correction on this date">{filled ? <div className="jlc-value">{formatDateOnly(report.reporter_notified_date)}</div> : <Lines count={1} />}</Row>
      <Row label="Reporter notified via">
        <div style={{ fontSize: '13px', padding: '4px 0' }}>
          <Box checked={filled && report.reporter_notified_via === 'Phone'} />Phone
          <Box checked={filled && report.reporter_notified_via === 'Email'} />Email
        </div>
      </Row>

      <div className="jlc-foot">{JLC_DISCLAIMER}</div>
    </div>
  )
}

function PrintJlcRepair({ reportIds, mode, onClose }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('facility_repair_reports')
        .select('*, city_facilities ( name )')
        .in('id', reportIds)
        .order('confirmation_number')
      setReports(data || [])
      setLoading(false)
    }
    load()
  }, [reportIds])

  function handlePrint() {
    // Audit the print; never let a logging hiccup block printing.
    supabase.rpc('log_jlc_print', { p_report_ids: reportIds, p_mode: mode }).then(() => {}, () => {})
    window.print()
  }

  return (
    <div className="jlc-print">
      <style>{css}</style>
      <div className="no-print" style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={handlePrint} style={{ padding: '8px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          {mode === 'completed' ? 'Completed record — both halves filled in.' : 'Repair section is left blank for handwriting.'} {reports.length} form{reports.length === 1 ? '' : 's'}.
        </div>
      </div>
      {loading ? <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div> : reports.map(r => <Sheet key={r.id} report={r} filled={mode === 'completed'} />)}
    </div>
  )
}

export default PrintJlcRepair
