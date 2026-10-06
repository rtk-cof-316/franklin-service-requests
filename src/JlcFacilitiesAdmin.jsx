import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { JLC_TAB_LABEL } from './jlcConfig'

const s = {
  page: { padding: '24px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" },
  wrap: { maxWidth: '820px', margin: '0 auto' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '12px 0 4px 0' },
  note: { fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '20px' },
  input: { padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  primary: { padding: '9px 16px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  secondary: { padding: '7px 12px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  error: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#991b1b' },
  row: { display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' },
}

function JlcFacilitiesAdmin({ onBack }) {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')

  async function load() {
    const { data, error: err } = await supabase.from('city_facilities').select('*').order('is_active', { ascending: false }).order('name')
    if (err) setError(err.message)
    setFacilities(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function run(promise) {
    setError('')
    const { error: err } = await promise
    if (err) {
      setError(err.code === '23505' ? 'An active building with that name already exists.' : err.message)
      return false
    }
    await load()
    return true
  }

  async function add() {
    if (!newName.trim()) { setError('Enter a building name.'); return }
    if (await run(supabase.from('city_facilities').insert({ name: newName.trim(), address: newAddress.trim() }))) {
      setNewName('')
      setNewAddress('')
    }
  }

  async function saveEdit(id) {
    if (!editName.trim()) { setError('Enter a building name.'); return }
    if (await run(supabase.from('city_facilities').update({ name: editName.trim(), address: editAddress.trim() }).eq('id', id))) setEditingId(null)
  }

  // Buildings are archived, never deleted, so existing reports keep pointing at them.
  function setActive(f, active) {
    return run(supabase.from('city_facilities').update({ is_active: active }).eq('id', f.id))
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <button style={s.secondary} onClick={onBack}>← Back to {JLC_TAB_LABEL}</button>
        <h1 style={s.title}>Manage Buildings</h1>
        <p style={s.note}>Active buildings appear in the public form's dropdown. Archive a building to hide it without losing past reports.</p>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.card}>
          <div style={{ fontWeight: '700', color: '#374151', marginBottom: '10px', fontSize: '14px' }}>Add a building</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input style={{ ...s.input, flex: '1 1 220px' }} placeholder="Building name" value={newName} maxLength={150} onChange={e => setNewName(e.target.value)} />
            <input style={{ ...s.input, flex: '1 1 220px' }} placeholder="Address" value={newAddress} maxLength={250} onChange={e => setNewAddress(e.target.value)} />
            <button style={s.primary} onClick={add}>Add Building</button>
          </div>
        </div>

        <div style={s.card}>
          {loading ? 'Loading...' : facilities.map(f => (
            <div key={f.id} style={{ ...s.row, opacity: f.is_active ? 1 : 0.55 }}>
              {editingId === f.id ? (
                <>
                  <input style={{ ...s.input, flex: '1 1 200px' }} value={editName} maxLength={150} onChange={e => setEditName(e.target.value)} />
                  <input style={{ ...s.input, flex: '1 1 200px' }} value={editAddress} maxLength={250} onChange={e => setEditAddress(e.target.value)} />
                  <button style={s.primary} onClick={() => saveEdit(f.id)}>Save</button>
                  <button style={s.secondary} onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div style={{ flex: '1 1 200px', fontWeight: '600', fontSize: '14px' }}>{f.name}{!f.is_active && <span style={{ color: '#9ca3af', fontWeight: '400' }}> (archived)</span>}</div>
                  <div style={{ flex: '1 1 200px', fontSize: '13px', color: '#6b7280' }}>{f.address || '—'}</div>
                  <button style={s.secondary} onClick={() => { setEditingId(f.id); setEditName(f.name); setEditAddress(f.address || '') }}>Edit</button>
                  {f.is_active
                    ? <button style={s.secondary} onClick={() => setActive(f, false)}>Archive</button>
                    : <button style={s.secondary} onClick={() => setActive(f, true)}>Restore</button>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default JlcFacilitiesAdmin
