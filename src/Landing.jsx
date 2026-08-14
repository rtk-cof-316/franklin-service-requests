const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '48px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  wrap: { maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a56a0', margin: '0 0 8px 0', textAlign: 'center' },
  subtitle: { fontSize: '15px', color: '#6b7280', margin: '0 0 40px 0', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '28px 24px', cursor: 'pointer', border: '1px solid transparent', transition: 'transform 0.15s, box-shadow 0.15s' },
  icon: { fontSize: '32px', marginBottom: '12px' },
  cardTitle: { fontSize: '17px', fontWeight: '700', color: '#1a56a0', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '13px', color: '#6b7280', lineHeight: 1.5, margin: 0 },
  footer: { textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '40px' },
}

const MODULES = [
  { page: 'submit', icon: '📝', title: 'Submit a Request', desc: 'Report a pothole, request a service, or file a Right-to-Know request with the City.' },
  { page: 'track', icon: '🔍', title: 'Check Service Request Status', desc: 'Look up an existing service request using your case number.' },
  { page: 'roads', icon: '🚧', title: 'Road Watch', desc: 'See road and infrastructure issues currently being tracked and repaired citywide.' },
  { page: 'analytics', icon: '📊', title: 'City Analytics', desc: 'View citywide service request volume and performance data.' },
  { page: 'public-input', icon: '💬', title: 'Public Comment', desc: 'Weigh in on active City topics and hearings, or review past comment periods.' },
  { page: 'mou-submit', icon: '🤝', title: 'Submit an MOU', desc: 'Start a Memorandum of Understanding proposal with the City of Franklin.' },
  { page: 'mou-status', icon: '📋', title: 'Check MOU Status', desc: 'Check the status of an MOU proposal using your submission number and PIN.' },
]

function Landing({ onNavigate }) {
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.title}>City of Franklin, NH</h1>
        <p style={s.subtitle}>Choose what you'd like to do.</p>
        <div style={s.grid}>
          {MODULES.map(m => (
            <div
              key={m.page}
              style={s.card}
              onClick={() => onNavigate(m.page)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <div style={s.icon}>{m.icon}</div>
              <div style={s.cardTitle}>{m.title}</div>
              <p style={s.cardDesc}>{m.desc}</p>
            </div>
          ))}
        </div>
        <div style={s.footer}>City staff can log in from the top-right corner.</div>
      </div>
    </div>
  )
}

export default Landing
