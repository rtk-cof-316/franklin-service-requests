import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Landing from './Landing'
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
import PublicInput from './PublicInput'
import PublicInputTopic from './PublicInputTopic'
import PrintPublicInputTopic from './PrintPublicInputTopic'
import PublicInputSubmit from './PublicInputSubmit'
import AdminTopics from './AdminTopics'
import AdminModeration from './AdminModeration'
import AdminDepartmentView from './AdminDepartmentView'
import MouSubmit from './MouSubmit'
import MouStatus from './MouStatus'
import AdminMouSubmissions from './AdminMouSubmissions'
import MouSubmissionDetail from './MouSubmissionDetail'
import AdminMouTemplates from './AdminMouTemplates'
import PrintMouAgreement from './PrintMouAgreement'
import { carAdminRole } from './carConfig'
import CarSubmit from './CarSubmit'
import CarStatus from './CarStatus'
import AdminCarSubmissions from './AdminCarSubmissions'
import AdminCarCreate from './AdminCarCreate'
import CarSubmissionDetail from './CarSubmissionDetail'
import AdminCarCycles from './AdminCarCycles'
import CarCycleDetail from './CarCycleDetail'
import CarBatchReview from './CarBatchReview'
import PrintCarAgenda from './PrintCarAgenda'
import PrintCarPacket from './PrintCarPacket'

function App() {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('page') || 'landing'
  })
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userDepartmentId, setUserDepartmentId] = useState(null)
  const [viewingCaseId, setViewingCaseId] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [bulkPrintIds, setBulkPrintIds] = useState([])
  const [viewingTopicId, setViewingTopicId] = useState(null)
  const [viewingMouSubmissionId, setViewingMouSubmissionId] = useState(null)
  const [viewingCarSubmissionId, setViewingCarSubmissionId] = useState(null)
  const [viewingCarCycleId, setViewingCarCycleId] = useState(null)
  const [viewingCarWorkSessionId, setViewingCarWorkSessionId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUserProfile(session.user.id, true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        // Only redirect to dashboard on actual sign in, not on token refresh or tab focus
        loadUserProfile(session.user.id, _event === 'SIGNED_IN')
      } else {
        setUserRole(null)
        setUserDepartmentId(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Auto logout after 5 minutes of inactivity
  useEffect(() => {
    if (!session) return

    let timer

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await supabase.auth.signOut()
        setPage('landing')
        setUserRole(null)
        setUserDepartmentId(null)
        setViewingCaseId(null)
      }, 10 * 60 * 1000)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [session])

  async function loadUserProfile(userId, shouldRedirect = false) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, department_id')
      .eq('user_id', userId)
      .single()
    if (data) {
      setUserRole(data.role)
      setUserDepartmentId(data.department_id)
      // Only redirect to dashboard if explicitly told to AND user is on login page or submit page
      if (shouldRedirect) {
        setPage(prev => {
          if (prev === 'login' || prev === 'landing' || prev === 'submit' || prev === 'track' || prev === 'roads' || prev === 'analytics') {
            if (data.role === 'admin') return 'admin'
            if (data.role === 'department') return 'department'
          }
          return prev
        })
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setPage('landing')
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

  function handleViewTopic(topicId) {
    setViewingTopicId(topicId)
    setPage('public-input-detail')
  }

  function handleSubmitTopic(topicId) {
    setViewingTopicId(topicId)
    setPage('public-input-submit')
  }

  function handleBackFromPublicInput() {
    setViewingTopicId(null)
    setPage('public-input')
  }

  function handlePrintPublicInputTopic(topicId) {
    setViewingTopicId(topicId)
    setPage('print-public-input-analysis')
  }

  function handleViewMouSubmission(submissionId) {
    setViewingMouSubmissionId(submissionId)
    setPage('mou-detail')
  }

  function handlePrintMouAgreement(submissionId) {
    setViewingMouSubmissionId(submissionId)
    setPage('print-mou-agreement')
  }

  function handleViewCarSubmission(submissionId) {
    setViewingCarSubmissionId(submissionId)
    setPage('car-submission-detail')
  }

  function handleViewCarCycle(cycleId) {
    setViewingCarCycleId(cycleId)
    setPage('car-cycle-detail')
  }

  function handleBatchReviewCarCycle(cycleId) {
    setViewingCarCycleId(cycleId)
    setPage('car-batch-review')
  }

  function handlePrintCarAgenda(cycleId, workSessionId) {
    setViewingCarCycleId(cycleId)
    setViewingCarWorkSessionId(workSessionId || null)
    setPage('print-car-agenda')
  }

  function handlePrintCarPacket(cycleId) {
    setViewingCarCycleId(cycleId)
    setPage('print-car-packet')
  }

  const isCarAdmin = !!carAdminRole(session?.user?.email)

  const showNav = !['print-work-order', 'print-case-detail', 'print-bulk-work-orders', 'print-public-input-analysis', 'print-mou-agreement', 'print-car-agenda', 'print-car-packet'].includes(page)

  const navBtn = (target, label) => (
    <button
      onClick={() => setPage(target)}
      style={{
        background: 'none',
        border: 'none',
        color: (page === target ||
          (target === 'admin' && ['case-detail', 'print-work-order', 'print-case-detail'].includes(page) && previousPage === 'admin') ||
          (target === 'admin-department-view' && ['case-detail', 'print-work-order', 'print-case-detail'].includes(page) && previousPage === 'admin-department-view') ||
          (target === 'department' && ['case-detail', 'print-work-order'].includes(page) && previousPage === 'department') ||
          (target === 'admin-public-topics' && page === 'admin-public-moderation') ||
          (target === 'public-input' && ['public-input-detail', 'public-input-submit'].includes(page))
        ) ? '#ffffff' : '#93afd4',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
      }}
    >
      {label}
    </button>
  )

  const showStaffRow = session && (userRole === 'admin' || userRole === 'department' || isCarAdmin)

  return (
    <div>
      {showNav && (
        <div style={{ backgroundColor: '#0f3d7a', padding: '10px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {navBtn('landing', 'Home')}
          {navBtn('submit', 'Submit a Request')}
          {navBtn('track', 'Check Status')}
          {navBtn('roads', 'Road Watch')}
          {navBtn('analytics', 'City Analytics')}
          {navBtn('public-input', 'Public Comment')}
          {navBtn('mou-submit', 'Submit an MOU')}
          {navBtn('mou-status', 'Check MOU Status')}
          {navBtn('car-submit', 'Submit a CAR')}
          {navBtn('car-status', 'Check CAR Status')}
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

      {showNav && showStaffRow && (
        <div style={{ backgroundColor: '#08213f', padding: '8px 24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #1a56a0' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#5b7fad', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Tools</span>
          {userRole === 'admin' && navBtn('admin', 'Admin')}
          {userRole === 'admin' && navBtn('admin-department-view', 'Departments')}
          {userRole === 'admin' && navBtn('admin-public-topics', 'Public Comments')}
          {userRole === 'admin' && navBtn('admin-mou-submissions', 'MOUs')}
          {isCarAdmin && navBtn('admin-car', 'CARs')}
          {userRole === 'department' && navBtn('department', 'My Cases')}
        </div>
      )}

      {page === 'landing' && <Landing onNavigate={setPage} />}
      {page === 'submit' && <SubmitForm />}
      {page === 'track' && <CaseTracker />}
      {page === 'roads' && <RoadWatch />}
      {page === 'analytics' && <PublicAnalytics />}
      {page === 'public-input' && (
        <PublicInput onViewTopic={handleViewTopic} onSubmitTopic={handleSubmitTopic} />
      )}
      {page === 'public-input-detail' && viewingTopicId && (
        <PublicInputTopic
          topicId={viewingTopicId}
          onBack={handleBackFromPublicInput}
          onSubmit={handleSubmitTopic}
          onPrint={handlePrintPublicInputTopic}
        />
      )}
      {page === 'print-public-input-analysis' && viewingTopicId && (
        <PrintPublicInputTopic topicId={viewingTopicId} onClose={() => setPage('public-input-detail')} />
      )}
      {page === 'public-input-submit' && viewingTopicId && (
        <PublicInputSubmit
          topicId={viewingTopicId}
          onBack={() => setPage('public-input-detail')}
          onSubmitted={() => setPage('public-input-detail')}
        />
      )}
      {page === 'mou-submit' && <MouSubmit />}
      {page === 'mou-status' && <MouStatus />}
      {page === 'admin-mou-submissions' && session && userRole === 'admin' && (
        <AdminMouSubmissions onViewSubmission={handleViewMouSubmission} onEditTemplate={() => setPage('admin-mou-templates')} />
      )}
      {page === 'admin-mou-templates' && session && userRole === 'admin' && <AdminMouTemplates />}
      {page === 'mou-detail' && session && viewingMouSubmissionId && (
        <MouSubmissionDetail
          submissionId={viewingMouSubmissionId}
          userEmail={session.user.email}
          onBack={() => setPage('admin-mou-submissions')}
          onPrint={handlePrintMouAgreement}
        />
      )}
      {page === 'print-mou-agreement' && session && viewingMouSubmissionId && (
        <PrintMouAgreement submissionId={viewingMouSubmissionId} onClose={() => setPage('mou-detail')} />
      )}
      {page === 'car-submit' && <CarSubmit />}
      {page === 'car-status' && <CarStatus />}
      {page === 'admin-car' && session && isCarAdmin && (
        <AdminCarSubmissions onViewSubmission={handleViewCarSubmission} onManageCycles={() => setPage('admin-car-cycles')} onCreateCar={() => setPage('admin-car-create')} />
      )}
      {page === 'admin-car-create' && session && isCarAdmin && (
        <AdminCarCreate
          userEmail={session.user.email}
          onBack={() => setPage('admin-car')}
          onViewSubmission={handleViewCarSubmission}
          onGoToBatchReview={handleBatchReviewCarCycle}
        />
      )}
      {page === 'admin-car-cycles' && session && isCarAdmin && (
        <AdminCarCycles onViewCycle={handleViewCarCycle} onBack={() => setPage('admin-car')} />
      )}
      {page === 'car-cycle-detail' && session && isCarAdmin && viewingCarCycleId && (
        <CarCycleDetail
          cycleId={viewingCarCycleId}
          onBack={() => setPage('admin-car-cycles')}
          onBatchReview={handleBatchReviewCarCycle}
          onPrintAgenda={handlePrintCarAgenda}
          onPrintWorkSessionAgenda={handlePrintCarAgenda}
          onPrintPacket={handlePrintCarPacket}
        />
      )}
      {page === 'car-batch-review' && session && isCarAdmin && viewingCarCycleId && (
        <CarBatchReview cycleId={viewingCarCycleId} userEmail={session.user.email} onBack={() => setPage('car-cycle-detail')} />
      )}
      {page === 'car-submission-detail' && session && isCarAdmin && viewingCarSubmissionId && (
        <CarSubmissionDetail submissionId={viewingCarSubmissionId} userEmail={session.user.email} onBack={() => setPage('admin-car')} />
      )}
      {page === 'print-car-agenda' && session && isCarAdmin && viewingCarCycleId && (
        <PrintCarAgenda cycleId={viewingCarCycleId} workSessionId={viewingCarWorkSessionId} onClose={() => setPage('car-cycle-detail')} />
      )}
      {page === 'print-car-packet' && session && isCarAdmin && viewingCarCycleId && (
        <PrintCarPacket cycleId={viewingCarCycleId} onClose={() => setPage('car-cycle-detail')} />
      )}
      {page === 'login' && !session && <Login />}
      {page === 'admin' && session && userRole === 'admin' && (
        <AdminDashboard onViewCase={handleViewCase} refreshKey={refreshKey} />
      )}
      {page === 'admin-department-view' && session && userRole === 'admin' && (
        <AdminDepartmentView onViewCase={handleViewCase} refreshKey={refreshKey} onBulkPrint={handleBulkPrint} />
      )}
      {page === 'admin-public-topics' && session && userRole === 'admin' && <AdminTopics />}
      {page === 'admin-public-moderation' && session && userRole === 'admin' && <AdminModeration />}
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
