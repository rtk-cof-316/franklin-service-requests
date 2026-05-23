import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import SubmitForm from './SubmitForm'
import CaseTracker from './CaseTracker'
import Login from './Login'
import AdminDashboard from './AdminDashboard'
import CaseDetail from './CaseDetail'

function App() {
  const [page, setPage] = useState('submit')
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [viewingCaseId, setViewingCaseId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserRole(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadUserRole(session.user.id)
      else setUserRole(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserRole(userId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    if (data) {
      setUserRole(data.role)
      if (data.role === 'admin') setPage('admin')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPage('submit')
    setUserRole(null)
    setViewingCaseId(null)
  }

  function handleViewCase(caseId) {
    setViewingCaseId(caseId)
    setPage('case-detail')
  }

  function handleBackToDashboard() {
    setViewingCaseId(null)
    setPage('admin')
  }

  return (
    <div>
      <div style={{ backgroundColor: '#0f3d7a', padding: '10px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button onClick={() => setPage('submit')} style={{ background: 'none', border: 'none', color: page === 'submit' ? '#ffffff' : '#93afd4', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
          Submit a Request
        </button>
        <button onClick={() => setPage('track')} style={{ background: 'none', border: 'none', color: page === 'track' ? '#ffffff' : '#93afd4', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
          Check Status
        </button>
        {session && userRole === 'admin' && (
          <button onClick={() => setPage('admin')} style={{ background: 'none', border: 'none', color: page === 'admin' || page === 'case-detail' ? '#ffffff' : '#93afd4', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            Admin
          </button>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {session ? (
            <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
              Log Out
            </button>
          ) : (
            <button onClick={() => setPage('login')} style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
              Staff Login
            </button>
          )}
        </div>
      </div>
      {page === 'submit' && <SubmitForm />}
      {page === 'track' && <CaseTracker />}
      {page === 'login' && !session && <Login />}
      {page === 'admin' && session && userRole === 'admin' && <AdminDashboard onViewCase={handleViewCase} />}
      {page === 'case-detail' && session && viewingCaseId && (
        <CaseDetail
          caseId={viewingCaseId}
          onBack={handleBackToDashboard}
          userEmail={session.user.email}
        />
      )}
    </div>
  )
}

export default App