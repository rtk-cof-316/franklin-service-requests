import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL } from './carConfig'
import { CAR_FIELD_GUIDANCE } from './carGuidance'
import CarAgendaBlock from './CarAgendaBlock'

const s = {
  page: { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#111827', maxWidth: '750px', margin: '0 auto', padding: '0 28px' },
  noPrint: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  carHeader: { textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '10px', marginBottom: '14px' },
  carTitle: { fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' },
  carSub: { fontSize: '11px', color: '#6b7280', margin: 0 },
  fieldLabel: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#374151', marginTop: '10px' },
  fieldValue: { fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  motionBox: { fontSize: '12px', lineHeight: 1.6, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '10px 12px', marginTop: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '11px' },
  th: { padding: '6px 8px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700', textAlign: 'left', border: '1px solid #bfdbfe', textTransform: 'uppercase', fontSize: '10px' },
  td: { padding: '6px 8px', border: '1px solid #e5e7eb', verticalAlign: 'top' },
  block: { pageBreakAfter: 'always', padding: '20px 0' },
}

function CarBlock({ car, attachments }) {
  return (
    <div style={s.block}>
      <div style={s.carHeader}>
        <div style={s.carTitle}>{car.subject}</div>
        <div style={s.carSub}>{car.submission_number} · From: {car.from_field}</div>
      </div>

      <div style={s.fieldLabel}>{CAR_FIELD_GUIDANCE.history.label}</div>
      <p style={s.fieldValue}>{car.history || '—'}</p>

      <div style={s.fieldLabel}>{CAR_FIELD_GUIDANCE.recommendation.label}</div>
      <p style={s.fieldValue}>{car.recommendation || '—'}</p>

      <div style={s.fieldLabel}>{CAR_FIELD_GUIDANCE.suggested_motion.label}</div>
      <div style={s.motionBox}>
        Councilor moves: "{car.suggested_motion || '—'}"
        <br />Mayor calls for a second, discussion, and vote.
      </div>

      <div style={s.fieldLabel}>{CAR_FIELD_GUIDANCE.discussion.label}</div>
      <p style={s.fieldValue}>{car.discussion || '—'}</p>

      <div style={s.fieldLabel}>{CAR_FIELD_GUIDANCE.alternatives.label}</div>
      <p style={s.fieldValue}>{car.alternatives || '—'}</p>

      <div style={s.fieldLabel}>Attachments / Exhibits</div>
      {attachments.length === 0 ? (
        <p style={{ ...s.fieldValue, color: '#9ca3af', fontStyle: 'italic' }}>None</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr><th style={s.th}>File Name</th><th style={s.th}>Size</th><th style={s.th}>URL</th></tr>
          </thead>
          <tbody>
            {attachments.map(f => (
              <tr key={f.id}>
                <td style={s.td}>{f.file_name}</td>
                <td style={s.td}>{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                <td style={{ ...s.td, fontSize: '9px', color: '#6b7280', wordBreak: 'break-all' }}>
                  {`${SUPABASE_URL}/storage/v1/object/public/car-attachments/${f.file_path}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function PrintCarPacket({ cycleId, onClose }) {
  const [cycle, setCycle] = useState(null)
  const [cars, setCars] = useState([])
  const [attachmentsByCarId, setAttachmentsByCarId] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [cycleId])

  async function load() {
    setLoading(true)
    const { data: cycleData } = await supabase.from('meeting_cycles').select('*').eq('id', cycleId).single()
    setCycle(cycleData)

    const { data: carsData } = await supabase
      .from('car_submissions')
      .select('*')
      .eq('meeting_cycle_id', cycleId)
      .in('status', ['included_in_packet', 'packet_published', 'decided_at_meeting'])
      .order('agenda_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    const carList = carsData || []
    setCars(carList)

    if (carList.length > 0) {
      const { data: attData } = await supabase
        .from('car_attachments')
        .select('*')
        .in('car_submission_id', carList.map(c => c.id))
      const grouped = {}
      for (const a of attData || []) {
        grouped[a.car_submission_id] = grouped[a.car_submission_id] || []
        grouped[a.car_submission_id].push(a)
      }
      setAttachmentsByCarId(grouped)
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading packet…</div>
  if (!cycle) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Meeting cycle not found.</div>

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
      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } }`}</style>
      <div style={s.page}>
        <div style={s.block}>
          <CarAgendaBlock cycle={cycle} kind="council" includedCars={cars} />
        </div>
        {cars.map(car => (
          <CarBlock key={car.id} car={car} attachments={attachmentsByCarId[car.id] || []} />
        ))}
      </div>
    </div>
  )
}

export default PrintCarPacket
