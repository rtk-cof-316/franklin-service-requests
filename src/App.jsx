import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import SubmitForm from './SubmitForm'
import CaseTracker from './CaseTracker'
import Login from './Login'
import AdminDashboard from './AdminDashboard'
import CaseDetail from './CaseDetail'
import DepartmentDashboard from './DepartmentDashboard'

function App() {
  const [page, setPage] = useState('submit')
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userDepartmentId, setUserDepartmentId] = useState(null)
  const [viewingCaseId, setViewingCaseId] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadUserProfile(session.user.id)
      else {
        setUserRole(null)
        setUserDepartmentId(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(userId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, department_id')
      .eq('user_id', userId)
      .single()
    if (data) {
      setUserRole(data.role)
      setUserDepartmentId(data.department_id)
      if (data.role === 'admin') setPage('admin')
      else if (data.role === 'department') setPage('department')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPage('submit')
    setUserRole(null)
    setUserDepartmentId(null)
    setViewingCaseId(null)
  }

  function handleViewCase(caseId) {
    setPreviousPage(page)
    setViewingCaseId(caseId)
    setPage('case-detail')
  }

  function handleBack() {
    setViewingCaseId(null)
    setPage(previousPage || 'admin')
    setRefreshKey(prev => prev + 1)
  }

  const navBtn = (target, label) => (
    <button
      onClick={() => setPage(target)}
      style={{
        background: 'none',
        border: 'none',
        color: (page === target || (target === 'admin' && page === 'case-detail' && previousPage === 'admin') || (target === 'department' && page === 'case-detail' && previousPage === 'department')) ? '#ffffff' : '#93afd4',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ backgroundColor: '#0f3d7a', padding: '10px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        {navBtn('submit', 'Submit a Request')}
        {navBtn('track', 'Check Status')}
        {session && userRole === 'admin' && navBtn('admin', 'Admin')}
        {session && userRole === 'department' && navBtn('department', 'My Cases')}
        <div style={{ marginLeft: 'auto' }}>
          {session ? (
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}
            >
              Log Out
            </button>
          ) : (
            <button
              onClick={() => setPage('login')}
              style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}
            >
              Staff Login
            </button>
          )}
        </div>
      </div>

      {page === 'submit' && <SubmitForm />}
      {page === 'track' && <CaseTracker />}
      {page === 'login' && !session && <Login />}
      {page === 'admin' && session && userRole === 'admin' && (
        <AdminDashboard onViewCase={handleViewCase} refreshKey={refreshKey} />
      )}
      {page === 'department' && session && userRole === 'department' && (
        <DepartmentDashboard
          departmentId={userDepartmentId}
          onViewCase={handleViewCase}
          refreshKey={refreshKey}
        />
      )}
      {page === 'case-detail' && session && viewingCaseId && (
        <CaseDetail
          caseId={viewingCaseId}
          onBack={handleBack}
          userEmail={session.user.email}
          userRole={userRole}
        />
      )}
      <div style={{ backgroundColor: '#0f3d7a', padding: '16px 24px', textAlign: 'center', fontSize: '13px', color: '#93afd4', marginTop: 'auto' }}>
  Please email{' '}
  <a href="mailto:bdemers@franklinnh.gov" style={{ color: '#ffffff', fontWeight: '600' }}>
    bdemers@franklinnh.gov
  </a>
  {' '}if you have any issues with this site.
</div>
    </div>
  )
}

export default App
