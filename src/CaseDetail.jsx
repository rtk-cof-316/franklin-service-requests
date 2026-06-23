import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import CaseFiles from './CaseFiles'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  topBar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' },
  backBtn: { background: 'none', border: 'none', color: '#1a56a0', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '6px' },
  printBtn: { padding: '6px 14px', backgroundColor: '#ffffff', border: '1px solid #1a56a0', color: '#1a56a0', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  exportBtn: { padding: '6px 14px', backgroundColor: '#1a56a0', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '20px' },
  cardHeader: { padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280' },
  cardBody: { padding: '20px' },
  caseNumberRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  caseNumber: { fontSize: '24px', fontWeight: '700', color: '#1a56a0' },
  tag91a: { backgroundColor: '#eff6ff', color: '#1a56a0', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: '600' },
  fieldRow: { marginBottom: '14px' },
  fieldLabel: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '3px' },
  fieldValue: { fontSize: '14px', color: '#111827', lineHeight: '1.5' },
  divider: { border: 'none', borderTop: '1px solid #f3f4f6', margin: '14px 0' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block' },
  select: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', backgroundColor: '#ffffff', outline: 'none', marginBottom: '10px' },
  input: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' },
  inputHint: { fontSize: '11px', color: '#9ca3af', marginBottom: '6px', marginTop: '-6px' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  saveBtn: { width: '100%', padding: '9px', backgroundColor: '#1a56a0', color: '#ffffff', fontSize: '13px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px' },
  saveBtnDisabled: { width: '100%', padding: '9px', backgroundColor: '#93afd4', color: '#ffffff', fontSize: '13px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'not-allowed', marginBottom: '8px' },
  deptRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', gap: '10px' },
  deptName: { fontSize: '13px', fontWeight: '600', color: '#374151', minWidth: '100px' },
  deptStatus: { fontSize: '12px', color: '#6b7280' },
  addDeptRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  addBtn: { padding: '7px 14px', backgroundColor: '#1a56a0', color: '#ffffff', fontSize: '12px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' },
  noteBox: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  commentBox: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px', marginBottom: '10px' },
  noteMeta: { fontSize: '11px', color: '#9ca3af', marginBottom: '4px' },
  noteText: { fontSize: '13px', color: '#374151', lineHeight: '1.5' },
  textarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', resize: 'vertical', minHeight: '80px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' },
  successMsg: { fontSize: '12px', color: '#065f46', backgroundColor: '#d1fae5', padding: '6px 10px', borderRadius: '4px', marginBottom: '8px' },
  loading: { padding: '60px', textAlign: 'center', color: '#6b7280' },
  auditRow: { display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' },
  auditDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1a56a0', marginTop: '5px', flexShrink: 0 },
  auditAction: { fontSize: '13px', color: '#374151', flex: 1, lineHeight: '1.4' },
  auditMeta: { fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: '8px' },
  rtkHeader: { backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' },
  rtkTitle: { color: '#1a56a0' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: '#374151' },
  sectionDivider: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1a56a0', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '12px', marginTop: '16px' },
  publicBadge: { fontSize: '11px', color: '#065f46', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' },
}

function getStatusStyle(name) {
  const s = (name || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return { ...styles.statusBadge, backgroundColor: '#d1fae5', color: '#065f46' }
  if (['in progress','assigned','scheduled','gathering records','reviewing records'].includes(s)) return { ...styles.statusBadge, backgroundColor: '#dbeafe', color: '#1e40af' }
  if (['lacks resources to resolve','unfounded','request abandoned'].includes(s)) return { ...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b' }
  if (['clarification needed','records ready - please schedule pick up'].includes(s)) return { ...styles.statusBadge, backgroundColor: '#fef3c7', color: '#92400e' }
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
  await supabase.from('case_audit_log').insert([{ case_id: caseId, action, performed_by: performedBy, created_at: new Date().toISOString() }])
}

const DELIVERY_METHODS = ['City USB', 'Self USB', 'In Person Viewing', 'Print', 'Mailed', 'Hold for Pick Up']
const APPOINTMENT_METHODS = ['City USB', 'Self USB', 'In Person Viewing', 'Print']
const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'

function CaseDetail({ caseId, onBack, userEmail, userRole, userDepartmentId, onPrintWorkOrder, onPrintCaseDetail }) {
  const [caseData, setCaseData] = useState(null)
  const [allStatuses, setAllStatuses] = useState([])
  const [issueTypes, setIssueTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [requestTopics, setRequestTopics] = useState([])
  const [notes, setNotes] = useState([])
  const [comments, setComments] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [is91a, setIs91a] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [submitterPhone, setSubmitterPhone] = useState('')
  const [savingSubmitter, setSavingSubmitter] = useState(false)
  const [submitterSuccess, setSubmitterSuccess] = useState(false)

  const [deptStatusEdits, setDeptStatusEdits] = useState({})
  const [savingDeptId, setSavingDeptId] = useState(null)

  const [myDeptAssignment, setMyDeptAssignment] = useState(null)
  const [deptSelectedStatus, setDeptSelectedStatus] = useState('')
  const [savingDeptStatus, setSavingDeptStatus] = useState(false)
  const [deptSaveSuccess, setDeptSaveSuccess] = useState(false)

  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  const [selectedDept, setSelectedDept] = useState('')
  const [addingDept, setAddingDept] = useState(false)

  const [rtkData, setRtkData] = useState(null)
  const [rtkFields, setRtkFields] = useState({
    acknowledged_date: '', request_topic: '', number_of_records: '', hours_worked: '',
    hours_worked_closed: '', fees_assessed: '', fees_collected: '', tax_dollar_spent: '',
    date_records_ready: '', date_requestor_notified: '', appointment_datetime: '',
    delivery_method: '', mailed: false, tracking_number: '', hold_for_pickup: false,
  })
  const [savingRtk, setSavingRtk] = useState(false)
  const [rtkSuccess, setRtkSuccess] = useState(false)

  // Archive checklist
const [archiveNetworkFolder, setArchiveNetworkFolder] = useState(false)
const [archiveInitialExport, setArchiveInitialExport] = useState(false)
const [archiveClosedExport, setArchiveClosedExport] = useState(false)
const [savingArchive, setSavingArchive] = useState(false)

  // Time log state
  const [timeLog, setTimeLog] = useState([])
  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeInitials, setTimeInitials] = useState('')
  const [timeRate, setTimeRate] = useState('')
  const [savingTimeLog, setSavingTimeLog] = useState(false)
  const [timeLogSuccess, setTimeLogSuccess] = useState(false)

  const isAdmin = userRole === 'admin'

  useEffect(() => { loadAll() }, [caseId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCase(), loadStatuses(), loadIssueTypes(), loadDepartments(), loadRequestTopics(), loadNotes(), loadComments(), loadAuditLog(), loadTimeLog()])
    setLoading(false)
  }

  async function loadCase() {
    const { data } = await supabase
      .from('cases')
      .select(`*, statuses ( id, name ), issue_types ( id, name ), case_departments ( id, department_id, departments ( name ), statuses ( id, name ) )`)
      .eq('id', caseId)
      .single()
    if (data) {
      setCaseData(data)
      setSelectedStatus(data.statuses?.id || '')
      setSelectedIssueType(data.issue_types?.id || '')
      setFollowupDate(data.followup_due_date ? data.followup_due_date.slice(0, 10) : '')
      setIs91a(data.is_91a || false)
      setArchiveNetworkFolder(data.archive_network_folder || false)
      setArchiveInitialExport(data.archive_initial_export || false)
      setArchiveClosedExport(data.archive_closed_export || false)
      setSubmitterName(data.submitter_name || '')
      setSubmitterEmail(data.submitter_email || '')
      setSubmitterPhone(data.submitter_phone || '')
      const edits = {}
      data.case_departments?.forEach(cd => { edits[cd.id] = cd.statuses?.id || '' })
      setDeptStatusEdits(edits)
      if (data.is_91a) loadRtkData()
      if (userRole === 'department' && userDepartmentId) {
        const myAssignment = data.case_departments?.find(cd => cd.department_id === userDepartmentId)
        if (myAssignment) { setMyDeptAssignment(myAssignment); setDeptSelectedStatus(myAssignment.statuses?.id || '') }
      }
    }
  }

  async function loadRtkData() {
    const { data } = await supabase.from('details_91a').select('*').eq('case_id', caseId).single()
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
        tax_dollar_spent: data.tax_dollar_spent != null ? data.tax_dollar_spent.toString() : '',
        date_records_ready: data.date_records_ready ? data.date_records_ready.slice(0, 10) : '',
        date_requestor_notified: data.date_requestor_notified ? data.date_requestor_notified.slice(0, 10) : '',
        appointment_datetime: data.appointment_datetime ? data.appointment_datetime.slice(0, 16) : '',
        delivery_method: data.delivery_method || '',
        mailed: data.mailed || false,
        tracking_number: data.tracking_number || '',
        hold_for_pickup: data.hold_for_pickup || false,
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
    const { data } = await supabase.from('internal_notes').select('*').eq('case_id', caseId).order('created_at', { ascending: false })
    setNotes(data || [])
  }

  async function loadComments() {
    const { data } = await supabase.from('case_comments').select('*').eq('case_id', caseId).order('created_at', { ascending: false })
    setComments(data || [])
  }

  async function loadAuditLog() {
    const { data } = await supabase.from('case_audit_log').select('*').eq('case_id', caseId).order('created_at', { ascending: false })
    setAuditLog(data || [])
  }

  async function loadTimeLog() {
    const { data } = await supabase.from('case_time_log').select('*').eq('case_id', caseId).order('created_at', { ascending: true })
    setTimeLog(data || [])
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

    const { error } = await supabase.from('cases').update({
      status_id: selectedStatus || null,
      issue_type_id: selectedIssueType || null,
      followup_due_date: followupDate || null,
      is_91a: is91a,
    }).eq('id', caseId).select()

    if (!error) {
      if (newStatus && newStatus !== oldStatus) {
        await logAudit(caseId, `Status changed from "${oldStatus || 'none'}" to "${newStatus}"`, userEmail)
        if (['resolved', 'closed'].includes(newStatus.toLowerCase()) && caseData.submitter_email) {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ type: 'case_closed', email: caseData.submitter_email, caseNumber: caseData.case_number, location: caseData.location, description: caseData.description }),
            })
          } catch (e) { console.error('Close notification error:', e) }
        }
      }
      if (newIssueType && newIssueType !== oldIssueType) await logAudit(caseId, `Issue type changed from "${oldIssueType || 'none'}" to "${newIssueType}"`, userEmail)
      if (followupDate !== oldFollowup) {
        if (followupDate) await logAudit(caseId, `Follow-up due date set to ${followupDate}`, userEmail)
        else await logAudit(caseId, `Follow-up due date cleared`, userEmail)
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

  async function handleSaveSubmitter() {
    setSavingSubmitter(true)
    setSubmitterSuccess(false)
    const changes = []
    if (submitterName !== (caseData.submitter_name || '')) changes.push('Name updated')
    if (submitterEmail !== (caseData.submitter_email || '')) changes.push('Email updated')
    if (submitterPhone !== (caseData.submitter_phone || '')) changes.push('Phone updated')
    const { error } = await supabase.from('cases').update({ submitter_name: submitterName || null, submitter_email: submitterEmail || null, submitter_phone: submitterPhone || null }).eq('id', caseId).select()
    if (!error) {
      if (changes.length > 0) await logAudit(caseId, `Submitter info updated: ${changes.join(', ')}`, userEmail)
      setSubmitterSuccess(true)
      await loadCase()
      await loadAuditLog()
      setTimeout(() => setSubmitterSuccess(false), 3000)
    }
    setSavingSubmitter(false)
  }

  async function handleSaveDeptStatusAdmin(cdId, deptName) {
    setSavingDeptId(cdId)
    const newStatusId = parseInt(deptStatusEdits[cdId])
    const newStatusName = allStatuses.find(s => s.id === newStatusId)?.name
    const oldStatusName = caseData.case_departments?.find(cd => cd.id === cdId)?.statuses?.name
    const { error } = await supabase.from('case_departments').update({ status_id: newStatusId }).eq('id', cdId).select()
    if (!error) {
      if (newStatusName && newStatusName !== oldStatusName) {
        await logAudit(caseId, `${deptName} status updated from "${oldStatusName || 'none'}" to "${newStatusName}" by admin`, userEmail)
      }
      await loadCase()
      await loadAuditLog()
    }
    setSavingDeptId(null)
  }

  async function handleSaveDeptStatus() {
    const closingStatuses = ['resolved', 'closed', 'unfounded', 'referred to another department', 'lacks resources to resolve', 'request abandoned']
    const selectedStatusName = allStatuses.find(s => s.id === parseInt(deptSelectedStatus))?.name || ''
    if (closingStatuses.includes(selectedStatusName.toLowerCase()) && followupDate) {
      alert('Please clear the follow-up due date before closing this case.')
      setSavingDeptStatus(false)
      return
    }
    if (!myDeptAssignment) return
    setSavingDeptStatus(true)
    setDeptSaveSuccess(false)
    const oldStatus = myDeptAssignment.statuses?.name
    const newStatus = allStatuses.find(s => s.id === parseInt(deptSelectedStatus))?.name
    const oldFollowup = caseData.followup_due_date ? caseData.followup_due_date.slice(0, 10) : ''
    await supabase.from('cases').update({ followup_due_date: followupDate || null }).eq('id', caseId)
    await supabase.from('case_departments').update({ status_id: parseInt(deptSelectedStatus) }).eq('id', myDeptAssignment.id)
    const auditParts = []
    if (newStatus && newStatus !== oldStatus) auditParts.push(`${myDeptAssignment.departments?.name} status changed from "${oldStatus || 'none'}" to "${newStatus}"`)
    if (followupDate !== oldFollowup) {
      if (followupDate) auditParts.push(`Follow-up due date set to ${followupDate}`)
      else auditParts.push(`Follow-up due date cleared`)
    }
    if (auditParts.length > 0) {
      await supabase.from('case_audit_log').insert([{ case_id: caseId, action: auditParts.join(', '), performed_by: userEmail, created_at: new Date().toISOString() }])
    }
    setDeptSaveSuccess(true)
    await loadCase()
    await loadAuditLog()
    setSavingDeptStatus(false)
    setTimeout(() => setDeptSaveSuccess(false), 3000)
  }

  async function handleSaveRtk() {
    setSavingRtk(true)
    setRtkSuccess(false)
    const { error } = await supabase.from('details_91a').update({
      acknowledged_date: rtkFields.acknowledged_date || null,
      request_topic: rtkFields.request_topic || null,
      number_of_records: rtkFields.number_of_records !== '' ? parseInt(rtkFields.number_of_records) : null,
      hours_worked: rtkFields.hours_worked !== '' ? parseFloat(rtkFields.hours_worked) : null,
      hours_worked_closed: rtkFields.hours_worked_closed !== '' ? parseFloat(rtkFields.hours_worked_closed) : null,
      fees_assessed: rtkFields.fees_assessed !== '' ? parseFloat(rtkFields.fees_assessed) : null,
      fees_collected: rtkFields.fees_collected !== '' ? parseFloat(rtkFields.fees_collected) : null,
      tax_dollar_spent: rtkFields.tax_dollar_spent !== '' ? parseFloat(rtkFields.tax_dollar_spent) : null,
      date_records_ready: rtkFields.date_records_ready || null,
      date_requestor_notified: rtkFields.date_requestor_notified || null,
      appointment_datetime: rtkFields.appointment_datetime || null,
      delivery_method: rtkFields.delivery_method || null,
      mailed: rtkFields.mailed,
      tracking_number: rtkFields.tracking_number || null,
      hold_for_pickup: rtkFields.hold_for_pickup,
    }).eq('case_id', caseId).select()

    if (!error) {
      const changes = []
      if (rtkFields.acknowledged_date !== (rtkData?.acknowledged_date?.slice(0, 10) || '')) changes.push('Acknowledged date updated')
      if (rtkFields.request_topic !== (rtkData?.request_topic || '')) changes.push(`Request topic set to "${rtkFields.request_topic}"`)
      if (rtkFields.number_of_records !== (rtkData?.number_of_records != null ? rtkData.number_of_records.toString() : '')) changes.push('Number of records updated')
      if (rtkFields.hours_worked !== (rtkData?.hours_worked != null ? rtkData.hours_worked.toString() : '')) changes.push('Hours worked updated')
      if (rtkFields.hours_worked_closed !== (rtkData?.hours_worked_closed != null ? rtkData.hours_worked_closed.toString() : '')) changes.push('Hours worked (final) updated')
      if (rtkFields.fees_assessed !== (rtkData?.fees_assessed != null ? rtkData.fees_assessed.toString() : '')) changes.push('Fees assessed updated')
      if (rtkFields.fees_collected !== (rtkData?.fees_collected != null ? rtkData.fees_collected.toString() : '')) changes.push('Fees collected updated')
      if (rtkFields.tax_dollar_spent !== (rtkData?.tax_dollar_spent != null ? rtkData.tax_dollar_spent.toString() : '')) changes.push('Tax dollars spent updated')
      if (rtkFields.delivery_method !== (rtkData?.delivery_method || '')) changes.push(`Delivery method set to "${rtkFields.delivery_method}"`)
      if (rtkFields.tracking_number !== (rtkData?.tracking_number || '')) changes.push('Tracking number updated')
      if (rtkFields.date_records_ready !== (rtkData?.date_records_ready?.slice(0, 10) || '')) changes.push('Date records ready updated')
      if (rtkFields.date_requestor_notified !== (rtkData?.date_requestor_notified?.slice(0, 10) || '')) changes.push('Date requestor notified updated')
      if (rtkFields.appointment_datetime !== (rtkData?.appointment_datetime?.slice(0, 16) || '')) changes.push('Appointment updated')
      const auditMessage = changes.length > 0 ? `91-A details updated: ${changes.join(', ')}` : '91-A details saved (no changes)'
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
    await supabase.from('internal_notes').insert([{ case_id: caseId, note: newNote.trim(), created_by: userEmail, created_at: new Date().toISOString() }])
    await logAudit(caseId, `Internal note added`, userEmail)
    setNewNote('')
    await loadNotes()
    await loadAuditLog()
    setSavingNote(false)
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    setSavingComment(true)
    await supabase.from('case_comments').insert([{ case_id: caseId, comment: newComment.trim(), created_by: userEmail, created_at: new Date().toISOString() }])
    await logAudit(caseId, `Public comment added`, userEmail)
    setNewComment('')
    await loadComments()
    await loadAuditLog()
    setSavingComment(false)
  }

  async function handleAddDept() {
    if (!selectedDept) return
    setAddingDept(true)
    const defaultStatus = allStatuses.find(s => s.name === 'Received')
    const deptName = departments.find(d => d.id === parseInt(selectedDept))?.name
    await supabase.from('case_departments').insert([{ case_id: caseId, department_id: parseInt(selectedDept), status_id: defaultStatus?.id || allStatuses[0]?.id }])
    await logAudit(caseId, `Assigned to ${deptName}`, userEmail)
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'department_assignment', departmentId: parseInt(selectedDept), caseNumber: caseData.case_number, location: caseData.location, description: caseData.description, departmentName: deptName }),
      })
    } catch (e) { console.error('Email notification error:', e) }
    setSelectedDept('')
    await loadCase()
    await loadAuditLog()
    setAddingDept(false)
  }

async function handleArchiveCheckbox(field, value, label) {
    setSavingArchive(true)
    await supabase.from('cases').update({ [field]: value }).eq('id', caseId)
    await logAudit(caseId, `${label} ${value ? 'checked' : 'unchecked'}`, userEmail)
    await loadAuditLog()
    setSavingArchive(false)
  }

  async function handleGeocode() {
    if (!caseData.location) return
    try {
      const geoQuery = `${caseData.location}, Franklin, NH 03235`
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geoQuery)}&limit=1&countrycodes=us`, { headers: { 'User-Agent': 'CityOfFranklinNH-ServiceRequests/1.0' } })
      const geoData = await geoRes.json()
      if (geoData && geoData.length > 0) {
        await supabase.from('cases').update({ latitude: parseFloat(geoData[0].lat), longitude: parseFloat(geoData[0].lon) }).eq('id', caseId)
        await logAudit(caseId, `Location geocoded`, userEmail)
        await loadCase()
        await loadAuditLog()
        alert('Location geocoded successfully!')
      } else {
        alert('Could not geocode this address. Try making it more specific.')
      }
    } catch (e) { alert('Geocoding failed. Please try again.') }
  }

  async function handleSendReminder(deptId, deptName) {
    const lastUpdate = auditLog.find(e => e.action?.includes(deptName))
    const lastUpdateText = lastUpdate
      ? `Last update from ${deptName}: ${formatDateTime(lastUpdate.created_at)}`
      : `No updates have been logged by ${deptName}`
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'department_reminder', departmentId: deptId, caseNumber: caseData.case_number, location: caseData.location, description: caseData.description, departmentName: deptName, lastUpdateText }),
      })
      await supabase.from('case_audit_log').insert([{ case_id: caseId, action: `System reminder sent to ${deptName}`, performed_by: 'System Notification', created_at: new Date().toISOString() }])
      await loadAuditLog()
      alert(`Reminder sent to ${deptName}.`)
    } catch (e) { alert('Failed to send reminder. Please try again.') }
  }

  async function handleAddTimeLog() {
    if (!timeMinutes || !timeInitials || !timeRate) return
    setSavingTimeLog(true)
    setTimeLogSuccess(false)
    const mins = parseInt(timeMinutes)
    const rate = parseFloat(timeRate)
    const cost = parseFloat(((mins / 60) * rate).toFixed(2))
    await supabase.from('case_time_log').insert([{
      case_id: caseId,
      minutes: mins,
      initials: timeInitials.trim().toUpperCase(),
      hourly_rate: rate,
      cost,
      logged_by: userEmail,
      created_at: new Date().toISOString(),
    }])
    // Recalculate total tax_dollar_spent from all entries
    const { data: allEntries } = await supabase.from('case_time_log').select('cost').eq('case_id', caseId)
    const totalCost = allEntries ? allEntries.reduce((sum, e) => sum + parseFloat(e.cost), 0) : cost
    await supabase.from('details_91a').update({ tax_dollar_spent: parseFloat(totalCost.toFixed(2)) }).eq('case_id', caseId)
    await logAudit(caseId, `Time logged on this case (${mins} min, ${timeInitials.toUpperCase()})`, userEmail)
    setTimeMinutes('')
    setTimeInitials('')
    setTimeRate('')
    setTimeLogSuccess(true)
    await loadTimeLog()
    await loadRtkData()
    await loadAuditLog()
    setSavingTimeLog(false)
    setTimeout(() => setTimeLogSuccess(false), 3000)
  }

  if (loading) return <div style={styles.loading}>Loading case...</div>
  if (!caseData) return <div style={styles.loading}>Case not found.</div>

  const assignedDeptNames = caseData.case_departments?.map(cd => cd.departments?.name) || []
  const availableDepts = departments.filter(d => !assignedDeptNames.includes(d.name))
  const showAppointment = APPOINTMENT_METHODS.includes(rtkFields.delivery_method)
  const totalTimeMinutes = timeLog.reduce((sum, e) => sum + e.minutes, 0)
  const totalTimeCost = timeLog.reduce((sum, e) => sum + parseFloat(e.cost), 0)

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Dashboard</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={styles.printBtn} onClick={() => onPrintWorkOrder && onPrintWorkOrder(caseId)}>Print Work Order</button>
          {isAdmin && <button style={styles.exportBtn} onClick={() => onPrintCaseDetail && onPrintCaseDetail(caseId)}>Export Full Case</button>}
        </div>
      </div>

      <div style={styles.grid}>
        <div>

          {/* Case Details */}
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

          {/* 91-A Details — admin only */}
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
                    <input type="date" style={styles.input} value={rtkFields.acknowledged_date} onChange={e => setRtkFields(prev => ({ ...prev, acknowledged_date: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Request Topic</div>
                    <select style={styles.select} value={rtkFields.request_topic} onChange={e => setRtkFields(prev => ({ ...prev, request_topic: e.target.value }))}>
                      <option value="">-- Select topic --</option>
                      {requestTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={styles.sectionDivider}>Records &amp; Hours</div>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.fieldLabel}>Number of Records</div>
                    <input type="number" style={styles.input} placeholder="0" value={rtkFields.number_of_records} onChange={e => setRtkFields(prev => ({ ...prev, number_of_records: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Hours Worked (Running)</div>
                    <input type="number" step="0.5" style={styles.input} placeholder="0.0" value={rtkFields.hours_worked} onChange={e => setRtkFields(prev => ({ ...prev, hours_worked: e.target.value }))} />
                  </div>
                </div>
                <div style={{ maxWidth: '50%', paddingRight: '5px' }}>
                  <div style={styles.fieldLabel}>Hours Worked (Final at Close)</div>
                  <input type="number" step="0.5" style={styles.input} placeholder="0.0" value={rtkFields.hours_worked_closed} onChange={e => setRtkFields(prev => ({ ...prev, hours_worked_closed: e.target.value }))} />
                </div>
                <div style={styles.sectionDivider}>Fees</div>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.fieldLabel}>Fees Assessed ($)</div>
                    <input type="number" step="0.01" style={styles.input} placeholder="0.00" value={rtkFields.fees_assessed} onChange={e => setRtkFields(prev => ({ ...prev, fees_assessed: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Fees Collected ($)</div>
                    <input type="number" step="0.01" style={styles.input} placeholder="0.00" value={rtkFields.fees_collected} onChange={e => setRtkFields(prev => ({ ...prev, fees_collected: e.target.value }))} />
                  </div>
                </div>
                <div style={{ maxWidth: '50%', paddingRight: '5px' }}>
                  <div style={styles.fieldLabel}>Tax Dollars Spent ($)</div>
                  <div style={styles.inputHint}>Auto-updated from time log entries below</div>
                  <input type="number" step="0.01" style={{ ...styles.input, backgroundColor: '#f9fafb', color: '#6b7280' }} placeholder="0.00" value={rtkFields.tax_dollar_spent} readOnly />
                </div>
                <div style={styles.sectionDivider}>Fulfillment</div>
                <div style={styles.twoCol}>
                  <div>
                    <div style={styles.fieldLabel}>Date Records Ready</div>
                    <input type="date" style={styles.input} value={rtkFields.date_records_ready} onChange={e => setRtkFields(prev => ({ ...prev, date_records_ready: e.target.value }))} />
                  </div>
                  <div>
                    <div style={styles.fieldLabel}>Date Requestor Notified</div>
                    <input type="date" style={styles.input} value={rtkFields.date_requestor_notified} onChange={e => setRtkFields(prev => ({ ...prev, date_requestor_notified: e.target.value }))} />
                  </div>
                </div>
                <div style={styles.fieldLabel}>Delivery Method</div>
                <select style={styles.select} value={rtkFields.delivery_method} onChange={e => setRtkFields(prev => ({ ...prev, delivery_method: e.target.value, mailed: e.target.value === 'Mailed', hold_for_pickup: e.target.value === 'Hold for Pick Up' }))}>
                  <option value="">-- Select delivery method --</option>
                  {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {showAppointment && (
                  <>
                    <div style={styles.fieldLabel}>Appointment Date &amp; Time</div>
                    <input type="datetime-local" style={styles.input} value={rtkFields.appointment_datetime} onChange={e => setRtkFields(prev => ({ ...prev, appointment_datetime: e.target.value }))} />
                  </>
                )}
                {rtkFields.delivery_method === 'Mailed' && (
                  <>
                    <div style={styles.fieldLabel}>Tracking Number</div>
                    <input type="text" style={styles.input} placeholder="Enter tracking number" value={rtkFields.tracking_number} onChange={e => setRtkFields(prev => ({ ...prev, tracking_number: e.target.value }))} />
                  </>
                )}
                <button style={savingRtk ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleSaveRtk} disabled={savingRtk}>
                  {savingRtk ? 'Saving...' : 'Save 91-A Details'}
                </button>
              </div>
            </div>
          )}

          {/* 91-A Time Log — admin only */}
          {caseData.is_91a && isAdmin && (
            <div style={styles.card}>
              <div style={{ ...styles.cardHeader, ...styles.rtkHeader }}>
                <span style={{ ...styles.cardTitle, ...styles.rtkTitle }}>⏱ Time Log</span>
                <span style={{ fontSize: '11px', color: '#1a56a0' }}>Admin only — auto-updates tax dollars spent</span>
              </div>
              <div style={styles.cardBody}>
                {timeLogSuccess && <div style={styles.successMsg}>Time entry saved and tax dollars spent updated.</div>}

                {/* Add entry form */}
                <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>Log Time Entry</div>
                  <div style={styles.twoCol}>
                    <div>
                      <div style={styles.fieldLabel}>Minutes Worked</div>
                      <input type="number" min="1" style={styles.input} placeholder="e.g. 30" value={timeMinutes} onChange={e => setTimeMinutes(e.target.value)} />
                    </div>
                    <div>
                      <div style={styles.fieldLabel}>Staff Initials (2 chars)</div>
                      <input type="text" maxLength={2} style={styles.input} placeholder="BD" value={timeInitials} onChange={e => setTimeInitials(e.target.value.toUpperCase())} />
                    </div>
                  </div>
                  <div style={{ maxWidth: '50%', paddingRight: '5px' }}>
                    <div style={styles.fieldLabel}>Hourly Rate ($)</div>
                    <input type="number" step="0.01" style={styles.input} placeholder="e.g. 25.00" value={timeRate} onChange={e => setTimeRate(e.target.value)} />
                  </div>
                  {timeMinutes && timeRate && parseFloat(timeMinutes) > 0 && parseFloat(timeRate) > 0 && (
                    <div style={{ fontSize: '12px', color: '#1a56a0', marginBottom: '8px', fontWeight: '600' }}>
                      Cost for this entry: ${((parseFloat(timeMinutes) / 60) * parseFloat(timeRate)).toFixed(2)}
                    </div>
                  )}
                  <button
                    style={savingTimeLog || !timeMinutes || !timeInitials || !timeRate ? styles.saveBtnDisabled : styles.saveBtn}
                    onClick={handleAddTimeLog}
                    disabled={savingTimeLog || !timeMinutes || !timeInitials || !timeRate}
                  >
                    {savingTimeLog ? 'Saving...' : 'Log Time'}
                  </button>
                </div>

                {/* Time log entries */}
                {timeLog.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No time entries yet.</div>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                      <thead>
                        <tr>
                          {['Date', 'Staff', 'Minutes', 'Rate', 'Cost'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeLog.map(entry => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151' }}>{formatDateTime(entry.created_at)}</td>
                            <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '700', color: '#374151' }}>{entry.initials}</td>
                            <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151' }}>{entry.minutes}m</td>
                            <td style={{ padding: '8px 10px', fontSize: '12px', color: '#374151' }}>${parseFloat(entry.hourly_rate).toFixed(2)}/hr</td>
                            <td style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '600', color: '#1a56a0' }}>${parseFloat(entry.cost).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: '24px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '6px', fontSize: '13px' }}>
                      <div><span style={{ color: '#6b7280' }}>Total Time: </span><strong style={{ color: '#1a56a0' }}>{(totalTimeMinutes / 60).toFixed(1)} hrs ({totalTimeMinutes} min)</strong></div>
                      <div><span style={{ color: '#6b7280' }}>Total Cost: </span><strong style={{ color: '#1a56a0' }}>${totalTimeCost.toFixed(2)}</strong></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Submitter Info — editable for admin, read-only for dept */}
          {(isAdmin || userRole === 'department') && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Submitter Information</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>Internal only</span>
              </div>
              <div style={styles.cardBody}>
                {isAdmin ? (
                  <>
                    {submitterSuccess && <div style={styles.successMsg}>Submitter info updated.</div>}
                    <div style={styles.twoCol}>
                      <div>
                        <div style={styles.fieldLabel}>Name</div>
                        <input type="text" style={styles.input} value={submitterName} onChange={e => setSubmitterName(e.target.value)} placeholder="Full name" />
                      </div>
                      <div>
                        <div style={styles.fieldLabel}>Email</div>
                        <input type="email" style={styles.input} value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)} placeholder="email@example.com" />
                      </div>
                    </div>
                    <div style={{ maxWidth: '50%', paddingRight: '5px' }}>
                      <div style={styles.fieldLabel}>Phone</div>
                      <input type="tel" style={styles.input} value={submitterPhone} onChange={e => setSubmitterPhone(e.target.value)} placeholder="(603) 000-0000" />
                    </div>
                    {caseData.requestor_id && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                        <strong>Requestor ID:</strong> {caseData.requestor_id}
                      </div>
                    )}
                    <button style={savingSubmitter ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleSaveSubmitter} disabled={savingSubmitter}>
                      {savingSubmitter ? 'Saving...' : 'Save Submitter Info'}
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.8' }}>
                    <div style={styles.fieldRow}>
                      <div style={styles.fieldLabel}>Name</div>
                      <div style={styles.fieldValue}>{caseData.submitter_name || '—'}</div>
                    </div>
                    <hr style={styles.divider} />
                    <div style={styles.fieldRow}>
                      <div style={styles.fieldLabel}>Email</div>
                      <div style={styles.fieldValue}>
                        {caseData.submitter_email ? <a href={`mailto:${caseData.submitter_email}`} style={{ color: '#1a56a0' }}>{caseData.submitter_email}</a> : '—'}
                      </div>
                    </div>
                    <hr style={styles.divider} />
                    <div style={styles.fieldRow}>
                      <div style={styles.fieldLabel}>Phone</div>
                      <div style={styles.fieldValue}>
                        {caseData.submitter_phone ? <a href={`tel:${caseData.submitter_phone}`} style={{ color: '#1a56a0' }}>{caseData.submitter_phone}</a> : '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Public Comments */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Public Updates</span>
              <span style={styles.publicBadge}>Visible to public</span>
            </div>
            <div style={styles.cardBody}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                Comments added here are visible to the public on the case tracker. Use for status updates you want the requestor to see.
              </div>
              <textarea style={styles.textarea} placeholder="Add a public update..." value={newComment} onChange={e => setNewComment(e.target.value)} />
              <button style={savingComment ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleAddComment} disabled={savingComment}>
                {savingComment ? 'Saving...' : 'Post Public Update'}
              </button>
              {comments.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginTop: '8px' }}>No public updates yet.</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={styles.commentBox}>
                    <div style={styles.noteMeta}>{c.created_by} · {formatDateTime(c.created_at)}</div>
                    <div style={styles.noteText}>{c.comment}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Internal Notes</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Staff only</span>
            </div>
            <div style={styles.cardBody}>
              <textarea style={styles.textarea} placeholder="Add an internal note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
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

          {/* Attachments */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Attachments</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Visible to public</span>
            </div>
            <div style={styles.cardBody}>
              <CaseFiles caseId={caseId} canUpload={true} uploadedBy={userEmail} />
            </div>
          </div>

          {/* Audit Log */}
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

        {/* Right sidebar */}
        <div>

          {/* Admin update panel */}
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
                  {adminStatuses.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_91a_only ? ' (91-A)' : ''}</option>)}
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
                  <input type="checkbox" checked={is91a} onChange={e => setIs91a(e.target.checked)} style={{ accentColor: '#1a56a0', width: '15px', height: '15px' }} />
                  <span>This is a 91-A Right-to-Know request</span>
                </div>
                <button style={saving ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleSaveCase} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {isAdmin && caseData.issue_types && ['Pothole', 'Crack / Pavement', 'Drainage', 'Heave', 'Signage / Traffic', 'Plowing / Sanding'].includes(caseData.issue_types.name) && (
                  <button style={{ ...styles.printBtn, width: '100%', marginBottom: '8px', fontSize: '12px' }} onClick={handleGeocode}>
                    📍 {caseData.latitude ? 'Re-Geocode Location' : 'Geocode Location'}
                  </button>
                )}
              </div>
            </div>
          )}

{/* Archive Checklist — admin only */}
{isAdmin && (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <span style={styles.cardTitle}>📁 Archive Checklist</span>
      {savingArchive && <span style={{ fontSize: '11px', color: '#9ca3af' }}>Saving...</span>}
    </div>
    <div style={styles.cardBody}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        Track case file archiving steps.
      </div>
      {[
        { field: 'archive_network_folder', value: archiveNetworkFolder, setter: setArchiveNetworkFolder, label: 'Network Folder Created' },
        { field: 'archive_initial_export', value: archiveInitialExport, setter: setArchiveInitialExport, label: 'Initial Export Complete' },
        { field: 'archive_closed_export', value: archiveClosedExport, setter: setArchiveClosedExport, label: 'Closed Export Complete' },
      ].map(({ field, value, setter, label }) => (
        <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
          <input
            type="checkbox"
            checked={value}
            onChange={async e => {
              setter(e.target.checked)
              await handleArchiveCheckbox(field, e.target.checked, label)
            }}
            style={{ accentColor: '#1a56a0', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: '13px', color: value ? '#065f46' : '#374151', fontWeight: value ? '600' : '400', textDecoration: value ? 'none' : 'none' }}>
            {value ? '✓ ' : ''}{label}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

          {/* Dept user status panel */}
          {!isAdmin && myDeptAssignment && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>My Department Status</span>
              </div>
              <div style={styles.cardBody}>
                {deptSaveSuccess && <div style={styles.successMsg}>Status updated successfully.</div>}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                  Update your department's status and follow-up date for this case.
                </div>
                <div style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Your Department's Status</div>
                <select style={styles.select} value={deptSelectedStatus} onChange={e => setDeptSelectedStatus(e.target.value)}>
                  <option value="">-- Select status --</option>
                  {deptStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div style={{ ...styles.fieldLabel, marginBottom: '4px' }}>Follow-up Due Date</div>
                <div style={styles.inputHint}>Clear this date to remove from follow-up tracking</div>
                <input type="date" style={styles.input} value={followupDate} onChange={e => setFollowupDate(e.target.value)} />
                <button style={savingDeptStatus ? styles.saveBtnDisabled : styles.saveBtn} onClick={handleSaveDeptStatus} disabled={savingDeptStatus}>
                  {savingDeptStatus ? 'Saving...' : 'Update My Status'}
                </button>
              </div>
            </div>
          )}

          {/* Departments panel */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Assigned Departments</span>
            </div>
            <div style={styles.cardBody}>
              {caseData.case_departments?.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginBottom: '12px' }}>No departments assigned.</div>
              ) : (
                caseData.case_departments?.map((cd) => (
                  <div key={cd.id} style={{ ...styles.deptRow, flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ backgroundColor: '#f3f4f6', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      {cd.departments?.name}
                    </div>
                    {isAdmin ? (
                      <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '4px' }}>
                        <select
                          style={{ ...styles.select, marginBottom: 0, flex: 1, fontSize: '12px', padding: '5px 8px' }}
                          value={deptStatusEdits[cd.id] || ''}
                          onChange={e => setDeptStatusEdits(prev => ({ ...prev, [cd.id]: e.target.value }))}
                        >
                          <option value="">-- Status --</option>
                          {deptStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button
                          style={{ padding: '5px 10px', backgroundColor: savingDeptId === cd.id ? '#93afd4' : '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          onClick={() => handleSaveDeptStatusAdmin(cd.id, cd.departments?.name)}
                          disabled={savingDeptId === cd.id}
                        >
                          {savingDeptId === cd.id ? '...' : 'Save'}
                        </button>
                        <button
                          style={{ padding: '5px 10px', backgroundColor: '#ffffff', border: '1px solid #d97706', color: '#d97706', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          onClick={() => handleSendReminder(cd.department_id, cd.departments?.name)}
                          title="Send system reminder to this department"
                        >
                          🔔 Remind
                        </button>
                      </div>
                    ) : (
                      <span style={styles.deptStatus}>{cd.statuses?.name}</span>
                    )}
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
