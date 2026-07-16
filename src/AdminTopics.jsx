import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import AdminModeration from './AdminModeration'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  container: { maxWidth: '900px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  tabStrip: { display: 'flex', gap: '4px', marginBottom: '20px' },
  tab: { padding: '8px 18px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderRadius: '6px' },
  tabActive: { padding: '8px 18px', backgroundColor: '#1a56a0', border: '1px solid #1a56a0', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderRadius: '6px' },
  newBtn: { padding: '8px 16px', backgroundColor: '#1a56a0', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' },
  topicTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  topicTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0' },
  statusBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  statusActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusClosed: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  metaLine: { fontSize: '13px', color: '#6b7280', marginTop: '6px' },
  actionRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  editBtn: { padding: '6px 14px', backgroundColor: '#ffffff', border: '1px solid #1a56a0', color: '#1a56a0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  closeBtn: { padding: '6px 14px', backgroundColor: '#ffffff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', marginTop: '14px' },
  input: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', outline: 'none', boxSizing: 'border-box', minHeight: '70px', resize: 'vertical' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  threeCol: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  positionRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' },
  removeBtn: { background: 'none', border: 'none', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  addBtn: { padding: '6px 14px', backgroundColor: '#ffffff', border: '1px dashed #93afd4', color: '#1a56a0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '20px', marginLeft: '8px' },
  positionsListLabel: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginTop: '4px', marginBottom: '6px' },
}

function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyForm = {
  title: '',
  description: '',
  reference_url: '',
  hearing_date: '',
  hearing_time: '',
  hearing_location: '',
  comment_opens_at: '',
  comment_closes_at: '',
}

function AdminTopics() {
  const [view, setView] = useState('topics')
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [positionsDraft, setPositionsDraft] = useState([{ label: '' }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTopics()
  }, [])

  async function loadTopics() {
    setLoading(true)
    const { data } = await supabase.from('topics').select('*').order('hearing_date', { ascending: true })
    setTopics(data || [])
    setLoading(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(emptyForm)
    setPositionsDraft([{ label: '' }])
    setShowForm(true)
  }

  async function startEdit(topic) {
    setEditingId(topic.id)
    setForm({
      title: topic.title || '',
      description: topic.description || '',
      reference_url: topic.reference_url || '',
      hearing_date: topic.hearing_date || '',
      hearing_time: topic.hearing_time || '',
      hearing_location: topic.hearing_location || '',
      comment_opens_at: toDatetimeLocal(topic.comment_opens_at),
      comment_closes_at: toDatetimeLocal(topic.comment_closes_at),
    })
    const { data: positionData } = await supabase
      .from('topic_positions')
      .select('*')
      .eq('topic_id', topic.id)
      .order('sort_order')
    setPositionsDraft((positionData || []).map(p => ({ id: p.id, label: p.label })))
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
  }

  function updatePositionLabel(index, value) {
    setPositionsDraft(prev => prev.map((p, i) => (i === index ? { ...p, label: value } : p)))
  }

  function addPositionField() {
    setPositionsDraft(prev => [...prev, { label: '' }])
  }

  function removePositionField(index) {
    setPositionsDraft(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form.title.trim() || !form.comment_opens_at || !form.comment_closes_at) {
      alert('Title, comment open date/time, and comment close date/time are required.')
      return
    }
    const validPositions = positionsDraft.filter(p => p.label.trim())
    if (validPositions.length === 0) {
      alert('At least one position is required.')
      return
    }

    setSaving(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      reference_url: form.reference_url.trim() || null,
      hearing_date: form.hearing_date || null,
      hearing_time: form.hearing_time || null,
      hearing_location: form.hearing_location.trim() || null,
      comment_opens_at: new Date(form.comment_opens_at).toISOString(),
      comment_closes_at: new Date(form.comment_closes_at).toISOString(),
    }

    let topicId = editingId
    if (editingId) {
      const { error } = await supabase.from('topics').update(payload).eq('id', editingId)
      if (error) {
        console.error('Error updating topic:', error)
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('topics').insert([{ ...payload, status: 'active' }]).select().single()
      if (error || !data) {
        console.error('Error creating topic:', error)
        setSaving(false)
        return
      }
      topicId = data.id
    }

    // Reconcile positions: update existing rows, insert new ones, attempt to remove dropped ones.
    const { data: existingPositions } = await supabase.from('topic_positions').select('*').eq('topic_id', topicId)
    const existingIds = (existingPositions || []).map(p => p.id)
    const keptIds = validPositions.filter(p => p.id).map(p => p.id)
    const removedIds = existingIds.filter(id => !keptIds.includes(id))

    for (const removedId of removedIds) {
      const { error } = await supabase.from('topic_positions').delete().eq('id', removedId)
      if (error) {
        alert('One or more positions could not be removed because they already have comments attached. They were left in place.')
      }
    }

    for (let i = 0; i < validPositions.length; i++) {
      const p = validPositions[i]
      if (p.id) {
        await supabase.from('topic_positions').update({ label: p.label.trim(), sort_order: i }).eq('id', p.id)
      } else {
        await supabase.from('topic_positions').insert([{ topic_id: topicId, label: p.label.trim(), sort_order: i }])
      }
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    await loadTopics()
  }

  async function handleCloseTopic(topic) {
    if (!confirm(`Close "${topic.title}" for public comment? This moves it to the archive.`)) return
    await supabase.from('topics').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', topic.id)
    await loadTopics()
  }

  if (view === 'moderation') {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.tabStrip}>
            <button style={styles.tab} onClick={() => setView('topics')}>Topics</button>
            <button style={styles.tabActive} onClick={() => setView('moderation')}>Moderation</button>
          </div>
        </div>
        <AdminModeration />
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.tabStrip}>
          <button style={styles.tabActive} onClick={() => setView('topics')}>Topics</button>
          <button style={styles.tab} onClick={() => setView('moderation')}>Moderation</button>
        </div>

        <div style={styles.headerRow}>
          <h1 style={styles.headerTitle}>Public Comment Topics</h1>
          {!showForm && <button style={styles.newBtn} onClick={startNew}>+ New Topic</button>}
        </div>

        {showForm && (
          <div style={styles.card}>
            <div style={styles.label}>Title *</div>
            <input style={styles.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <div style={styles.label}>Description</div>
            <textarea style={styles.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            <div style={styles.label}>Reference URL</div>
            <input style={styles.input} value={form.reference_url} onChange={e => setForm({ ...form, reference_url: e.target.value })} placeholder="https://..." />

            <div style={styles.threeCol}>
              <div>
                <div style={styles.label}>Hearing Date</div>
                <input type="date" style={styles.input} value={form.hearing_date} onChange={e => setForm({ ...form, hearing_date: e.target.value })} />
              </div>
              <div>
                <div style={styles.label}>Hearing Time</div>
                <input type="time" style={styles.input} value={form.hearing_time} onChange={e => setForm({ ...form, hearing_time: e.target.value })} />
              </div>
              <div>
                <div style={styles.label}>Hearing Location</div>
                <input style={styles.input} value={form.hearing_location} onChange={e => setForm({ ...form, hearing_location: e.target.value })} />
              </div>
            </div>

            <div style={styles.twoCol}>
              <div>
                <div style={styles.label}>Comment Period Opens *</div>
                <input type="datetime-local" style={styles.input} value={form.comment_opens_at} onChange={e => setForm({ ...form, comment_opens_at: e.target.value })} />
              </div>
              <div>
                <div style={styles.label}>Comment Period Closes *</div>
                <input type="datetime-local" style={styles.input} value={form.comment_closes_at} onChange={e => setForm({ ...form, comment_closes_at: e.target.value })} />
              </div>
            </div>

            <div style={styles.positionsListLabel}>Positions</div>
            {positionsDraft.map((p, i) => (
              <div key={p.id || `new-${i}`} style={styles.positionRow}>
                <input
                  style={styles.input}
                  value={p.label}
                  onChange={e => updatePositionLabel(i, e.target.value)}
                  placeholder={`Position ${i + 1}`}
                />
                {positionsDraft.length > 1 && (
                  <button style={styles.removeBtn} onClick={() => removePositionField(i)}>Remove</button>
                )}
              </div>
            ))}
            <button style={styles.addBtn} onClick={addPositionField}>+ Add another position</button>

            <div>
              <button style={styles.saveBtn} disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : 'Save Topic'}
              </button>
              <button style={styles.cancelBtn} onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        )}

        {!showForm && (
          loading ? (
            <div style={styles.card}>Loading topics...</div>
          ) : topics.length === 0 ? (
            <div style={styles.card}>No topics yet. Create one to get started.</div>
          ) : (
            topics.map(topic => (
              <div key={topic.id} style={styles.card}>
                <div style={styles.topicTitleRow}>
                  <span style={styles.topicTitle}>{topic.title}</span>
                  <span style={{ ...styles.statusBadge, ...(topic.status === 'active' ? styles.statusActive : styles.statusClosed) }}>
                    {topic.status}
                  </span>
                </div>
                <div style={styles.metaLine}>
                  {topic.hearing_date && `Hearing: ${topic.hearing_date} ${topic.hearing_time || ''}`}
                </div>
                <div style={styles.metaLine}>
                  Comment window: {new Date(topic.comment_opens_at).toLocaleString()} — {new Date(topic.comment_closes_at).toLocaleString()}
                </div>
                <div style={styles.actionRow}>
                  <button style={styles.editBtn} onClick={() => startEdit(topic)}>Edit</button>
                  {topic.status === 'active' && (
                    <button style={styles.closeBtn} onClick={() => handleCloseTopic(topic)}>Close Topic</button>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}

export default AdminTopics
