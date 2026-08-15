import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_URL, CAR_ADMINS, carAdminRole } from './carConfig'

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '900px', margin: '0 auto' },
  backLink: { fontSize: '13px', color: '#1a56a0', cursor: 'pointer', fontWeight: '600', marginBottom: '16px', display: 'inline-block' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 20px 0' },
  row: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '18px 20px', marginBottom: '14px' },
  rowTitle: { fontSize: '15px', fontWeight: '700', color: '#1a56a0', margin: '0 0 4px 0' },
  rowMeta: { fontSize: '12px', color: '#6b7280', marginBottom: '10px' },
  rowField: { fontSize: '13px', color: '#374151', marginBottom: '6px' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', minHeight: '50px', fontFamily: 'inherit', marginBottom: '8px' },
  button: { padding: '8px 16px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
  buttonSecondary: { padding: '8px 16px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
  buttonDanger: { padding: '8px 16px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' },
  empty: { textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px', backgroundColor: '#ffffff', borderRadius: '8px' },
}

function CarBatchReview({ cycleId, userEmail, onBack }) {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState({})
  const [working, setWorking] = useState({})

  const role = carAdminRole(userEmail)
  const roleName = role === 'brenda' ? CAR_ADMINS.brenda.name : role === 'cityManager' ? CAR_ADMINS.cityManager.name : userEmail

  useEffect(() => {
    load()
  }, [cycleId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('car_submissions')
      .select('*')
      .eq('meeting_cycle_id', cycleId)
      .eq('status', 'submitted')
      .not('submitter_confirmed_at', 'is', null)
      .order('created_at')
    setCars(data || [])
    setLoading(false)
  }

  async function sendCarEmail(type, submission, extra) {
    await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ type, submissionNumber: submission.submission_number, subject: submission.subject, ...extra }),
    })
  }

  async function handleDecision(car, decision) {
    setWorking(prev => ({ ...prev, [car.id]: true }))
    const nextStatus = decision === 'rejected' ? 'rejected' : decision === 'approved_normal' ? 'included_in_packet' : 'pending_work_session_assignment'
    const note = notes[car.id] || null
    await supabase.from('car_submissions').update({
      status: nextStatus, review_decision: decision, review_note: note, reviewed_at: new Date().toISOString(), reviewed_by: roleName,
    }).eq('id', car.id)
    await supabase.from('car_activity_log').insert([{
      car_submission_id: car.id, actor_type: 'admin', actor_name: roleName, action_type: 'review_decision', old_value: car.status, new_value: nextStatus, notes: note,
    }])
    const emailType = decision === 'rejected' ? 'car_rejected' : decision === 'approved_normal' ? 'car_approved_normal' : 'car_approved_hot'
    await sendCarEmail(emailType, car, { toEmail: car.submitter_email, toName: car.submitter_name, reviewNote: note })
    setWorking(prev => ({ ...prev, [car.id]: false }))
    await load()
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <span style={s.backLink} onClick={onBack}>← Back to Cycle</span>
        <h1 style={s.title}>Batch Review</h1>

        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : cars.length === 0 ? (
          <div style={s.empty}>No confirmed submissions awaiting review in this cycle.</div>
        ) : (
          cars.map(car => (
            <div key={car.id} style={s.row}>
              <h3 style={s.rowTitle}>{car.subject || '(no subject)'}</h3>
              <div style={s.rowMeta}>{car.submission_number} · From: {car.from_field || '—'} · {car.submitter_name}</div>
              <div style={s.rowField}><strong>Recommendation:</strong> {car.recommendation || '—'}</div>
              <textarea
                style={s.textarea}
                placeholder="Note (optional, included in the notification email)..."
                value={notes[car.id] || ''}
                onChange={e => setNotes(prev => ({ ...prev, [car.id]: e.target.value }))}
              />
              <button style={s.buttonDanger} disabled={working[car.id]} onClick={() => handleDecision(car, 'rejected')}>Reject</button>
              <button style={s.buttonSecondary} disabled={working[car.id]} onClick={() => handleDecision(car, 'approved_normal')}>Approve – Normal</button>
              <button style={s.button} disabled={working[car.id]} onClick={() => handleDecision(car, 'approved_hot')}>Approve – Hot Button</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CarBatchReview
