import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '32px 24px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1a56a0',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
}

function getStatusStyle(name) {
  const s = (name || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return { ...styles.statusBadge, backgroundColor: '#d1fae5', color: '#065f46' }
  if (s === 'in progress' || s === 'assigned' || s === 'scheduled') return { ...styles.statusBadge, backgroundColor: '#dbeafe', color: '#1e40af' }
  if (s === 'lacks resources to resolve' || s === 'unfounded') return { ...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b' }
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

function CaseDetail({ caseId, onBack, userEmail }) {
  const [caseData, setCaseData] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [departments, setDepartments] = useState([])
  const [notes, setNotes] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedStatus, setSelectedStatus] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [selectedDept, setSelectedDept] = useState('')
  const [addingDept, setAddingDept] = useState(false)

  useEffect(() => {
    loadAll()
  }, [caseId])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCase(), loadStatuses(), loadDepartments(), loadNotes(), loadAuditLog()])
    setLoading(false)
  }

  async function loadCase() {
    const { data } = await supabase
      .from('cases')
      .select(`
        *,
        statuses ( id, name ),
        issue_types ( name ),
        case_departments (
          id,
          departments ( name ),
          statuses ( name )
        )
      `)
      .eq('id', caseId)
      .single()
    if (data) {
      setCaseData(data)
      setSelectedStatus(data.statuses?.id || '')
      setFollowupDate(data.followup_due_date ? data.followup_due_date.slice(0, 10) : '')
    }
  }

  async function loadStatuses() {
    const { data } = await supabase.from('statuses').select('*').order('name')
    setStatuses(data || [])
  }

  async function loadDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name')
    setDepartments(data || [])
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

  async function handleSaveCase() {
    setSaving(true)
    setSaveSuccess(false)

    const oldStatus = caseData.statuses?.name
    const newStatus = statuses.find(s => s.id === parseInt(selectedStatus))?.name
    const oldFollowup = caseData.followup_due_date ? caseData.followup_due_date.slice(0, 10) : ''

console.log('Updating case id:', caseId)
console.log('followupDate value:', followupDate)
console.log('selectedStatus value:', selectedStatus)

const { data: updateData, error } = await supabase
  .from('cases')
  .update({
    status_id: selectedStatus || null,
    followup_due_date: followupDate || null,
  })
  .eq('id', caseId)
  .select()

console.log('Update response:', JSON.stringify(updateData), error)

console.log('Save result:', error)

    if (!error) {
      if (newStatus && newStatus !== oldStatus) {
        await logAudit(caseId, `Status changed from "${oldStatus || 'none'}" to "${newStatus}"`, userEmail)
      }
      if (followupDate !== oldFollowup) {
        if (followupDate) {
          await logAudit(caseId, `Follow-up due date set to ${followupDate}`, userEmail)
        } else {
          await logAudit(caseId, `Follow-up due date removed`, userEmail)
        }
      }
      setSaveSuccess(true)
      await loadCase()
      await loadAuditLog()
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
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
    const defaultStatus = statuses.find(s => s.name === 'Received')
    const deptName = departments.find(d => d.id === parseInt(selectedDept))?.name
    await supabase.from('case_departments').insert([{
      case_id: caseId,
      department_id: parseInt(selectedDept),
      status_id: defaultStatus?.id || statuses[0]?.id,
    }])
    await logAudit(caseId, `Assigned to ${deptName}`, userEmail)
    setSelectedDept('')
    await loadCase()
    await loadAuditLog()
    setAddingDept(false)
  }

  if (loading) return <div style={styles.loading}>Loading case...</div>
  if (!caseData) return <div style={styles.loading}>Case not found.</div>

  const assignedDeptIds = caseData.case_departments?.map(cd => cd.departments?.name) || []
  const availableDepts = departments.filter(d => !assignedDeptIds.includes(d.name))

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={onBack}>
        ← Back to Dashboard
      </button>

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

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Internal Notes</span>
            </div>
            <div style={styles.cardBody}>
              <textarea
                style={styles.textarea}
                placeholder="Add an internal note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              />
              <button
                style={savingNote ? styles.saveBtnDisabled : styles.saveBtn}
                onClick={handleAddNote}
                disabled={savingNote}
              >
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
                    <div style={styles.auditAction}>{entry.action}<br /><span style={{ fontSize: '11px', color: '#9ca3af' }}>{entry.performed_by}</span></div>
                    <div style={styles.auditMeta}>{formatDateTime(entry.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Update Case</span>
            </div>
            <div style={styles.cardBody}>
              {saveSuccess && <div style={styles.successMsg}>Case updated successfully.</div>}
              <div style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Status</div>
              <select
                style={styles.select}
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="">-- Select status --</option>
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <div style={{ ...styles.fieldLabel, marginBottom: '4px', marginTop: '8px' }}>Follow-up Due Date</div>
<div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>Clear this date to remove from follow-up tracking</div>
              <input
                type="date"
                style={styles.input}
                value={followupDate}
                onChange={e => setFollowupDate(e.target.value)}
              />

              <button
                style={saving ? styles.saveBtnDisabled : styles.saveBtn}
                onClick={handleSaveCase}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

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
              {availableDepts.length > 0 && (
                <div style={styles.addDeptRow}>
                  <select
                    style={{ ...styles.select, marginBottom: 0, flex: 1 }}
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                  >
                    <option value="">Add department...</option>
                    {availableDepts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    style={styles.addBtn}
                    onClick={handleAddDept}
                    disabled={addingDept || !selectedDept}
                  >
                    Add
                  </button>
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
