import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  JLC_BUCKET, JLC_EMAIL_ERROR, daysOpen, facilityLabel, formatDateOnly, formatDateTime,
  isValidJlcEmail, missingRepairFields,
} from './jlcConfig'

const s = {
  page: { padding: '24px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" },
  wrap: { maxWidth: '900px', margin: '0 auto' },
  topRow: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '20px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a56a0', margin: '0 0 16px 0', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px 24px' },
  fieldLabel: { fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' },
  fieldValue: { fontSize: '14px', color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '90px', resize: 'vertical' },
  primary: { padding: '9px 18px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  success: { padding: '9px 18px', backgroundColor: '#047857', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  secondary: { padding: '9px 18px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  disabled: { padding: '9px 18px', backgroundColor: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed' },
  badge: (done) => ({ display: 'inline-block', padding: '3px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', backgroundColor: done ? '#d1fae5' : '#fef3c7', color: done ? '#065f46' : '#92400e' }),
  error: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#991b1b' },
  ok: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#065f46' },
  hint: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  th: { padding: '8px 10px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '8px 10px', fontSize: '12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' },
}

const ACTION_LABELS = {
  created: 'Report submitted',
  field_updated: 'Field changed',
  status_changed: 'Status changed',
  attachment_added: 'Photo added',
  attachment_removed: 'Photo removed',
  printed: 'Printed',
}

const FIELD_LABELS = {
  facility_id: 'Building', facility_other_name: 'Other building name', department: 'Department', issue_location: 'Location',
  problem_description: 'Problem description', reported_by_name: 'Reported by', reporter_email: 'Reporter email', reporter_phone: 'Reporter phone',
  repaired_by: 'Repairs done by', work_description: 'Description of work done', completed_date: 'Date completed', parts_used: 'Parts used',
  reporter_notified_date: 'Reporter notified on', reporter_notified_via: 'Reporter notified via', status: 'Status',
}

function Field({ label, children }) {
  return (
    <div>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.fieldValue}>{children || '—'}</div>
    </div>
  )
}

function JlcFacilityRepairDetail({ reportId, userRole, onBack, onPrint }) {
  const [report, setReport] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [photoUrls, setPhotoUrls] = useState({})
  const [log, setLog] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [repair, setRepair] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingRequest, setEditingRequest] = useState(false)
  const [requestDraft, setRequestDraft] = useState({})
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  async function loadAll() {
    const [{ data: r }, { data: atts }, { data: entries }, { data: facs }] = await Promise.all([
      supabase.from('facility_repair_reports').select('*, city_facilities ( name, address )').eq('id', reportId).single(),
      supabase.from('facility_repair_attachments').select('*').eq('report_id', reportId).order('uploaded_at'),
      supabase.from('facility_repair_activity_log').select('*').eq('report_id', reportId).order('created_at', { ascending: false }),
      supabase.from('city_facilities').select('id, name, is_active').order('name'),
    ])
    setReport(r || null)
    setAttachments(atts || [])
    setLog(entries || [])
    setFacilities(facs || [])
    if (r) setRepair(repairFromReport(r))
    if (atts?.length) {
      const { data: signed } = await supabase.storage.from(JLC_BUCKET).createSignedUrls(atts.map(a => a.storage_path), 600)
      const map = {}
      signed?.forEach(item => { if (item.signedUrl) map[item.path] = item.signedUrl })
      setPhotoUrls(map)
    }
    setLoading(false)
  }

  function repairFromReport(r) {
    return {
      repaired_by: r.repaired_by || '', work_description: r.work_description || '', completed_date: r.completed_date || '',
      parts_used: r.parts_used || '', reporter_notified_date: r.reporter_notified_date || '', reporter_notified_via: r.reporter_notified_via || '',
    }
  }

  function repairPayload() {
    return {
      repaired_by: repair.repaired_by.trim() || null,
      work_description: repair.work_description.trim() || null,
      completed_date: repair.completed_date || null,
      parts_used: repair.parts_used.trim() || null,
      reporter_notified_date: repair.reporter_notified_date || null,
      reporter_notified_via: repair.reporter_notified_via || null,
    }
  }

  async function refreshLog() {
    const { data } = await supabase.from('facility_repair_activity_log').select('*').eq('report_id', reportId).order('created_at', { ascending: false })
    setLog(data || [])
  }

  async function saveRepair(complete = false) {
    setMessage({ type: '', text: '' })
    if (complete && missingRepairFields(repair).length > 0) {
      setMessage({ type: 'error', text: 'All six repair fields are required before this report can be marked Completed.' })
      return
    }
    setSaving(true)
    const payload = complete ? { ...repairPayload(), status: 'completed' } : repairPayload()
    const { data, error } = await supabase.from('facility_repair_reports').update(payload).eq('id', reportId).select('*, city_facilities ( name, address )').single()
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setReport(data)
    setRepair(repairFromReport(data))
    setMessage({ type: 'ok', text: complete ? 'Report marked Completed.' : 'Repair details saved.' })
    refreshLog()
  }

  async function reopen() {
    if (!window.confirm('Reopen this report? Its repair details are kept.')) return
    setSaving(true)
    const { data, error } = await supabase.from('facility_repair_reports').update({ status: 'open' }).eq('id', reportId).select('*, city_facilities ( name, address )').single()
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setReport(data)
    setMessage({ type: 'ok', text: 'Report reopened.' })
    refreshLog()
  }

  function startEditRequest() {
    setRequestDraft({
      facility_id: report.facility_id ? String(report.facility_id) : 'other',
      facility_other_name: report.facility_other_name || '',
      department: report.department, issue_location: report.issue_location, problem_description: report.problem_description,
      reported_by_name: report.reported_by_name, reporter_email: report.reporter_email, reporter_phone: report.reporter_phone || '',
    })
    setEditingRequest(true)
    setMessage({ type: '', text: '' })
  }

  async function saveRequest() {
    const d = requestDraft
    if (!isValidJlcEmail(d.reporter_email)) { setMessage({ type: 'error', text: JLC_EMAIL_ERROR }); return }
    if (!d.department.trim() || !d.issue_location.trim() || !d.problem_description.trim() || !d.reported_by_name.trim()) {
      setMessage({ type: 'error', text: 'Department, location, problem, and reported by are required.' }); return
    }
    if (d.facility_id === 'other' && !d.facility_other_name.trim()) { setMessage({ type: 'error', text: 'Enter the building or property name.' }); return }
    setSaving(true)
    const { data, error } = await supabase.from('facility_repair_reports').update({
      facility_id: d.facility_id === 'other' ? null : Number(d.facility_id),
      facility_other_name: d.facility_id === 'other' ? d.facility_other_name.trim() : null,
      department: d.department.trim(), issue_location: d.issue_location.trim(), problem_description: d.problem_description.trim(),
      reported_by_name: d.reported_by_name.trim(), reporter_email: d.reporter_email.trim().toLowerCase(), reporter_phone: d.reporter_phone.trim() || null,
    }).eq('id', reportId).select('*, city_facilities ( name, address )').single()
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    setReport(data)
    setEditingRequest(false)
    setMessage({ type: 'ok', text: 'Original report details updated (logged below).' })
    refreshLog()
  }

  if (loading) return <div style={s.page}><div style={s.wrap}>Loading...</div></div>
  if (!report) return <div style={s.page}><div style={s.wrap}><button style={s.secondary} onClick={onBack}>← Back</button><p>Report not found.</p></div></div>

  const completed = report.status === 'completed'
  const missing = missingRepairFields(repair)
  const setR = (k, v) => setRepair(prev => ({ ...prev, [k]: v }))
  const setD = (k, v) => setRequestDraft(prev => ({ ...prev, [k]: v }))

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.topRow}>
          <button style={s.secondary} onClick={onBack}>← Back to list</button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button style={s.secondary} onClick={() => onPrint(report.id, 'form')}>Print Form (blank repair section)</button>
            <button style={completed ? s.secondary : s.disabled} disabled={!completed} onClick={() => onPrint(report.id, 'completed')}>Print Completed Record</button>
          </div>
        </div>

        {message.text && <div style={message.type === 'error' ? s.error : s.ok}>{message.text}</div>}

        <div style={s.card}>
          <div style={s.cardTitle}>
            <span>{report.confirmation_number} <span style={s.badge(completed)}>{completed ? 'Completed' : 'Open'}</span></span>
            {isAdmin && !editingRequest && <button style={s.secondary} onClick={startEditRequest}>Edit Original Details</button>}
          </div>

          {!editingRequest ? (
            <>
              <div style={s.grid}>
                <Field label="Building">{facilityLabel(report)}{report.city_facilities?.address ? ` — ${report.city_facilities.address}` : ''}</Field>
                <Field label="Department / Office">{report.department}</Field>
                <Field label="Location of the Issue">{report.issue_location}</Field>
                <Field label="Date Reported">{formatDateOnly(report.reported_date)}</Field>
                <Field label="Reported By">{report.reported_by_name}</Field>
                <Field label="Reporter Email">{report.reporter_email}</Field>
                <Field label="Reporter Phone">{report.reporter_phone}</Field>
                <Field label={completed ? 'Days to Complete' : 'Days Open'}>{String(daysOpen(report))}</Field>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Field label="Problem or Repair Needed">{report.problem_description}</Field>
              </div>
              {!isAdmin && <div style={s.hint}>The original report is locked after submission. Contact an administrator if it needs correcting.</div>}
            </>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={s.label}>Building</label>
                <select style={s.input} value={requestDraft.facility_id} onChange={e => setD('facility_id', e.target.value)}>
                  {facilities.filter(f => f.is_active || String(f.id) === requestDraft.facility_id).map(f => <option key={f.id} value={f.id}>{f.name}{f.is_active ? '' : ' (archived)'}</option>)}
                  <option value="other">Other city building</option>
                </select>
              </div>
              {requestDraft.facility_id === 'other' && <div><label style={s.label}>Building or property name</label><input style={s.input} value={requestDraft.facility_other_name} onChange={e => setD('facility_other_name', e.target.value)} /></div>}
              <div><label style={s.label}>Department / Office</label><input style={s.input} value={requestDraft.department} onChange={e => setD('department', e.target.value)} /></div>
              <div><label style={s.label}>Location of the Issue</label><input style={s.input} value={requestDraft.issue_location} onChange={e => setD('issue_location', e.target.value)} /></div>
              <div><label style={s.label}>Problem or Repair Needed</label><textarea style={s.textarea} value={requestDraft.problem_description} onChange={e => setD('problem_description', e.target.value)} /></div>
              <div><label style={s.label}>Reported By</label><input style={s.input} value={requestDraft.reported_by_name} onChange={e => setD('reported_by_name', e.target.value)} /></div>
              <div><label style={s.label}>Reporter Email</label><input style={s.input} value={requestDraft.reporter_email} onChange={e => setD('reporter_email', e.target.value)} /></div>
              <div><label style={s.label}>Reporter Phone</label><input style={s.input} value={requestDraft.reporter_phone} onChange={e => setD('reporter_phone', e.target.value)} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={saving ? s.disabled : s.primary} disabled={saving} onClick={saveRequest}>{saving ? 'Saving...' : 'Save Original Details'}</button>
                <button style={s.secondary} onClick={() => setEditingRequest(false)}>Cancel</button>
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div style={{ marginTop: '18px' }}>
              <div style={s.fieldLabel}>Photos</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                {attachments.map(a => (
                  photoUrls[a.storage_path]
                    ? <a key={a.id} href={photoUrls[a.storage_path]} target="_blank" rel="noopener noreferrer" title={a.file_name}>
                        {a.content_type === 'image/heic' || a.content_type === 'image/heif'
                          ? <span style={{ ...s.secondary, display: 'inline-block' }}>{a.file_name}</span>
                          : <img src={photoUrls[a.storage_path]} alt={a.file_name} style={{ height: '110px', borderRadius: '6px', border: '1px solid #d1d5db' }} />}
                      </a>
                    : <span key={a.id} style={s.hint}>{a.file_name} (loading…)</span>
                ))}
              </div>
              <div style={s.hint}>Photo links expire after 10 minutes; reload the page for fresh ones.</div>
            </div>
          )}
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}><span>Repair Report</span></div>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div><label style={s.label}>Repairs done by <span style={{ color: '#dc2626' }}>*</span></label><input style={s.input} value={repair.repaired_by} onChange={e => setR('repaired_by', e.target.value)} /></div>
            <div><label style={s.label}>Description of work done <span style={{ color: '#dc2626' }}>*</span></label><textarea style={s.textarea} value={repair.work_description} onChange={e => setR('work_description', e.target.value)} /></div>
            <div style={s.grid}>
              <div><label style={s.label}>Date completed <span style={{ color: '#dc2626' }}>*</span></label><input type="date" style={s.input} value={repair.completed_date} onChange={e => setR('completed_date', e.target.value)} /></div>
              <div>
                <label style={s.label}>Parts used <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={s.input} value={repair.parts_used} onChange={e => setR('parts_used', e.target.value)} />
                <div style={s.hint}>Enter "None" if no parts were used.</div>
              </div>
              <div><label style={s.label}>Reporter notified of correction on this date <span style={{ color: '#dc2626' }}>*</span></label><input type="date" style={s.input} value={repair.reporter_notified_date} onChange={e => setR('reporter_notified_date', e.target.value)} /></div>
              <div>
                <label style={s.label}>Reporter notified via <span style={{ color: '#dc2626' }}>*</span></label>
                <select style={s.input} value={repair.reporter_notified_via} onChange={e => setR('reporter_notified_via', e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </div>
            <div style={s.hint}>The reporter is not emailed automatically. Notify them yourself, then record the date and method above.</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button style={saving ? s.disabled : s.primary} disabled={saving} onClick={() => saveRepair(false)}>{saving ? 'Saving...' : 'Save Repair Details'}</button>
              {!completed && (
                <button style={saving || missing.length > 0 ? s.disabled : s.success} disabled={saving || missing.length > 0} onClick={() => saveRepair(true)} title={missing.length > 0 ? 'Fill in all six fields first' : ''}>
                  Mark Completed
                </button>
              )}
              {completed && <button style={s.secondary} disabled={saving} onClick={reopen}>Reopen</button>}
              {!completed && missing.length > 0 && <span style={s.hint}>{missing.length} of 6 required fields still empty.</span>}
              {completed && <span style={s.hint}>Completed {formatDateTime(report.completed_logged_at)}</span>}
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}><span>Activity Log</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={s.th}>When</th><th style={s.th}>Who</th><th style={s.th}>What</th><th style={s.th}>Field</th><th style={s.th}>Old</th><th style={s.th}>New</th></tr></thead>
              <tbody>
                {log.map(e => (
                  <tr key={e.id}>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{formatDateTime(e.created_at)}</td>
                    <td style={s.td}>{e.actor_label}</td>
                    <td style={s.td}>{ACTION_LABELS[e.action_type] || e.action_type}{e.notes ? ` — ${e.notes}` : ''}</td>
                    <td style={s.td}>{FIELD_LABELS[e.field_name] || e.field_name || ''}</td>
                    <td style={{ ...s.td, maxWidth: '180px', wordBreak: 'break-word' }}>{e.old_value ?? ''}</td>
                    <td style={{ ...s.td, maxWidth: '180px', wordBreak: 'break-word' }}>{e.new_value ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JlcFacilityRepairDetail
