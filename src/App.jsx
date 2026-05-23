import { useState } from 'react'
import SubmitForm from './SubmitForm'
import CaseTracker from './CaseTracker'

function App() {
  const [page, setPage] = useState('submit')

  return (
    <div>
      <div style={{ backgroundColor: '#0f3d7a', padding: '10px 24px', display: 'flex', gap: '16px' }}>
        <button
          onClick={() => setPage('submit')}
          style={{ background: 'none', border: 'none', color: page === 'submit' ? '#ffffff' : '#93afd4', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          Submit a Request
        </button>
        <button
          onClick={() => setPage('track')}
          style={{ background: 'none', border: 'none', color: page === 'track' ? '#ffffff' : '#93afd4', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          Check Status
        </button>
      </div>
      {page === 'submit' ? <SubmitForm /> : <CaseTracker />}
    </div>
  )
}

export default App