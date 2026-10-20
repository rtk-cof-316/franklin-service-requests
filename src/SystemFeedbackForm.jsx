import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  FEEDBACK_STATUSES, FEEDBACK_TAB_LABEL, FEEDBACK_TYPES, SUPABASE_ANON_KEY, SUPABASE_URL, formatFeedbackDate,
} from './feedbackConfig'

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '720px', margin: '0 auto 24px auto', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '28px', textAlign: 'left' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 6px 0' },
  sub: { fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.5 },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '4px', boxSizing: 'border-box', minHeight: '130px', fontFamily: 'inherit', resize: 'vertical' },
  hint: { fontSize: '12px', color: '#6b7280', marginBottom: '16px' },
  toggleRow: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  toggle: (active) => ({ flex: '1 1 200px', padding: '12px 16px', borderRadius: '8px', border: active ? '2px solid #1a56a0' : '1px solid #d1d5db', backgroundColor: active ? '#eff6ff' : '#ffffff', color: active ? '#1a56a0' : '#374151', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }),
  button: { padding: '11px 26px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '11px 26px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  error: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
  ok: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#065f46' },
  badge: (st) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: st.bg, color: st.color }),
  item: { padding: '14px 0', borderBottom: '1px solid #f3f4f6' },
}

const EMPTY = { feedback_type: 'issue', title: '', description: '', screen: '' }

function SystemFeedbackForm() {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [mine, setMine] = useState([])
  const [loadingMine, setLoadingMine] = useState(true)

  async function loadMine() {
    const { data } = await supabase
      .from('system_feedback')
      .select('id, feedback_type, title, status, response, created_at')
      .order('created_at', { ascending: false })
    setMine(data || [])
    setLoadingMine(false)
  }

  useEffect(() => { loadMine() }, [])

  const isIssue = form.feedback_type === 'issue'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSent(false)
    if (!form.title.trim() || !form.description.trim()) { setError('Please fill in the title and description.'); return }

    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/system-feedback-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setForm(prev => ({ ...EMPTY, feedback_type: prev.feedback_type }))
        setSent(true)
        loadMine()
      }
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={s.page}>
      <form style={s.card} onSubmit={handleSubmit} noValidate>
        <h1 style={s.title}>{FEEDBACK_TAB_LABEL}</h1>
        <p style={s.sub}>Tell us about a problem you ran into with this system, or something you wish it could do. This is only visible to City staff.</p>

        {sent && <div style={s.ok}>Thank you — your {isIssue ? 'issue report' : 'feature request'} was sent. You can follow its status below.</div>}
        {error && <div style={s.error} role="alert">{error}</div>}

        <div style={s.toggleRow}>
          {Object.entries(FEEDBACK_TYPES).map(([key, label]) => (
            <button type="button" key={key} style={s.toggle(form.feedback_type === key)} onClick={() => setForm(prev => ({ ...prev, feedback_type: key }))}>
              {label}
            </button>
          ))}
        </div>

        <label style={s.label} htmlFor="fb-title">{isIssue ? 'What went wrong?' : 'What would you like?'} (short title) <span style={{ color: '#dc2626' }}>*</span></label>
        <input id="fb-title" style={s.input} value={form.title} maxLength={150} placeholder={isIssue ? 'e.g. Print button does nothing on the case page' : 'e.g. Let me export my department\'s cases to Excel'} onChange={e => setForm({ ...form, title: e.target.value })} />

        <label style={s.label} htmlFor="fb-desc">{isIssue ? 'Describe what happened and what you expected' : 'Describe what you want the system to do, and why it would help'} <span style={{ color: '#dc2626' }}>*</span></label>
        <textarea id="fb-desc" style={s.textarea} value={form.description} maxLength={4000} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div style={s.hint}>{isIssue ? 'Include the case number or steps you took if you can. ' : ''}Please don't include residents' personal information.</div>

        <label style={s.label} htmlFor="fb-screen">Which screen? (optional)</label>
        <input id="fb-screen" style={s.input} value={form.screen} maxLength={150} placeholder="e.g. Case Detail, My Cases, Admin Dashboard" onChange={e => setForm({ ...form, screen: e.target.value })} />

        <button type="submit" style={submitting ? s.buttonDisabled : s.button} disabled={submitting}>
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div style={s.card}>
        <h2 style={{ ...s.title, fontSize: '17px' }}>My Submissions</h2>
        {loadingMine ? (
          <div style={s.sub}>Loading...</div>
        ) : mine.length === 0 ? (
          <div style={s.sub}>You haven't sent anything yet.</div>
        ) : mine.map(item => (
          <div key={item.id} style={s.item}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{item.title}</div>
              <span style={s.badge(FEEDBACK_STATUSES[item.status] || FEEDBACK_STATUSES.new)}>{(FEEDBACK_STATUSES[item.status] || FEEDBACK_STATUSES.new).label}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{FEEDBACK_TYPES[item.feedback_type]} · {formatFeedbackDate(item.created_at)}</div>
            {item.response && <div style={{ fontSize: '13px', color: '#374151', backgroundColor: '#f9fafb', borderLeft: '3px solid #1a56a0', padding: '8px 12px', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{item.response}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SystemFeedbackForm
