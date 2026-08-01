import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { supabase } from './supabaseClient'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import RoadVote from './RoadVote'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function getMarkerColor(status) {
  const s = (status || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return '#16a34a'
  if (s === 'in progress' || s === 'scheduled') return '#1a56a0'
  if (s === 'assigned') return '#d97706'
  return '#dc2626'
}

function createColoredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 14px;
      height: 14px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

const ROAD_ISSUE_TYPES = ['Pothole', 'Crack / Pavement', 'Drainage', 'Heave', 'Signage / Traffic', 'Plowing / Sanding']
const FRANKLIN_CENTER = [43.4445, -71.6487]

function getStatusStyle(name) {
  const s = (name || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46', display: 'inline-block' }
  if (s === 'in progress' || s === 'scheduled' || s === 'assigned') return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af', display: 'inline-block' }
  return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151', display: 'inline-block' }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const scoreCards = [
  { key: 'total', label: 'Total Reported', color: '#dc2626' },
  { key: 'inProgress', label: 'In Progress', color: '#d97706' },
  { key: 'avgDays', label: 'Avg Days to Repair', color: '#ca8a04' },
  { key: 'completed', label: 'Completed', color: '#16a34a' },
]

function RoadWatch() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    loadRoadCases()
  }, [])

  async function loadRoadCases() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        date_submitted,
        closed_date,
        location,
        description,
        latitude,
        longitude,
        statuses ( name, is_closing ),
        issue_types ( name )
      `)
      .eq('is_91a', false)
      .order('date_submitted', { ascending: false })

    if (!error && data) {
      const roadCases = data.filter(c => ROAD_ISSUE_TYPES.includes(c.issue_types?.name))
      setCases(roadCases)
    }
    setLoading(false)
  }

  const filteredCases = cases.filter(c => {
    const isClosed = Boolean(c.statuses?.is_closing)
    if (statusFilter === 'open' && isClosed) return false
    if (statusFilter === 'closed' && !isClosed) return false
    if (typeFilter !== 'all' && c.issue_types?.name !== typeFilter) return false
    return true
  })

  const totalCount = cases.length
  const inProgressCount = cases.filter(c =>
    ['assigned', 'scheduled', 'in progress'].includes((c.statuses?.name || '').toLowerCase())
  ).length
  const closedCount = cases.filter(c => c.statuses?.is_closing).length

  const avgDaysToRepair = (() => {
    const resolved = cases.filter(c => {
      const s = (c.statuses?.name || '').toLowerCase()
      return (s === 'resolved' || s === 'closed') && c.date_submitted && c.closed_date
    })
    if (resolved.length === 0) return '—'
    const avg = resolved.reduce((sum, c) => {
      const days = Math.round((new Date(c.closed_date) - new Date(c.date_submitted)) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0) / resolved.length
    return `${Math.round(avg)}d`
  })()

  const scoreValues = {
    total: totalCount,
    inProgress: inProgressCount,
    avgDays: avgDaysToRepair,
    completed: closedCount,
  }

  const typeCounts = ROAD_ISSUE_TYPES.map(type => ({
    type,
    count: cases.filter(c => c.issue_types?.name === type).length,
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)

  const maxCount = typeCounts.length > 0 ? typeCounts[0].count : 1

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* Hero */}
      <div style={{ backgroundColor: '#1a56a0', color: '#ffffff', padding: '32px 32px 28px 32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#e8eef6', margin: '0 0 4px 0' }}>🛣️ Franklin Road Watch</h1>
        <p style={{ fontSize: '18px', color: '#bfdbfe', margin: '0 0 24px 0', lineHeight: '1.6' }}>
          We're tracking every road issue — and working to fix them.<br />
          See every reported pothole, crack, and road defect in Franklin. Check if your issue is already logged, view its repair status, or submit a new one.
        </p>

        {/* Scorecards */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {scoreCards.map(card => (
            <div key={card.key} style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${card.color}`,
              borderTop: `5px solid ${card.color}`,
              padding: '16px 24px',
              textAlign: 'center',
              minWidth: '130px',
              flex: '1',
              maxWidth: '180px',
            }}>
              <div style={{ fontSize: '36px', fontWeight: '700', color: card.color, lineHeight: 1 }}>
                {scoreValues[card.key]}
              </div>
              <div style={{ fontSize: '11px', color: card.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '6px', fontWeight: '600' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Filter:</span>
          <select
            style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', backgroundColor: '#ffffff', outline: 'none' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open Only</option>
            <option value="closed">Resolved Only</option>
          </select>
          <select
            style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#374151', backgroundColor: '#ffffff', outline: 'none' }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Issue Types</option>
            {ROAD_ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: 'auto' }}>
            Showing {filteredCases.length} of {cases.length} issues
          </span>
        </div>

        {/* Map */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>📍 Issue Map — Franklin, NH</span>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {[['#dc2626','Reported'],['#d97706','Assigned'],['#1a56a0','In Progress'],['#16a34a','Resolved']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <MapContainer center={FRANKLIN_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredCases.map(c => (
                <Marker
  key={c.id}
  position={c.latitude && c.longitude ? [c.latitude, c.longitude] : FRANKLIN_CENTER}
  icon={createColoredIcon(getMarkerColor(c.statuses?.name))}
>
                  <Popup>
                    <div style={{ fontSize: '13px', minWidth: '180px' }}>
                      <div style={{ fontWeight: '700', color: '#1a56a0', marginBottom: '4px' }}>Case #{c.case_number}</div>
                      <div style={{ marginBottom: '2px' }}><strong>Type:</strong> {c.issue_types?.name}</div>
                      <div style={{ marginBottom: '2px' }}><strong>Location:</strong> {c.location}</div>
                      <div style={{ marginBottom: '2px' }}><strong>Status:</strong> {c.statuses?.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>Reported {formatDate(c.date_submitted)}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div style={{ padding: '8px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#9ca3af' }}>
            Note: Precise map pin placement coming soon. Pins currently centered on Franklin, NH.
          </div>
        </div>

        {/* Chart */}
        {typeCounts.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>📊 Issues by Type</div>
            {typeCounts.map(({ type, count }) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#374151', width: '160px', flexShrink: 0 }}>{type}</div>
                <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#1a56a0', borderRadius: '4px', width: `${(count / maxCount) * 100}%` }} />
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', width: '30px', textAlign: 'right' }}>{count}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table with scrollable body */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>📋 All Road Issues</span>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Loading road issues...</div>
          ) : filteredCases.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>No road issues found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    {[
                      { label: 'Case #', width: '80px' },
                      { label: 'Date Reported', width: '120px' },
                      { label: 'Location', width: '180px' },
                      { label: 'Issue Type', width: '140px' },
                      { label: 'Description', width: 'auto' },
                      { label: 'Status', width: '120px' },
                    ].map(h => (
                      <th key={h.label} style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        borderBottom: '2px solid #e5e7eb',
                        whiteSpace: 'nowrap',
                        width: h.width,
                      }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
              </table>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '140px' }} />
                    <col />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <tbody>
                    {filteredCases.map(c => (
                      <tr key={c.id}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', fontWeight: '700', color: '#1a56a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.case_number}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(c.date_submitted)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issue_types?.name || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={getStatusStyle(c.statuses?.name)}>{c.statuses?.name || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <RoadVote />

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', paddingBottom: '24px' }}>
          Data maintained by City of Franklin. Updated in real time.
        </div>
      </div>
    </div>
  )
}

export default RoadWatch
