import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { CAR_STANDARD_SECTIONS } from './carConfig'

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '780px', margin: '0 auto' },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', fontWeight: '600', marginBottom: '16px', display: 'inline-block' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 20px 0' },
  section: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: '16px' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#1a56a0', marginTop: 0, marginBottom: '14px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  input: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', width: '100%', boxSizing: 'border-box' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  defaultNote: { fontSize: '11px', color: '#9ca3af', marginTop: '-8px', marginBottom: '10px' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '8px' },
  button: { padding: '10px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  buttonSecondary: { padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
  warnBanner: { backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#92400e', marginTop: '8px' },
  wsRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px', color: '#374151' },
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000)
}

function CarCycleDetail({ cycleId, onBack, onBatchReview, onPrintAgenda, onPrintPacket }) {
  const [cycle, setCycle] = useState(null)
  const [workSessions, setWorkSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSessionDate, setNewSessionDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [cycleId])

  async function load() {
    setLoading(true)
    const [cycleRes, wsRes] = await Promise.all([
      supabase.from('meeting_cycles').select('*').eq('id', cycleId).single(),
      supabase.from('work_sessions').select('*').eq('meeting_cycle_id', cycleId).order('session_date'),
    ])
    setCycle(cycleRes.data)
    setWorkSessions(wsRes.data || [])
    setLoading(false)
  }

  async function updateCycle(patch) {
    await supabase.from('meeting_cycles').update(patch).eq('id', cycleId)
    await load()
  }

  function toggleSection(key) {
    const current = cycle.standard_sections || []
    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key]
    updateCycle({ standard_sections: next })
  }

  async function handleAddWorkSession() {
    if (!newSessionDate) return
    setSaving(true)
    await supabase.from('work_sessions').insert([{
      meeting_cycle_id: cycleId,
      session_date: newSessionDate,
      answers_due_default: addDays(newSessionDate, 2),
    }])
    setNewSessionDate('')
    setSaving(false)
    await load()
  }

  if (loading) return <div style={s.page}><div style={s.card}>Loading…</div></div>
  if (!cycle) return <div style={s.page}><div style={s.card}>Cycle not found.</div></div>

  const effectivePacketPublish = cycle.packet_publish_date_override || cycle.packet_publish_date_default

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.backLink} onClick={onBack}>← Back to Meeting Cycles</span>
        <h1 style={s.title}>Meeting Cycle — {formatDate(cycle.meeting_date)}</h1>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>Logistics</h2>
          <div style={s.twoCol}>
            <div>
              <label style={s.label}>Meeting Time</label>
              <input style={s.input} defaultValue={cycle.meeting_time || ''} onBlur={e => updateCycle({ meeting_time: e.target.value || null })} placeholder="6:30 PM" />
            </div>
            <div>
              <label style={s.label}>Status</label>
              <select style={s.input} value={cycle.status} onChange={e => updateCycle({ status: e.target.value })}>
                <option value="open_for_submissions">Open for Submissions</option>
                <option value="in_review">In Review</option>
                <option value="active">Active</option>
                <option value="packet_published">Packet Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <label style={s.label}>Location</label>
          <input style={s.input} defaultValue={cycle.meeting_location || ''} onBlur={e => updateCycle({ meeting_location: e.target.value || null })} />
          <div style={s.twoCol}>
            <div>
              <label style={s.label}>Zoom Link</label>
              <input style={s.input} defaultValue={cycle.meeting_zoom_link || ''} onBlur={e => updateCycle({ meeting_zoom_link: e.target.value || null })} />
            </div>
            <div>
              <label style={s.label}>Zoom Phone</label>
              <input style={s.input} defaultValue={cycle.meeting_zoom_phone || ''} onBlur={e => updateCycle({ meeting_zoom_phone: e.target.value || null })} />
            </div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>Key Dates</h2>
          <div style={s.twoCol}>
            <div>
              <label style={s.label}>Review Date (default: {formatDate(cycle.review_date_default)})</label>
              <input style={s.input} type="date" defaultValue={cycle.review_date_override || ''} onBlur={e => updateCycle({ review_date_override: e.target.value || null })} />
            </div>
            <div>
              <label style={s.label}>CAR Submission Close (default: {formatDate(cycle.car_submission_close_default)})</label>
              <input style={s.input} type="date" defaultValue={cycle.car_submission_close_override || ''} onBlur={e => updateCycle({ car_submission_close_override: e.target.value || null })} />
            </div>
          </div>
          <label style={s.label}>Packet Publish Date (default: {formatDate(cycle.packet_publish_date_default)})</label>
          <input style={s.input} type="date" defaultValue={cycle.packet_publish_date_override || ''} onBlur={e => updateCycle({ packet_publish_date_override: e.target.value || null })} />
        </div>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>Standard Agenda Sections</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 0 }}>Toggle which standard sections appear (heading only) in the generated agenda for this cycle.</p>
          {CAR_STANDARD_SECTIONS.map(sec => (
            <label key={sec.key} style={s.checkboxRow}>
              <input type="checkbox" checked={(cycle.standard_sections || []).includes(sec.key)} onChange={() => toggleSection(sec.key)} />
              {sec.label}
            </label>
          ))}
        </div>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>Work Sessions</h2>
          {workSessions.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No work sessions scheduled.</p>
          ) : (
            workSessions.map(ws => {
              const effectiveDue = ws.answers_due_override || ws.answers_due_default
              const gap = daysBetween(effectiveDue, effectivePacketPublish)
              return (
                <div key={ws.id}>
                  <div style={s.wsRow}>
                    <span>Session: {formatDate(ws.session_date)}</span>
                    <span>Answers Due: {formatDate(effectiveDue)}</span>
                  </div>
                  {gap < 5 && (
                    <div style={s.warnBanner}>Only {gap} day{gap === 1 ? '' : 's'} between this session's Answers Due date and the cycle's Packet Publish Date — may be tight.</div>
                  )}
                </div>
              )
            })
          )}
          <div style={{ marginTop: '12px' }}>
            <label style={s.label}>New Work Session Date</label>
            <input style={s.input} type="date" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} />
            <button style={s.button} disabled={saving || !newSessionDate} onClick={handleAddWorkSession}>Add Work Session</button>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>Actions</h2>
          <button style={s.button} onClick={() => onBatchReview(cycleId)}>Batch Review CARs</button>
          <button style={s.buttonSecondary} onClick={() => onPrintAgenda(cycleId)}>Print Agenda</button>
          <button style={s.buttonSecondary} onClick={() => onPrintPacket(cycleId)}>Generate Packet</button>
        </div>
      </div>
    </div>
  )
}

export default CarCycleDetail
