import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', fontWeight: '600' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: '16px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  input: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', width: '100%', boxSizing: 'border-box' },
  button: { padding: '10px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '10px 20px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' },
  defaultsBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px', fontSize: '13px', color: '#1e40af' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #dbeafe' },
  td: { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  row: { cursor: 'pointer' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af' },
  empty: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' },
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

function AdminCarCycles({ onViewCycle, onBack }) {
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [meetingDate, setMeetingDate] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('meeting_cycles').select('*').order('meeting_date', { ascending: false })
    setCycles(data || [])
    setLoading(false)
  }

  const reviewDefault = meetingDate ? addDays(meetingDate, -17) : null
  const packetDefault = meetingDate ? addDays(meetingDate, -5) : null

  async function handleCreate(e) {
    e.preventDefault()
    if (!meetingDate) return
    setCreating(true)
    await supabase.from('meeting_cycles').insert([{
      meeting_date: meetingDate,
      review_date_default: reviewDefault,
      packet_publish_date_default: packetDefault,
      car_submission_close_default: reviewDefault,
      status: 'open_for_submissions',
    }])
    setMeetingDate('')
    setCreating(false)
    await load()
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>Meeting Cycles</h1>
        <span style={styles.backLink} onClick={onBack}>← Back to CARs</span>
      </div>

      <div style={styles.card}>
        <h2 style={{ fontSize: '15px', color: '#1a56a0', marginTop: 0 }}>New Meeting Cycle</h2>
        <form onSubmit={handleCreate}>
          <label style={styles.label}>Meeting Date</label>
          <input style={styles.input} type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required />
          {meetingDate && (
            <div style={styles.defaultsBox}>
              <div>Review Date (default): <strong>{formatDate(reviewDefault)}</strong></div>
              <div>CAR Submission Window Closes (default): <strong>{formatDate(reviewDefault)}</strong></div>
              <div>Packet Publish Date (default): <strong>{formatDate(packetDefault)}</strong></div>
              <div style={{ fontSize: '11px', marginTop: '6px', color: '#6b7280' }}>All of these can be overridden after creating the cycle — the default stays visible alongside any override.</div>
            </div>
          )}
          <button type="submit" disabled={creating || !meetingDate} style={creating || !meetingDate ? styles.buttonDisabled : styles.button}>
            {creating ? 'Creating…' : 'Create Cycle'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : cycles.length === 0 ? (
        <div style={styles.empty}>No meeting cycles yet.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Meeting Date</th>
              <th style={styles.th}>Review Date</th>
              <th style={styles.th}>Packet Publish</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map(c => (
              <tr key={c.id} style={styles.row} onClick={() => onViewCycle(c.id)}>
                <td style={{ ...styles.td, fontWeight: '700', color: '#1a56a0' }}>{formatDate(c.meeting_date)}</td>
                <td style={styles.td}>{formatDate(c.review_date_override || c.review_date_default)}</td>
                <td style={styles.td}>{formatDate(c.packet_publish_date_override || c.packet_publish_date_default)}</td>
                <td style={styles.td}><span style={styles.badge}>{c.status.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminCarCycles
