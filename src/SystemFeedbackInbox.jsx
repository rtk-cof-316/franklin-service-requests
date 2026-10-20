import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { FEEDBACK_INBOX_LABEL, FEEDBACK_STATUSES, FEEDBACK_TYPES, formatFeedbackDate } from './feedbackConfig'

const s = {
  page: { padding: '24px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" },
  wrap: { maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  note: { fontSize: '13px', color: '#6b7280', margin: '4px 0 16px 0' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', textAlign: 'left' },
  filters: { display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '14px 16px', borderBottom: '1px solid #e5e7eb' },
  input: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' },
  row: (open) => ({ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', backgroundColor: open ? '#f8fafc' : '#ffffff' }),
  badge: (st) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: st.bg, color: st.color }),
  typeBadge: (issue) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: issue ? '#fee2e2' : '#e0f2fe', color: issue ? '#991b1b' : '#075985' }),
  label: { fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' },
  primary: { padding: '8px 16px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', margin: '12px 16px', fontSize: '13px', color: '#991b1b' },
  ok: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '10px 14px', margin: '12px 16px', fontSize: '13px', color: '#065f46' },
  empty: { padding: '40px', textAlign: 'center', color: '#6b7280' },
}

function SystemFeedbackInbox() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [draft, setDraft] = useState({ status: 'new', response: '' })
  const [log, setLog] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  async function load() {
    const { data, error } = await supabase
      .from('system_feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setLoadError(error.message)
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i => {
      if (typeFilter !== 'all' && i.feedback_type !== typeFilter) return false
      if (statusFilter === 'active' && ['done', 'wont_do'].includes(i.status)) return false
      if (statusFilter !== 'active' && statusFilter !== 'all' && i.status !== statusFilter) return false
      if (q && !(`${i.title} ${i.description} ${i.submitted_by_email} ${i.screen || ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [items, typeFilter, statusFilter, search])

  async function openItem(item) {
    if (openId === item.id) { setOpenId(null); return }
    setOpenId(item.id)
    setDraft({ status: item.status, response: item.response || '' })
    setMessage({ type: '', text: '' })
    const { data } = await supabase.from('system_feedback_log').select('*').eq('feedback_id', item.id).order('created_at', { ascending: false })
    setLog(data || [])
  }

  async function save(item) {
    setSaving(true)
    setMessage({ type: '', text: '' })
    const { data, error } = await supabase
      .from('system_feedback')
      .update({ status: draft.status, response: draft.response.trim() || null })
      .eq('id', item.id)
      .select('*')
      .single()
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setItems(prev => prev.map(i => (i.id === item.id ? data : i)))
    setMessage({ type: 'ok', text: 'Saved. The submitter will see the new status and response under My Submissions.' })
    const { data: entries } = await supabase.from('system_feedback_log').select('*').eq('feedback_id', item.id).order('created_at', { ascending: false })
    setLog(entries || [])
  }

  const counts = useMemo(() => ({
    new: items.filter(i => i.status === 'new').length,
    issues: items.filter(i => i.feedback_type === 'issue' && !['done', 'wont_do'].includes(i.status)).length,
    features: items.filter(i => i.feedback_type === 'feature' && !['done', 'wont_do'].includes(i.status)).length,
  }), [items])

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.title}>{FEEDBACK_INBOX_LABEL}</h1>
        <p style={s.note}>{counts.new} new · {counts.issues} open issue{counts.issues === 1 ? '' : 's'} · {counts.features} open feature request{counts.features === 1 ? '' : 's'}. Visible only to you.</p>

        <div style={s.card}>
          <div style={s.filters}>
            <input style={{ ...s.input, minWidth: '220px' }} placeholder="Search title, text, or person..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={s.input} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              {Object.entries(FEEDBACK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select style={s.input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="active">Not finished</option>
              <option value="all">All statuses</option>
              {Object.entries(FEEDBACK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {loading ? <div style={s.empty}>Loading...</div>
            : loadError ? <div style={s.empty}>Could not load: {loadError}</div>
            : filtered.length === 0 ? <div style={s.empty}>Nothing matches these filters.</div>
            : filtered.map(item => {
              const open = openId === item.id
              const st = FEEDBACK_STATUSES[item.status] || FEEDBACK_STATUSES.new
              return (
                <div key={item.id}>
                  <div style={s.row(open)} onClick={() => openItem(item)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <span style={s.typeBadge(item.feedback_type === 'issue')}>{FEEDBACK_TYPES[item.feedback_type]}</span>{' '}
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{item.title}</span>
                      </div>
                      <span style={s.badge(st)}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{item.submitted_by_email} · {formatFeedbackDate(item.created_at)}{item.screen ? ` · ${item.screen}` : ''}</div>
                  </div>

                  {open && (
                    <div style={{ padding: '16px 20px 20px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={s.label}>Description</div>
                      <div style={{ fontSize: '14px', color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '16px' }}>{item.description}</div>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <div>
                          <div style={s.label}>Status</div>
                          <select style={s.input} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}>
                            {Object.entries(FEEDBACK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={s.label}>Response (the submitter sees this)</div>
                          <textarea style={{ ...s.input, width: '100%', minHeight: '70px', resize: 'vertical' }} value={draft.response} maxLength={2000} onChange={e => setDraft({ ...draft, response: e.target.value })} />
                        </div>
                      </div>
                      <button style={s.primary} disabled={saving} onClick={() => save(item)}>{saving ? 'Saving...' : 'Save'}</button>
                      {message.text && <div style={message.type === 'error' ? { ...s.error, margin: '12px 0 0 0' } : { ...s.ok, margin: '12px 0 0 0' }}>{message.text}</div>}

                      <div style={{ ...s.label, marginTop: '18px' }}>History</div>
                      {log.map(e => (
                        <div key={e.id} style={{ fontSize: '12px', color: '#374151', padding: '3px 0' }}>
                          {formatFeedbackDate(e.created_at)} — {e.actor_label}: {e.action_type === 'submitted' ? 'submitted' : e.action_type === 'status_changed' ? `status ${FEEDBACK_STATUSES[e.old_value]?.label || e.old_value} → ${FEEDBACK_STATUSES[e.new_value]?.label || e.new_value}` : 'response updated'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default SystemFeedbackInbox
