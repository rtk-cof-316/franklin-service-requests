import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { CAR_FIELD_GUIDANCE } from './carGuidance'
import { downloadCarDocx } from './carDocxExport'

const s = {
  page: { fontFamily: 'Calibri, Arial, sans-serif', fontSize: '12px', color: '#111827', maxWidth: '750px', margin: '0 auto', padding: '0 28px' },
  noPrint: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  headerRow: { display: 'flex', alignItems: 'flex-start', gap: '16px', paddingTop: '20px', marginBottom: '20px' },
  seal: { width: '80px', height: '81px', flexShrink: 0 },
  headerText: { flex: 1, textAlign: 'right' },
  cityLine: { fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  carLine: { fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '2px 0 4px 0', paddingBottom: '4px', borderBottom: '1px solid #000000' },
  dateLine: { fontSize: '12px', margin: 0 },
  fieldLabel: { fontSize: '12px', fontWeight: '700', marginTop: '14px', marginBottom: '4px' },
  fieldValue: { fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 },
  motionBox: { fontSize: '12px', lineHeight: 1.6, margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '11px' },
  th: { padding: '6px 8px', backgroundColor: '#f3f4f6', fontWeight: '700', textAlign: 'left', border: '1px solid #e5e7eb' },
  td: { padding: '6px 8px', border: '1px solid #e5e7eb' },
}

function formatHeaderDate(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function PrintCarSubmission({ submissionId, onClose }) {
  const [car, setCar] = useState(null)
  const [meetingDate, setMeetingDate] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    load()
  }, [submissionId])

  async function load() {
    setLoading(true)
    const { data: carData } = await supabase.from('car_submissions').select('*').eq('id', submissionId).single()
    setCar(carData)
    if (carData) {
      const [{ data: cycleData }, { data: attData }] = await Promise.all([
        carData.meeting_cycle_id ? supabase.from('meeting_cycles').select('meeting_date').eq('id', carData.meeting_cycle_id).single() : Promise.resolve({ data: null }),
        supabase.from('car_attachments').select('*').eq('car_submission_id', submissionId),
      ])
      setMeetingDate(cycleData?.meeting_date || null)
      setAttachments(attData || [])
    }
    setLoading(false)
  }

  async function handleDownloadDocx() {
    setDownloading(true)
    try {
      await downloadCarDocx(car, meetingDate)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading…</div>
  if (!car) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>CAR not found.</div>

  return (
    <div>
      <div style={s.noPrint} className="no-print">
        <button onClick={() => window.print()} style={{ padding: '8px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={handleDownloadDocx} disabled={downloading} style={{ padding: '8px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>
          {downloading ? 'Preparing…' : '⬇ Download as Word'}
        </button>
        <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>
      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } }`}</style>

      <div style={s.page}>
        <div style={s.headerRow}>
          <img src="/city-seal.png" alt="City of Franklin Seal" style={s.seal} />
          <div style={s.headerText}>
            <p style={s.cityLine}>City of Franklin</p>
            <p style={s.carLine}>Council Agenda Report</p>
            <p style={s.dateLine}>{formatHeaderDate(meetingDate)}</p>
          </div>
        </div>

        {Object.entries(CAR_FIELD_GUIDANCE).map(([key, field]) => (
          <div key={key}>
            <div style={s.fieldLabel}>{field.label}:</div>
            {key === 'suggested_motion' ? (
              <div style={s.motionBox}>
                Councilor moves: "{car.suggested_motion || ''}"
                <br />Mayor calls for a second, discussion, and vote.
              </div>
            ) : (
              <p style={s.fieldValue}>{car[key] || '—'}</p>
            )}
          </div>
        ))}

        <div style={s.fieldLabel}>Requires a Resolution:</div>
        <p style={s.fieldValue}>{car.requires_resolution ? 'Yes' : 'No'}</p>
        <div style={s.fieldLabel}>Requires a Public Hearing:</div>
        <p style={s.fieldValue}>{car.requires_public_hearing ? 'Yes' : 'No'}</p>

        <div style={s.fieldLabel}>Attachments/Exhibits:</div>
        {attachments.length === 0 ? (
          <p style={{ ...s.fieldValue, color: '#9ca3af', fontStyle: 'italic' }}>None</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr><th style={s.th}>File Name</th><th style={s.th}>Size</th></tr>
            </thead>
            <tbody>
              {attachments.map(f => (
                <tr key={f.id}>
                  <td style={s.td}>{f.file_name}</td>
                  <td style={s.td}>{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default PrintCarSubmission
