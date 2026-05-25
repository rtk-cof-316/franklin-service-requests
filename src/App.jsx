import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import SubmitForm from './SubmitForm'
import CaseTracker from './CaseTracker'
import Login from './Login'
import AdminDashboard from './AdminDashboard'
import CaseDetail from './CaseDetail'
import DepartmentDashboard from './DepartmentDashboard'
import PrintWorkOrder from './PrintWorkOrder'
import PrintCaseDetail from './PrintCaseDetail'
import PrintMultipleWorkOrders from './PrintMultipleWorkOrders'
import RoadWatch from './RoadWatch'
import PublicAnalytics from './PublicAnalytics'

function App() {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('page') || 'submit'
  })
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userDepartmentId, setUserDepartmentId] = useState(null)
  const [viewingCaseId, setViewingCaseId] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [bulkPrintIds, setBulkPrintIds] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadUserProfile(session.user.id)
      else { setUserRole(null); setUserDepartmentId(null) }
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

  function handlePrintWorkOrder(caseId) {
    setViewingCaseId(caseId)
    setPage('print-work-order')
  }

  function handlePrintCaseDetail(caseId) {
    setViewingCaseId(caseId)
    setPage('print-case-detail')
  }

  function handleBulkPrint(ids) {
    setBulkPrintIds(ids)
    setPage('print-bulk-work-orders')
  }

  const showNav = !['print-work-order', 'print-case-detail', 'print-bulk-work-orders'].includes(page)

  const navBtn = (target, label) => (
    <button
      onClick={() => setPage(target)}
      style={{
        background: 'none',
        border: 'none',
        color: (page === target ||
          (target === 'admin' && ['case-detail', 'print-work-order', 'print-case-detail'].includes(page) && previousPage === 'admin') ||
          (target === 'department' && ['case-detail', 'print-work-order'].includes(page) && previousPage === 'department')
        ) ? '#ffffff' : '#93afd4',
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
      {showNav && (
        <div style={{ backgroundColor: '#0f3d7a', padding: '10px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {navBtn('submit', 'Submit a Request')}
          {navBtn('track', 'Check Status')}
          {navBtn('roads', 'Road Watch')}
          {navBtn('analytics', 'City Analytics')}
          {session && userRole === 'admin' && navBtn('admin', 'Admin')}
          {session && userRole === 'department' && navBtn('department', 'My Cases')}
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
      )}

      {page === 'submit' && <SubmitForm />}
      {page === 'track' && <CaseTracker />}
      {page === 'roads' && <RoadWatch />}
      {page === 'analytics' && <PublicAnalytics />}
      {page === 'login' && !session && <Login />}
      {page === 'admin' && session && userRole === 'admin' && (
        <AdminDashboard onViewCase={handleViewCase} refreshKey={refreshKey} />
      )}
      {page === 'department' && session && userRole === 'department' && (
        <DepartmentDashboard
          departmentId={userDepartmentId}
          onViewCase={handleViewCase}
          refreshKey={refreshKey}
          onBulkPrint={handleBulkPrint}
        />
      )}
      {page === 'case-detail' && session && viewingCaseId && (
        <CaseDetail
          caseId={viewingCaseId}
          onBack={handleBack}
          userEmail={session.user.email}
          userRole={userRole}
          userDepartmentId={userDepartmentId}
          onPrintWorkOrder={handlePrintWorkOrder}
          onPrintCaseDetail={handlePrintCaseDetail}
        />
      )}
      {page === 'print-work-order' && session && viewingCaseId && (
        <PrintWorkOrder caseId={viewingCaseId} onClose={() => setPage('case-detail')} />
      )}
      {page === 'print-case-detail' && session && viewingCaseId && (
        <PrintCaseDetail caseId={viewingCaseId} onClose={() => setPage('case-detail')} />
      )}
      {page === 'print-bulk-work-orders' && session && bulkPrintIds.length > 0 && (
        <PrintMultipleWorkOrders caseIds={bulkPrintIds} onClose={() => setPage('department')} />
      )}

      {showNav && (
        <div style={{ backgroundColor: '#0f3d7a', padding: '16px 24px', textAlign: 'center', fontSize: '13px', color: '#93afd4' }}>
          Please email{' '}
          <a href="mailto:bdemers@franklinnh.gov" style={{ color: '#ffffff', fontWeight: '600' }}>
            bdemers@franklinnh.gov
          </a>
          {' '}if you have any issues with this site.
        </div>
      )}
    </div>
  )
}

export default App
