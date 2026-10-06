import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { JLC_TAB_LABEL, daysOpen, facilityLabel, formatDateOnly } from './jlcConfig'

const s = {
  page: { padding: '24px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a56a0', margin: 0 },
  note: { fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  filters: { display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '16px', borderBottom: '1px solid #e5e7eb', alignItems: 'center' },
  input: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
  primary: { padding: '8px 16px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  secondary: { padding: '8px 16px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  disabled: { padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' },
  badge: (done) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: done ? '#d1fae5' : '#fef3c7', color: done ? '#065f46' : '#92400e' }),
  empty: { padding: '40px', textAlign: 'center', color: '#6b7280' },
}

function JlcFacilityRepairs({ onViewReport, onManageBuildings, onPrintSelected }) {
  const [reports, setReports] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    async function load() {
      const [{ data, error }, { data: facs }] = await Promise.all([
        supabase
          .from('facility_repair_reports')
          .select('id, confirmation_number, facility_id, facility_other_name, department, issue_location, reported_date, reported_by_name, status, completed_date, city_facilities ( name )')
          .order('reported_date', { ascending: false })
          .order('submitted_at', { ascending: false }),
        supabase.from('city_facilities').select('id, name, is_active').order('name'),
      ])
      if (error) setLoadError(error.message)
      setReports(data || [])
      setFacilities(facs || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (buildingFilter === 'other' && r.facility_id) return false
      if (buildingFilter !== 'all' && buildingFilter !== 'other' && String(r.facility_id) !== buildingFilter) return false
      if (dateFrom && r.reported_date < dateFrom) return false
      if (dateTo && r.reported_date > dateTo) return false
      if (q && !(r.confirmation_number.toLowerCase().includes(q) || (r.reported_by_name || '').toLowerCase().includes(q))) return false
      return true
    })
  }, [reports, statusFilter, buildingFilter, dateFrom, dateTo, search])

  // Bulk print is for open requests (blank repair section); ignore any selected row that's since been filtered out.
  const printable = filtered.filter(r => selected.includes(r.id) && r.status === 'open')

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const openFiltered = filtered.filter(r => r.status === 'open')
  const allOpenSelected = openFiltered.length > 0 && openFiltered.every(r => selected.includes(r.id))

  return (
    <div style={s.page}>
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>{JLC_TAB_LABEL}</h1>
          <p style={s.note}>Internal only — Joint Loss Committee facility repair reports. Not part of Service Requests.</p>
        </div>
        <button style={s.secondary} onClick={onManageBuildings}>Manage Buildings</button>
      </div>

      <div style={s.card}>
        <div style={s.filters}>
          <input style={{ ...s.input, minWidth: '220px' }} placeholder="Search confirmation # or name..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={s.input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>
          <select style={s.input} value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}>
            <option value="all">All Buildings</option>
            {facilities.map(f => <option key={f.id} value={String(f.id)}>{f.name}{f.is_active ? '' : ' (archived)'}</option>)}
            <option value="other">Other city building</option>
          </select>
          <label style={{ fontSize: '12px', color: '#6b7280' }}>From <input type="date" style={s.input} value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label>
          <label style={{ fontSize: '12px', color: '#6b7280' }}>To <input type="date" style={s.input} value={dateTo} onChange={e => setDateTo(e.target.value)} /></label>
          <div style={{ marginLeft: 'auto' }}>
            <button
              style={printable.length > 0 ? s.primary : s.disabled}
              disabled={printable.length === 0}
              onClick={() => onPrintSelected(printable.map(r => r.id))}
            >
              Print Selected ({printable.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={s.empty}>Loading...</div>
        ) : loadError ? (
          <div style={s.empty}>Could not load reports: {loadError}</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>No reports match these filters.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>
                    <input
                      type="checkbox"
                      title="Select all open reports shown"
                      checked={allOpenSelected}
                      onChange={() => setSelected(allOpenSelected ? selected.filter(id => !openFiltered.some(r => r.id === id)) : [...new Set([...selected, ...openFiltered.map(r => r.id)])])}
                    />
                  </th>
                  <th style={s.th}>Confirmation #</th>
                  <th style={s.th}>Building</th>
                  <th style={s.th}>Location</th>
                  <th style={s.th}>Reported</th>
                  <th style={s.th}>Reported By</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Days Open</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={s.td}>
                      {r.status === 'open' && <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />}
                    </td>
                    <td style={{ ...s.td, fontWeight: '700', color: '#1a56a0', whiteSpace: 'nowrap' }}>{r.confirmation_number}</td>
                    <td style={s.td}>{facilityLabel(r)}</td>
                    <td style={s.td}>{r.issue_location}</td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDateOnly(r.reported_date)}</td>
                    <td style={s.td}>{r.reported_by_name}<div style={{ fontSize: '11px', color: '#9ca3af' }}>{r.department}</div></td>
                    <td style={s.td}><span style={s.badge(r.status === 'completed')}>{r.status === 'completed' ? 'Completed' : 'Open'}</span></td>
                    <td style={s.td}>{daysOpen(r)}</td>
                    <td style={s.td}><button style={s.secondary} onClick={() => onViewReport(r.id)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default JlcFacilityRepairs
