import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import CarAgendaBlock from './CarAgendaBlock'

const s = {
  page: { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#111827', maxWidth: '750px', margin: '0 auto', padding: '0 28px' },
  noPrint: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
}

function PrintCarAgenda({ cycleId, workSessionId, onClose }) {
  const [cycle, setCycle] = useState(null)
  const [workSession, setWorkSession] = useState(null)
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [cycleId, workSessionId])

  async function load() {
    setLoading(true)
    const { data: cycleData } = await supabase.from('meeting_cycles').select('*').eq('id', cycleId).single()
    setCycle(cycleData)

    if (workSessionId) {
      const [{ data: wsData }, { data: carsData }] = await Promise.all([
        supabase.from('work_sessions').select('*').eq('id', workSessionId).single(),
        supabase.from('car_submissions').select('*').eq('work_session_id', workSessionId).order('created_at'),
      ])
      setWorkSession(wsData)
      setCars(carsData || [])
    } else {
      const { data: carsData } = await supabase
        .from('car_submissions')
        .select('*')
        .eq('meeting_cycle_id', cycleId)
        .in('status', ['included_in_packet', 'packet_published', 'decided_at_meeting'])
        .order('agenda_position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      setCars(carsData || [])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading agenda…</div>
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
        <CarAgendaBlock cycle={cycle} workSession={workSession} kind={workSessionId ? 'work_session' : 'council'} includedCars={cars} />
      </div>
    </div>
  )
}

export default PrintCarAgenda
