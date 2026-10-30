import { useState } from 'react'
import { supabase } from './supabaseClient'

const MIN_LENGTH = 8

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '48px 16px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '440px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', overflow: 'hidden', textAlign: 'left' },
  header: { backgroundColor: '#1a56a0', padding: '24px 32px' },
  title: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#e8eef6' },
  sub: { margin: '4px 0 0 0', fontSize: '13px', color: '#93afd4' },
  body: { padding: '28px 32px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box', marginBottom: '18px', fontFamily: 'inherit' },
  hint: { fontSize: '12px', color: '#6b7280', marginTop: '-12px', marginBottom: '18px' },
  btn: { width: '100%', padding: '12px', backgroundColor: '#1a56a0', color: '#ffffff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnDisabled: { width: '100%', padding: '12px', backgroundColor: '#93afd4', color: '#ffffff', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'not-allowed' },
  error: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#991b1b', marginBottom: '18px' },
  ok: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#065f46', marginBottom: '18px' },
}

function ChangePassword({ userEmail }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!current) { setMessage({ type: 'error', text: 'Enter your current password.' }); return }
    if (next.length < MIN_LENGTH) { setMessage({ type: 'error', text: `Your new password must be at least ${MIN_LENGTH} characters.` }); return }
    if (next === current) { setMessage({ type: 'error', text: 'Your new password must be different from your current one.' }); return }
    if (next !== confirm) { setMessage({ type: 'error', text: 'The new passwords do not match.' }); return }

    setSaving(true)
    // Confirm it's really the account holder (not someone at an unlocked computer) by
    // checking the current password before allowing the change.
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: userEmail, password: current })
    if (verifyError) {
      setSaving(false)
      setMessage({ type: 'error', text: 'Your current password is incorrect.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: next })
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setCurrent('')
    setNext('')
    setConfirm('')
    setMessage({ type: 'success', text: 'Your password was changed. Use the new one the next time you log in.' })
  }

  return (
    <div style={s.page}>
      <form style={s.card} onSubmit={handleSubmit}>
        <div style={s.header}>
          <h1 style={s.title}>Change Password</h1>
          <p style={s.sub}>{userEmail}</p>
        </div>
        <div style={s.body}>
          {message.text && <div style={message.type === 'error' ? s.error : s.ok} role="alert">{message.text}</div>}

          <label style={s.label} htmlFor="cp-current">Current password</label>
          <input id="cp-current" type="password" autoComplete="current-password" style={s.input} value={current} onChange={e => setCurrent(e.target.value)} />

          <label style={s.label} htmlFor="cp-new">New password</label>
          <input id="cp-new" type="password" autoComplete="new-password" style={s.input} value={next} onChange={e => setNext(e.target.value)} />
          <div style={s.hint}>At least {MIN_LENGTH} characters.</div>

          <label style={s.label} htmlFor="cp-confirm">Confirm new password</label>
          <input id="cp-confirm" type="password" autoComplete="new-password" style={s.input} value={confirm} onChange={e => setConfirm(e.target.value)} />

          <button type="submit" style={saving ? s.btnDisabled : s.btn} disabled={saving}>
            {saving ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChangePassword
