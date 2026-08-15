import { CAR_STANDARD_SECTIONS } from './carConfig'

// Pure presentational — renders the agenda content, no print chrome (see PrintCarAgenda.jsx
// for the standalone print wrapper, and PrintCarPacket.jsx for embedding this as the first
// block of a packet). Section order and toggle behavior match the real Council Meeting and
// Work Session agenda samples exactly — see carConfig.js's CAR_STANDARD_SECTIONS comment
// for why this list is the single source of truth for both the cycle-detail toggles and
// this render order.

const s = {
  header: { textAlign: 'center', marginBottom: '20px' },
  headerTitle: { fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px', margin: '0 0 6px 0' },
  headerLine: { fontSize: '12px', margin: '2px 0' },
  divider: { textAlign: 'center', fontSize: '11px', color: '#6b7280', margin: '14px 0' },
  sectionHeading: { fontSize: '12px', fontWeight: '700', textAlign: 'center', margin: '14px 0 6px 0', textTransform: 'uppercase' },
  sectionBody: { fontSize: '12px', lineHeight: 1.6, textAlign: 'center', margin: '0 0 10px 0' },
  itemBlock: { margin: '14px 0' },
  itemLabel: { fontSize: '12px', fontWeight: '700', textAlign: 'center', margin: '0 0 4px 0' },
  itemText: { fontSize: '12px', textAlign: 'center', margin: 0 },
  footer: { fontSize: '10px', color: '#374151', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 },
}

const COMMENTS_FROM_PUBLIC_TEXT = 'Persons wishing to address the Council may speak for a maximum of three minutes. No more than thirty minutes will be devoted to public commentary.'

const BEFORE_ITEMS_KEYS = ['legislative_update', 'comments_from_public', 'council_acknowledgement', 'mayors_update', 'managers_update', 'school_board_update']
const AFTER_ITEMS_KEYS = ['committee_reports', 'nonprofit_reports', 'other_business']

function toRoman(num) {
  const romans = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]
  let result = ''
  let n = num
  for (const [sym, val] of romans) {
    while (n >= val) { result += sym; n -= val }
  }
  return result
}

function CarAgendaBlock({ cycle, workSession, kind, includedCars }) {
  const sections = cycle.standard_sections || []
  const publicHearingCars = includedCars.filter(c => c.requires_public_hearing)
  const isCouncil = kind === 'council'
  const dateSource = isCouncil ? cycle.meeting_date : (workSession?.session_date || cycle.meeting_date)

  return (
    <div>
      <div style={s.header}>
        <div style={s.headerTitle}>{isCouncil ? 'CITY COUNCIL MEETING' : 'CITY COUNCIL WORKSHOP'}</div>
        <div style={s.headerLine}>{new Date(dateSource + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{cycle.meeting_time ? ` – ${cycle.meeting_time}` : ''}</div>
        {cycle.meeting_location && <div style={s.headerLine}>{cycle.meeting_location}</div>}
        {cycle.meeting_zoom_link && <div style={s.headerLine}>View only by Zoom: {cycle.meeting_zoom_link}</div>}
        {cycle.meeting_zoom_phone && <div style={s.headerLine}>or by phone: {cycle.meeting_zoom_phone}</div>}
      </div>

      <div style={s.divider}>***********************************</div>
      <div style={s.sectionHeading}>Salute to the Flag</div>
      <div style={s.divider}>***********************************</div>

      {isCouncil && <div style={s.sectionHeading}>Moment of Silence for Our Veterans</div>}

      {isCouncil && publicHearingCars.length > 0 && (
        <>
          <div style={s.sectionHeading}>Public Hearings</div>
          {publicHearingCars.map(car => <p key={car.id} style={s.sectionBody}>{car.subject}</p>)}
        </>
      )}

      {isCouncil && BEFORE_ITEMS_KEYS.map(key => {
        if (!sections.includes(key)) return null
        const label = CAR_STANDARD_SECTIONS.find(sec => sec.key === key)?.label
        return (
          <div key={key}>
            <div style={s.sectionHeading}>{label}</div>
            {key === 'comments_from_public' && <p style={s.sectionBody}>{COMMENTS_FROM_PUBLIC_TEXT}</p>}
          </div>
        )
      })}

      {includedCars.map((car, i) => (
        <div key={car.id} style={s.itemBlock}>
          <div style={s.itemLabel}>Agenda Item {toRoman(i + 1)}.</div>
          <p style={s.itemText}>Council to consider {car.recommendation || car.subject}.</p>
        </div>
      ))}

      {isCouncil && AFTER_ITEMS_KEYS.map(key => {
        if (!sections.includes(key)) return null
        const label = CAR_STANDARD_SECTIONS.find(sec => sec.key === key)?.label
        return (
          <div key={key}>
            <div style={s.sectionHeading}>{label}</div>
            {key === 'other_business' && <p style={s.sectionBody}>Late Items</p>}
          </div>
        )
      })}

      {!isCouncil && (
        <div>
          <div style={s.sectionHeading}>Other Business</div>
          <p style={s.sectionBody}>Late Items</p>
        </div>
      )}

      <div style={s.sectionHeading}>Adjournment</div>

      <div style={s.footer}>
        The City Council of the City of Franklin reserves the right to enter into non-public session when necessary, according to the provisions of RSA 91-A.
        <br />
        This location is accessible to the disabled. Those wishing to attend who are hearing or vision impaired may make their needs known by calling 934-3900 (voice), or through "Relay New Hampshire" 1-800-735-2964 (T.D./TRY)
      </div>
    </div>
  )
}

export default CarAgendaBlock
