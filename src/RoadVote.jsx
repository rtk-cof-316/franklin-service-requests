import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const FRANKLIN_ROADS = [
  "Adams Avenue", "Aiken Avenue", "Anderson Avenue", "Apple Farm Road", "Auburn Street",
  "Ayles Court", "Babbit Road", "Baldwin Street", "Beaton Street", "Beech Street",
  "Bennett Brook Road", "Birch Drive", "Bond Street", "Calef Hill Road", "Call Road",
  "Canal Street", "Carr Street", "Carver Street", "Central Street", "Chance Pond Road",
  "Charles Street", "Cheney Street", "Chestnut Street", "Church Street", "Circle Drive",
  "Circuit Street", "Clark Street", "Colby Avenue", "Constitution Avenue", "Cricket Hill Way",
  "Cross Mill Road", "Cross Street", "Daniel Webster Drive", "Dana Court", "Daniell Point Road",
  "Davis Street", "Dearborn Street", "Depot Street", "Duffy Street", "East Bow Street",
  "East High Street", "Easy Street", "Edgewood Street", "Edmunds Street", "Edwards Street",
  "Elkins Street", "Elm Street", "Esker Drive", "Evergreen Avenue", "Fair Street",
  "Fairway Drive", "Ferncliff Drive", "Finch Drive", "Flaghole Road", "Forrest Street",
  "Frances Street", "Franklin Street", "Freedom Drive", "Gerrish Street", "Gile Pond Road",
  "Gile Road", "Gilman Street", "Glen Falls Road", "Glory Avenue", "Griffin Road",
  "Grove Street", "Hampshire Drive", "Heath Road", "Hemlock Drive", "Hideaway Lane",
  "Highland Avenue", "Hill Road", "Hillary Drive", "Hunt Street", "Hutchinson Street",
  "Independence Avenue", "Jeanette Street", "Kendall Street", "Kidder Avenue", "Ladybug Lane",
  "Lake Avenue", "Lake Shore Drive", "Lancaster Street", "Lark Street", "Lawndale Avenue",
  "Lawson Avenue", "Laxon Avenue", "Leach Avenue", "Ledgeview Drive", "Liberty Avenue",
  "Lincoln Street", "Madeline Street", "Madison Street", "Maple Square", "Mark Road",
  "Meadowood Drive", "Morrill Court", "Munroe Street", "Myrtle Avenue", "Nelson Street",
  "New Boston Road", "New Hampton Road", "North Main Street", "North Road",
  "North Sulloway Street", "Oak Street", "Old South Main Street", "Orchard Street",
  "Oriole Street", "Park Street", "Pasture Drive", "Patriot Avenue", "Peabody Place",
  "Pearl Street", "Pemigewassett Street", "Pine Colony Road", "Pine Street",
  "Pinecrest Circle", "Pleasant Street", "Poplar Street", "Proctor Street",
  "Profile Drive", "Prospect Street", "Punch Brook Road", "Racine Street", "Range Road",
  "River Street", "Robert Street", "Robin Street", "Rowell Drive", "Russell Street",
  "Salisbury Road", "Sand Hill Road", "Sanborn Street", "Sanger Street", "School Street",
  "Shaw Road", "Sky Meadow Lane", "Smiling Hill Road", "Smith Hill Road",
  "South Main Street", "South Sulloway Street", "Spring Street", "Sterling Drive",
  "Stone Avenue", "Sturtevant Street", "Summit Street", "Terrace Road", "Thompson Park",
  "Thunder Road", "Timberland Drive", "Upland Drive", "Valley Street", "Victory Drive",
  "View Street", "Ward Hill Road", "Washington Avenue", "Webster Avenue",
  "Webster Lake Road", "Wells Street", "West Bow Street", "West High Street",
  "Wilderness Avenue", "Winnipesaukee Street", "Woodbine Drive", "Woodridge Road",
  "Woodrow Avenue"
].sort()

function RoadVote() {
  const [selectedRoad, setSelectedRoad] = useState('')
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVotes()
  }, [])

  async function loadVotes() {
    const { data } = await supabase
      .from('road_votes')
      .select('road_name')
    setVotes(data || [])
    setLoading(false)
  }

  async function handleVote() {
    if (!selectedRoad) return
    setSubmitting(true)
    setError(null)
    const { error } = await supabase
      .from('road_votes')
      .insert([{ road_name: selectedRoad }])
    if (error) {
      setError('Something went wrong. Please try again.')
    } else {
      setVoted(true)
      await loadVotes()
    }
    setSubmitting(false)
  }

  // Tally votes
  const tally = {}
  votes.forEach(v => {
    tally[v.road_name] = (tally[v.road_name] || 0) + 1
  })
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1])
  const topRoads = sorted.slice(0, 10)
  const maxVotes = topRoads.length > 0 ? topRoads[0][1] : 1

  const barColors = [
    '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d',
    '#16a34a', '#0d9488', '#0284c7', '#4f46e5', '#7c3aed'
  ]

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ backgroundColor: '#1a56a0', padding: '16px 20px' }}>
        <div style={{ fontSize: '26px', fontWeight: '700', color: '#e8eef6', marginBottom: '2px' }}>
          Which Road Needs the Most Work?
        </div>
        <div style={{ fontSize: '18px', color: '#93afd4' }}>
          Cast your vote — tell us which Franklin road needs attention most.
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {!voted ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={selectedRoad}
                onChange={e => setSelectedRoad(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: selectedRoad ? '#111827' : '#9ca3af',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  minWidth: '200px',
                }}
              >
                <option value="">-- Select a road --</option>
                {FRANKLIN_ROADS.map(road => (
                  <option key={road} value={road}>{road}</option>
                ))}
              </select>
              <button
                onClick={handleVote}
                disabled={!selectedRoad || submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedRoad && !submitting ? '#1a56a0' : '#93afd4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: selectedRoad && !submitting ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                {submitting ? 'Submitting...' : 'Cast My Vote'}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>{error}</div>
            )}
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              {votes.length} vote{votes.length !== 1 ? 's' : ''} cast so far
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
            ✓ Thanks for voting for <strong>{selectedRoad}</strong>! Your voice helps us prioritize repairs.
          </div>
        )}

        {/* Results chart */}
        {loading ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Loading results...</div>
        ) : topRoads.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No votes yet — be the first!</div>
        ) : (
          <>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '14px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
              Top {topRoads.length} Roads by Community Votes
            </div>
            {topRoads.map(([road, count], i) => (
              <div key={road} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: '13px', color: '#374151', width: '180px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {road}
                </div>
                <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: '4px', height: '22px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: barColors[i] || '#1a56a0',
                    borderRadius: '4px',
                    width: `${(count / maxVotes) * 100}%`,
                    transition: 'width 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px',
                  }}>
                    {count >= 2 && (
                      <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: '600' }}>{count}</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', width: '50px', textAlign: 'right', flexShrink: 0 }}>
                  {count} vote{count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
            {sorted.length > 10 && (
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>
                + {sorted.length - 10} more roads with votes
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RoadVote
