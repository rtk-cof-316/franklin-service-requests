import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '32px 24px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  topBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '20px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1a56a0',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  printBtn: {
    padding: '6px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #1a56a0',
    color: '#1a56a0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  exportBtn: {
    padding: '6px 14px',
    backgroundColor: '#1a56a0',
    border: 'none',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
    alignItems: 'start',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  cardHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#6b7280',
  },
  cardBody: {
    padding: '20px',
  },
  caseNumberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  caseNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a56a0',
  },
  tag91a: {
    backgroundColor: '#eff6ff',
    color: '#1a56a0',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  fieldRow: {
    marginBottom: '14px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#9ca3af',
    marginBottom: '3px',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#111827',
    lineHeight: '1.5',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #f3f4f6',
    margin: '14px 0',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block',
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#111827',
    outline: 'none',
    marginBottom: '10px',
    boxSizing: 'border-box',
  },
  inputHint: {
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '6px',
    marginTop: '-6px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  saveBtn: {
    width: '100%',
    padding: '9px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  saveBtnDisabled: {
    width: '100%',
    padding: '9px',
    backgroundColor: '#93afd4',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    marginBottom: '8px',
  },
  deptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  deptName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  deptStatus: {
    fontSize: '12px',
    color: '#6b7280',
  },
  addDeptRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  addBtn: {
    padding: '7px 14px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  noteBox: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '10px',
  },
  noteMeta: {
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  noteText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.5',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#111827',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '8px',
  },
  successMsg: {
    fontSize: '12px',
    color: '#065f46',
    backgroundColor: '#d1fae5',
    padding: '6px 10px',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  loading: {
    padding: '60px',
    textAlign: 'center',
    color: '#6b7280',
  },
  submitterInfo: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.8',
  },
  auditRow: {
    display: 'flex',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
    alignItems: 'flex-start',
  },
  auditDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#1a56a0',
    marginTop: '5px',
    flexShrink: 0,
  },
  auditAction: {
    fontSize: '13px',
    color: '#374151',
    flex: 1,
    lineHeight: '1.4',
  },
  auditMeta: {
    fontSize: '11px',
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    marginLeft: '8px',
  },
  rtkHeader: {
    backgroundColor: '#eff6ff',
    borderBottom: '1px solid #bfdbfe',
  },
  rtkTitle: {
    color: '#1a56a0',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '13px',
    color: '#374151',
  },
  sectionDivider: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#1a56a0',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '6px',
    marginBottom: '12px',
    marginTop: '16px',
  },
}

function getStatusStyle(name) {
  const s = (name || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return { ...styles.statusBadge, backgroundColor: '#d1fae5', color: '#065f46' }
  if (s === 'in progress' || s === 'assigned' || s === 'scheduled' || s === 'gathering records' || s === 'reviewing records') return { ...styles.statusBadge, backgroundColor: '#dbeafe', color: '#1e40af' }
  if (s === 'lacks resources to resolve' || s === 'unfounded' || s === 'request abandoned') return { ...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b' }
  if (s === 'clarification needed' || s === 'records ready - please schedule pick up') return { ...styles.statusBadge, backgroundColor: '#fef3c7', color: '#92400e' }
  return { ...styles.statusBadge, backgroundColor: '#f3f4f6', color: '#374151' }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

async function logAudit(caseId, action, performedBy) {
  await supabase.from('case_audit_log').insert([{
    case_id: caseId,
    action,
    performed_by: performedBy,
    created_at: new Date().toISOString(),
  }])
}

const DELIVERY_METHODS = ['City USB', 'Self USB', 'In Person Viewing', 'Print', 'Mailed', 'Hold for Pick Up']
const APPOINTMENT_METHODS = ['City USB', 'Self USB', 'In Person Viewing', 'Print']

function CaseDetail({ caseId, onBack, userEmail, userRole, userDepartmentId, onPrintWorkOrder, onPrintCaseDetail }) {
  const [caseData, setCaseData] = useState(null)
  const [allStatuses, setAllStatuses] = useState([])
  const [issueTypes, setIssueTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [requestTopics, setRequestTopics] = useState([])
  const [notes, setNotes] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [is91a, setIs91a] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [myDeptAssignment, setMyDeptAssignment] = useState(null)
  const [deptSelectedStatus, setDeptSelectedStatus] = useState('')
  const [savingDeptStatus, setSavingDeptStatus] = useState(false)
  const [deptSaveSuccess, setDeptSaveSuccess] = useState(false)

  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [selectedDept, setSelectedDept] = useState('')
  const [addingDept, setAddingDept] = useState(false)

  const [rtkData, setRtkData] = useState(null)
  const [rtkFields, setRtkFields] = useState({
    acknowledged_date: '',
    request_topic: '',
    number_of_records: '',
    hours_worked: '',
    hours_worked_closed: '',
    fees_assessed: '',
    fees_collected: '',
    date_records_ready: '',
    date_requestor_notified: '',
    appointment_datetime: '',
    delivery_method: '',
    mailed: false,
    tracking_number: '',
    hold_for_pickup: false,
    public_records_url: '',
    tax_dollar_spent: '',
  })
  const [savingRtk, setSavingRtk] = useState(false)
  const [rtkSuccess, setRtkSuccess] = useState(false)

  const isAdmin = userRole === 'admin'

  useEffect(() => {
    loadAll()
  }, [caseId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCase(), loadStatuses(), loadIssueTypes(), loadDepartments(), loadRequestTopics(), loadNotes(), loadAuditLog()])
    setLoading(false)
  }

  async function loadCase() {
    const { data } = await supabase
      .from('cases')
      .select(`
        *,
        statuses ( id, name ),
        issue_types ( id, name ),
        case_departments (
          id,
          department_id,
          departments ( name ),
          statuses ( id, name )
        )
      `)
      .eq('id', caseId)
      .single()
    if (data) {
      setCaseData(data)
      setSelectedStatus(data.statuses?.id || '')
      setSelectedIssueType(data.issue_types?.id || '')
      setFollowupDate(data.followup_due_date ? data.followup_due_date.slice(0, 10) : '')
      setIs91a(data.is_91a || false)
      if (data.is_91a) loadRtkData()
      if (userRole === 'department' && userDepartmentId) {
        const myAssignment = data.case_departments?.find(cd => cd.department_id === userDepartmentId)
        if (myAssignment) {
          setMyDeptAssignment(myAssignment)
          setDeptSelectedStatus(myAssignment.statuses?.id || '')
        }
      }
    }
  }

  async function loadRtkData() {
    const { data } = await supabase
      .from('details_91a')
      .select('*')
      .eq('case_id', caseId)
      .single()
    if (data) {
      setRtkData(data)
      setRtkFields({
        acknowledged_date: data.acknowledged_date ? data.acknowledged_date.slice(0, 10) : '',
        request_topic: data.request_topic || '',
        number_of_records: data.number_of_records != null ? data.number_of_records.toString() : '',
        hours_worked: data.hours_worked != null ? data.hours_worked.toString() : '',
        hours_worked_closed: data.hours_worked_closed != null ? data.hours_worked_closed.toString() : '',
        fees_assessed: data.fees_assessed != null ? data.fees_assessed.toString() : '',
        fees_collected: data.fees_collected != null ? data.fees_collected.toString() : '',
        date_records_ready: data.date_records_ready ? data.date_records_ready.slice(0, 10) : '',
        date_requestor_notified: data.date_requestor_notified ? data.date_requestor_notified.slice(0, 10) : '',
        appointment_datetime: data.appointment_datetime ? data.appointment_datetime.slice(0, 16) : '',
        delivery_method: data.delivery_method || '',
        mailed: data.mailed || false,
        tracking_number: data.tracking_number || '',
        hold_for_pickup: data.hold_for_pickup || false,
        public_records_url: data.public_records_url || '',
        tax_dollar_spent: data.tax_dollar_spent != null ? data.tax_dollar_spent.toString() : '',
      })
    }
  }

  async function loadStatuses() {
    const { data } = await supabase.from('statuses').select('*').order('name')
    setAllStatuses(data || [])
  }

  async function loadIssueTypes() {
    const { data } = await supabase.from('issue_types').select('*').order('name')
    setIssueTypes(data || [])
  }

  async function loadDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data || [])
  }

  async function loadRequestTopics() {
    const { data } = await supabase.from('request_topics').select('*').order('name')
    setRequestTopics(data || [])
  }

  async function loadNotes() {
    const { data } = await supabase
      .from('internal_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    setNotes(data || [])
  }

  async function loadAuditLog() {
    const { data } = await supabase
      .from('case_audit_log')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
    setAuditLog(data || [])
  }

  const adminStatuses = allStatuses
  const deptStatuses = allStatuses.filter(s => !s.is_91a_only)

  async function handleSaveCase() {
    setSaving(true)
    setSaveSuccess(false)
    const oldStatus = caseData.statuses?.name
    const newStatus = allStatuses.find(s => s.id === parseInt(selectedStatus))?.name
    const oldFollowup = caseData.followup_due_date ? caseData.followup_due_date.slice(0, 10) : ''
    const oldIssueType = caseData.issue_types?.name
    const newIssueType = issueTypes.find(t => t.id === parseInt(selectedIssueType))?.name
    const old91a = caseData.is_91a

    const { error } = await supabase
      .from('cases')
      .update({
        status_id: selectedStatus || null,
        issue_type_id: selectedIssueType || null,
        followup_due_date: followupDate || null,
        is_91a: is91a,
      })
      .eq('id', caseId)
      .select()

    if (!error) {
      if (newStatus && newStatus !== oldStatus) {
        await logAudit(caseId, `Status changed from "${oldStatus || 'none'}" to "${newStatus}"`, userEmail)
      }
      if (newIssueType && newIssueType !== oldIssueType) {
        await logAudit(caseId, `Issue type changed from "${oldIssueType || 'none'}" to "${newIssueType}"`, userEmail)
      }
      if (followupDate !== oldFollowup) {
        if (followupDate) {
          await logAudit(caseId, `Follow-up due date set to ${followupDate}`, userEmail)
        } else {
          await logAudit(caseId, `Follow-up due date cleared`, userEmail)
        }
      }
      if (is91a !== old91a) {
        if (is91a) {
          await supabase.from('details_91a').insert([{ case_id: caseId }])
          await logAudit(caseId, `Case converted to 91-A Right-to-Know request`, userEmail)
        } else {
          await logAudit(caseId, `91-A flag removed from case`, userEmail)
        }
      }
      setSaveSuccess(true)
      await loadCase()
      await loadAuditLog()
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
  }

  async function handleSaveDeptStatus() {
    if (!myDeptAssignment) return
    setSavingDeptStatus(true)
    setDeptSaveSuccess(false)
    const oldStatus = myDeptAssignment.statuses?.name
    const newStatus = allStatuses.find(s => s.id === parseInt(deptSelectedStatus))?.name

    const { error } = await supabase
      .from('case_departments')
      .update({ status_id: parseInt(deptSelectedStatus) })
      .eq('id', myDeptAssignment.id)
      .select()

    if (!error) {
      if (newStatus && newStatus !== oldStatus) {
        await logAudit(caseId, `${myDeptAssignment.departments?.name} updated their status from "${oldStatus || 'none'}" to "${newStatus}"`, userEmail)
      }
      setDeptSaveSuccess(true)
      await loadCase()
      await loadAuditLog()
      setTimeout(() => setDeptSaveSuccess(false), 3000)
    }
    setSavingDeptStatus(false)
  }

  async function handleSaveRtk() {
    setSavingRtk(true)
    setRtkSuccess(false)

    const { error } = await supabase
      .from('details_91a')
      .update({
        acknowledged_date: rtkFields.acknowledged_date || null,
        request_topic: rtkFields.request_topic || null,
        number_of_records: rtkFields.number_of_records !== '' ? parseInt(rtkFields.number_of_records) : null,
        hours_worked: rtkFields.hours_worked !== '' ? parseFloat(rtkFields.hours_worked) : null,
        hours_worked_closed: rtkFields.hours_worked_closed !== '' ? parseFloat(rtkFields.hours_worked_closed) : null,
        fees_assessed: rtkFields.fees_assessed !== '' ? parseFloat(rtkFields.fees_assessed) : null,
        fees_collected: rtkFields.fees_collected !== '' ? parseFloat(rtkFields.fees_collected) : null,
        date_records_ready: rtkFields.date_records_ready || null,
        date_requestor_notified: rtkFields.date_requestor_notified || null,
        appointment_datetime: rtkFields.appointment_datetime || null,
        delivery_method: rtkFields.delivery_method || null,
        mailed: rtkFields.mailed,
        tracking_number: rtkFields.tracking_number || null,
        hold_for_pickup: rtkFields.hold_for_pickup,
        public_records_url: rtkFields.public_records_url || null,
        tax_dollar_spent: rtkFields.tax_dollar_spent !== '' ? parseFloat(rtkFields.tax_dollar_spent) : null,
      })
      .eq('case_id', caseId)
      .select()

    if (!error) {
      const changes = []
      const oldAck = rtkData?.acknowledged_date?.slice(0, 10) || ''
      const oldTopic = rtkData?.request_topic || ''
      const oldRecords = rtkData?.number_of_records != null ? rtkData.number_of_records.toString() : ''
      const oldHours = rtkData?.hours_worked != null ? rtkData.hours_worked.toString() : ''
      const oldHoursClosed = rtkData?.hours_worked_closed != null ? rtkData.hours_worked_closed.toString() : ''
      const oldFeeAssessed = rtkData?.fees_assessed != null ? rtkData.fees_assessed.toString() : ''
      const oldFeeCollected = rtkData?.fees_collected != null ? rtkData.fees_collected.toString() : ''
      const oldDelivery = rtkData?.delivery_method || ''
      const oldTracking = rtkData?.tracking_number || ''
      const oldRecordsReady = rtkData?.date_records_ready?.slice(0, 10) || ''
      const oldNotified = rtkData?.date_requestor_notified?.slice(0, 10) || ''
      const oldAppt = rtkData?.appointment_datetime?.slice(0, 16) || ''
      const oldUrl = rtkData?.public_records_url || ''

      if (rtkFields.acknowledged_date !== oldAck) changes.push('Acknowledged date updated')
      if (rtkFields.request_topic !== oldTopic) changes.push(`Request topic set to "${rtkFields.request_topic}"`)
      if (rtkFields.number_of_records !== oldRecords) changes.push('Number of records updated')
      if (rtkFields.hours_worked !== oldHours) changes.push('Hours worked updated')
      if (rtkFields.hours_worked_closed !== oldHoursClosed) changes.push('Hours worked (final) updated')
      if (rtkFields.fees_assessed !== oldFeeAssessed) changes.push('Fees assessed updated')
      if (rtkFields.fees_collected !== oldFeeCollected) changes.push('Fees collected updated')
      if (rtkFields.date_records_ready !== oldRecordsReady) changes.push('Date records ready updated')
      if (rtkFields.date_requestor_notified !== oldNotified) changes.push('Date requestor notified updated')
      if (rtkFields.appointment_datetime !== oldAppt) changes.push('Appointment date/time updated')
      if (rtkFields.delivery_method !== oldDelivery) changes.push(`Delivery method set to "${rtkFields.delivery_method}"`)
      if (rtkFields.tracking_number !== oldTracking) changes.push('Tracking number updated')
      if (rtkFields.public_records_url !== oldUrl) changes.push('Public records URL updated')

      const auditMessage = changes.length > 0
        ? `91-A details updated: ${changes.join(', ')}`
        : '91-A details saved (no changes)'

      await logAudit(caseId, auditMessage, userEmail)
      setRtkSuccess(true)
      await loadRtkData()
      await loadAuditLog()
      setTimeout(() => setRtkSuccess(false), 3000)
    }
    setSavingRtk(false)
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    await supabase.from('internal_notes').insert([{
      case_id: caseId,
      note: newNote.trim(),
      created_by: userEmail,
      created_at: new Date().toISOString(),
    }])
    await logAudit(caseId, `Internal note added`, userEmail)
    setNewNote('')
    await loadNotes()
    await loadAuditLog()
    setSavingNote(false)
  }

  async function handleAddDept() {
    if (!selectedDept) return
    setAddingDept(true)
    const defaultStatus = allStatuses.find(s => s.name === 'Received')
    const deptName = departments.find(d => d.id === parseInt(selectedDept))?.name

    await supabase.from('case_departments').insert([{
      case_id: caseId,
      department_id: parseInt(selectedDept),
      status_id: defaultStatus?.id || allStatuses[0]?.id,
    }])
    await logAudit(caseId, `Assigned to ${deptName}`, userEmail)

    // Get all users in this department and their emails
try {
  console.log('Sending dept notification for dept:', parseInt(selectedDept))
  const response = await fetch(
    'https://sdibtkmmcegthmytmzvy.supabase.co/functions/v1/send-confirmation-email',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: 'department_assignment',
        departmentId: parseInt(selectedDept),
        caseNumber: caseData.case_number,
        location: caseData.location,
        description: caseData.description,
        departmentName: deptName,
      }),
    }
  )
  const result = await response.json()
  console.log('Email function response:', result)
} catch (e) {
  console.error('Email notification error:', e)
}
    
    setSelectedDept('')
    await loadCase()
    await loadAuditLog()
    setAddingDept(false)
  }

  if (loading) return <div style={styles.loading}>Loading case...</div>
  if (!caseData) return <div style={styles.loading}>Case not found.</div>

  const assignedDeptNames = caseData.case_departments?.map(cd => cd.departments?.name) || []
  const availableDepts = departments.filter(d => !assignedDeptNames.includes(d.name))
  const showAppointment = APPOINTMENT_METHODS.includes(rtkFields.delivery_method)

  return (
    <div style={styles.page}>

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={styles.printBtn} onClick={() => onPrintWorkOrder && onPrintWorkOrder(caseId)}>
            Print Work Order
          </button>
          {isAdmin && (
            <button style={styles.exportBtn} onClick={() => onPrintCaseDetail && onPrintCaseDetail(caseId)}>
              Export Full Case
            </button>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        <div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Case Details</span>
              <span style={getStatusStyle(caseData.statuses?.name)}>{caseData.statuses?.name || '—'}</span>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.caseNumberRow}>
                <span style={styles.caseNumber}>Case #{caseData.case_number}</span>
                {caseData.is_91a && <span style={styles.tag91a}>91-A</span>}
              </div>
              <div style={styles.fieldRow}>
                <div style={styles.fieldLabel}>Date Submitted</div>
                <div style={styles.fieldValue}>{formatDate(caseData.date_submitted)}</div>
              </div>
              <hr style={styles.divider} />
              <div style={styles.fieldRow}>
                <div style={styles.fieldLabel}>{caseData.is_91a ? 'Subject of Request' : 'Location / Address'}</div>
                <div style={styles.fieldValue}>{caseData.location || '—'}</div>
              </div>
              <hr style={styles.divider} />
              <div style={styles.fieldRow}>
                <div style={styles.fieldLabel}>Issue Type</div>
                <div style={styles.fieldValue}>{caseData.issue_types?.name || '—'}</div>
              </div>
              <hr style={styles.divider} />
              <div style={styles.fieldRow}>
                <div style={styles.fieldLabel}>Description</div>
                <div style={styles.fieldValue}>{caseData.description}</div>
              </div>
              {caseData.closed_date && (
                <>
                  <hr style={styles.divider} />
                  <div style={styles.fieldRow}>
                    <div style={styles.fieldLabel}>Date Closed</div>
                    <div style={styles.fieldValue}>{formatDate(caseData.closed_date)}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {caseData.is_91a && isAdmin && (
            <div style={styles.card}>
              <div style={{ ...styles.cardHeader, ...styles.rtkHeader }}>
                <span style={{ ...styles.cardTitle, ...styles.rtkTitle }}>Right-to-Know (RSA 91-A) Details</span>
                <span style={{ fontSize: '11px', color: '#1a56a0' }}>Admin only</span>
              </div>
              <div style={styles.cardBody}>
                {rtkSuccess && <div style={styles.successMsg}>91-A details saved successfully.</div>}

                <div style={styles.sectionDivider}>Request Info</div>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.fieldLabel}>Acknowledged Date</div>
                    <input type="date" style={styles.input} value={rtkFields.acknowledged_date}
                      onChange={e => setRtkFields(prev => ({ ...prev, acknowledged_date: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Request Topic</div>
                    <select style={styles.select} value={rtkFields.request_topic}
                      onChange={e => setRtkFields(prev => ({ ...prev, request_topic: e.target.value }))}>
                      <option value="">-- Select topic --</option>
                      {requestTopics.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.sectionDivider}>Records &amp; Hours</div>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.fieldLabel}>Number of Records</div>
                    <input type="number" style={styles.input} placeholder="0" value={rtkFields.number_of_records}
                      onChange={e => setRtkFields(prev => ({ ...prev, number_of_records: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Hours Worked (Running)</div>
                    <input type="number" step="0.5" style={styles.input} placeholder="0.0" value={rtkFields.hours_worked}
                      onChange={e => setRtkFields(prev => ({ ...prev, hours_worked: e.target.value }))} />
                  </div>
                </div>
                <div style={{ maxWidth: '50%', paddingRight: '5px' }}>
                  <div style={styles.fieldLabel}>Hours Worked (Final at Close)</div>
                  <input type="number" step="0.5" style={styles.input} placeholder="0.0" value={rtkFields.hours_worked_closed}
                    onChange={e => setRtkFields(prev => ({ ...prev, hours_worked_closed: e.target.value }))} />
                </div>

                <div style={styles.sectionDivider}>Fees</div>
<div style={styles.twoCol}>
  <div>
    <div style={styles.fieldLabel}>Fees Assessed ($)</div>
    <input type="number" step="0.01" style={styles.input} placeholder="0.00" value={rtkFields.fees_assessed}
      onChange={e => setRtkFields(prev => ({ ...prev, fees_assessed: e.target.value }))} />
  </div>
  <div>
    <div style={styles.fieldLabel}>Fees Collected ($)</div>
    <input type="number" step="0.01" style={styles.input} placeholder="0.00" value={rtkFields.fees_collected}
      onChange={e => setRtkFields(prev => ({ ...prev, fees_collected: e.target.value }))} />
  </div>
</div>
<div style={{ maxWidth: '50%', paddingRight: '5px' }}>
  <div style={styles.fieldLabel}>Tax Dollars Spent ($)</div>
  <div style={styles.inputHint}>Total cost to the city for fulfilling this request</div>
  <input type="number" step="0.01" style={styles.input} placeholder="0.00" value={rtkFields.tax_dollar_spent || ''}
    onChange={e => setRtkFields(prev => ({ ...prev, tax_dollar_spent: e.target.value }))} />
</div>

                <div style={styles.sectionDivider}>Fulfillment</div>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.fieldLabel}>Date Records Ready</div>
                    <input type="date" style={styles.input} value={rtkFields.date_records_ready}
                      onChange={e => setRtkFields(prev => ({ ...prev, date_records_ready: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Date Requestor Notified</div>
                    <input type="date" style={styles.input} value={rtkFields.date_requestor_notified}
                      onChange={e => setRtkFields(prev => ({ ...prev, date_requestor_notified: e.target.value }))} />
                  </div>
                </div>

                <div style={styles.fieldLabel}>Delivery Method</div>
                <select style={styles.select} value={rtkFields.delivery_method}
                  onChange={e => setRtkFields(prev => ({ ...prev, delivery_method: e.target.value, mailed: e.target.value === 'Mailed', hold_for_pickup: e.target.value === 'Hold for Pick Up' }))}>
                  <option value="">-- Select delivery method --</option>
                  {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                {showAppointment && (
                  <>
                    <div style={styles.fieldLabel}>Appointment Date &amp; Time</div>
                    <input type="datetime-local" style={styles.input} value={rtkFields.appointment_datetime}
                      onChange={e => setRtkFields(prev => ({ ...prev, appointment_datetime: e.target.value }))} />
                  </>
                )}

                {rtkFields.delivery_method === 'Mailed' && (
                  <>
                    <div style={styles.fieldLabel}>Tracking Number</div>
                    <input type="text" style={styles.input} placeholder="Enter tracking number" value={rtkFields.tracking_number}
                      onChange={e => setRtkFields(prev => ({ ...prev, tracking_number: e.target.value }))} />
                  </>
                )}

                <div style={styles.sectionDivider}>Public Records</div>
                <div style={styles.fieldLabel}>Public Records URL</div>
                <div style={styles.inputHint}>Paste a link here once records have been picked up and are ready for public viewing. This will appear in the public analytics dashboard.</div>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="https://drive.google.com/..."
                  value={rtkFields.public_records_url}
                  onChange={e => setRtkFields(prev => ({ ...prev, public_records_url: e.target.value }))}
                />

                <button style={savingRtk ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleSaveRtk} disabled={savingRtk}>
                  {savingRtk ? 'Saving...' : 'Save 91-A Details'}
                </button>
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Submitter Information</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Internal only</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.submitterInfo}>
                  <div><strong>Name:</strong> {caseData.submitter_name || 'Anonymous'}</div>
                  <div><strong>Email:</strong> {caseData.submitter_email || '—'}</div>
                  <div><strong>Phone:</strong> {caseData.submitter_phone || '—'}</div>
                </div>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Internal Notes</span>
            </div>
            <div style={styles.cardBody}>
              <textarea style={styles.textarea} placeholder="Add an internal note..." value={newNote}
                onChange={e => setNewNote(e.target.value)} />
              <button style={savingNote ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleAddNote} disabled={savingNote}>
                {savingNote ? 'Saving...' : 'Add Note'}
              </button>
              {notes.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginTop: '8px' }}>No notes yet.</div>
              ) : (
                notes.map(note => (
                  <div key={note.id} style={styles.noteBox}>
                    <div style={styles.noteMeta}>{note.created_by} · {formatDateTime(note.created_at)}</div>
                    <div style={styles.noteText}>{note.note}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Activity Log</span>
            </div>
            <div style={styles.cardBody}>
              {auditLog.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No activity recorded yet.</div>
              ) : (
                auditLog.map(entry => (
                  <div key={entry.id} style={styles.auditRow}>
                    <div style={styles.auditDot} />
                    <div style={styles.auditAction}>
                      {entry.action}
                      <br />
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{entry.performed_by}</span>
                    </div>
                    <div style={styles.auditMeta}>{formatDateTime(entry.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        <div>

          {isAdmin && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Update Case</span>
              </div>
              <div style={styles.cardBody}>
                {saveSuccess && <div style={styles.successMsg}>Case updated successfully.</div>}

                <div style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Status</div>
                <select style={styles.select} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                  <option value="">-- Select status --</option>
                  {adminStatuses.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.is_91a_only ? ' (91-A)' : ''}
                    </option>
                  ))}
                </select>

                <div style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Issue Type</div>
                <select style={styles.select} value={selectedIssueType} onChange={e => setSelectedIssueType(e.target.value)}>
                  <option value="">-- Select issue type --</option>
                  {issueTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                <div style={{ ...styles.fieldLabel, marginBottom: '4px', marginTop: '8px' }}>Follow-up Due Date</div>
                <div style={styles.inputHint}>Clear this date to remove from follow-up tracking</div>
                <input type="date" style={styles.input} value={followupDate} onChange={e => setFollowupDate(e.target.value)} />

                <div style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={is91a}
                    onChange={e => setIs91a(e.target.checked)}
                    style={{ accentColor: '#1a56a0', width: '15px', height: '15px' }}
                  />
                  <span>This is a 91-A Right-to-Know request</span>
                </div>

                <button style={saving ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleSaveCase} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {!isAdmin && myDeptAssignment && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>My Department Status</span>
              </div>
              <div style={styles.cardBody}>
                {deptSaveSuccess && <div style={styles.successMsg}>Status updated successfully.</div>}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                  Update your department's status for this case. This does not affect the overall case status.
                </div>
                <div style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Your Department's Status</div>
                <select style={styles.select} value={deptSelectedStatus} onChange={e => setDeptSelectedStatus(e.target.value)}>
                  <option value="">-- Select status --</option>
                  {deptStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button
                  style={savingDeptStatus ? styles.saveBtnDisabled : styles.saveBtn}
                  onClick={handleSaveDeptStatus}
                  disabled={savingDeptStatus}
                >
                  {savingDeptStatus ? 'Saving...' : 'Update My Status'}
                </button>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Assigned Departments</span>
            </div>
            <div style={styles.cardBody}>
              {caseData.case_departments?.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '12px' }}>No departments assigned.</div>
              ) : (
                caseData.case_departments?.map((cd, i) => (
                  <div key={i} style={styles.deptRow}>
                    <span style={styles.deptName}>{cd.departments?.name}</span>
                    <span style={styles.deptStatus}>{cd.statuses?.name}</span>
                  </div>
                ))
              )}
              {isAdmin && availableDepts.length > 0 && (
                <div style={styles.addDeptRow}>
                  <select style={{ ...styles.select, marginBottom: 0, flex: 1 }} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                    <option value="">Add department...</option>
                    {availableDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button style={styles.addBtn} onClick={handleAddDept} disabled={addingDept || !selectedDept}>Add</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CaseDetail
