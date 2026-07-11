import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import CaseFiles from './CaseFiles'

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const POLICY_TEXT = `Franklin Service Request System — Policy

WHAT THIS SYSTEM IS FOR
This system lets Franklin residents report issues around the city — things like potholes, road damage, code concerns, and other city matters. It helps city staff track problems and respond to them, and it lets residents see how requests are being handled.

HOW REQUESTS ARE HANDLED
When you submit a request, it's assigned to the right city department. You'll be able to see updates as staff work on it. Requests stay open until the issue is resolved or closed.

WHAT INFORMATION IS PUBLIC
New Hampshire's public records law (RSA 91-A) makes most government records open to the public, and this system follows that same rule. Under RSA 91-A:5, IV, certain personal information is exempt from public disclosure because releasing it would be an invasion of privacy. If a photo, file, or text you submit demonstrates this kind of personal information, for example, something that could identify a specific person, their vehicle, or their home, we will blur or remove that portion. The original file is kept on record, off of the public system, and is not deleted.

If your request is about a problem at a location, like a pothole, a damaged sign, or a park issue, the address is shown publicly. This helps city crews find and fix the problem.

If your request is about a person or business, like a code concern, we remove home addresses, personal phone numbers, and personal emails. Names and business names may still appear, since state law does not allow those to be removed.

PHOTOS AND FILES
You may attach photos or files to support your request. To keep the system usable for everyone, there are limits on file size and the number of files per request. Requests with excessive or unnecessary attachments may be trimmed to keep the record clear and manageable.

POLICE MATTERS
This system is not connected to the Franklin Police Department. If your request involves a police matter or a records request from the police, we will close the request here and direct you to contact Franklin Police Department directly at (603) 934-2535.

QUESTIONS
If you have questions about how this system works or about a specific request, contact bdemers@franklinnh.gov`

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '40px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    maxWidth: '620px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    padding: '28px 32px',
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    color: '#e8eef6',
  },
  headerSub: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.85,
  },
  body: {
    padding: '32px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#1a56a0',
    marginBottom: '16px',
    paddingBottom: '6px',
    borderBottom: '2px solid #e2e8f0',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  labelHint: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '400',
    color: '#6b7280',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: '#111827',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: '#111827',
    resize: 'vertical',
    minHeight: '120px',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  required: {
    color: '#dc2626',
    marginLeft: '2px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    marginBottom: '24px',
  },
  checkbox: {
    marginTop: '2px',
    width: '16px',
    height: '16px',
    accentColor: '#1a56a0',
    flexShrink: 0,
  },
  checkboxText: {
    fontSize: '14px',
    color: '#1e3a5f',
    lineHeight: '1.5',
  },
  link: {
    color: '#1a56a0',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '14px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    letterSpacing: '0.3px',
  },
  submitBtnDisabled: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#93afd4',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    letterSpacing: '0.3px',
  },
  disclaimer: {
    marginTop: '20px',
    padding: '14px 16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  disclaimerTitle: {
    fontWeight: '700',
    color: '#374151',
    marginBottom: '4px',
    fontSize: '12px',
  },
  successPage: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '60px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  successCard: {
    maxWidth: '520px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    textAlign: 'center',
  },
  successHeader: {
    backgroundColor: '#1a56a0',
    padding: '28px 32px',
  },
  successIcon: {
    fontSize: '48px',
    color: '#ffffff',
    marginBottom: '8px',
  },
  successTitle: {
    color: '#ffffff',
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
  },
  successBody: {
    padding: '32px',
  },
  caseNumberBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '16px',
    margin: '20px 0',
  },
  caseNumberLabel: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  caseNumberValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a56a0',
  },
  successText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: '8px 0',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#1a56a0',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#e8eef6',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#e8eef6',
    fontSize: '20px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    padding: '14px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  modalCloseFooterBtn: {
    padding: '8px 20px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}

function PolicyModal({ onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Franklin Service Request System — Policy</h2>
          <button style={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>
          {POLICY_TEXT.split('\n\n').map((section, i) => {
            const lines = section.split('\n')
            const isHeading = lines[0] === lines[0].toUpperCase() && lines[0].trim().length > 0 && !lines[0].includes('bdemers')
            return (
              <div key={i} style={{ marginBottom: '16px' }}>
                {isHeading ? (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#1a56a0', marginBottom: '6px' }}>{lines[0]}</div>
                    {lines.slice(1).map((line, j) => (
                      <p key={j} style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 4px 0' }}>{line}</p>
                    ))}
                  </>
                ) : (
                  lines.map((line, j) => (
                    <p key={j} style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 4px 0' }}>{line}</p>
                  ))
                )}
              </div>
            )
          })}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.modalCloseFooterBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function SubmitForm() {
  const [issueTypes, setIssueTypes] = useState([])
  const [formData, setFormData] = useState({
    submitter_name: '',
    submitter_email: '',
    submitter_phone: '',
    location: '',
    description: '',
    issue_type_id: '',
    is_91a: false,
  })
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [caseNumber, setCaseNumber] = useState('')
  const [newCaseId, setNewCaseId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadFormData() {
      const { data: issueData } = await supabase.from('issue_types').select('*').order('name')
      setIssueTypes(issueData || [])
    }
    loadFormData()
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!policyAcknowledged) {
      alert('Please acknowledge the submission policy before submitting.')
      return
    }

    setLoading(true)

    // Validate email format if provided
    if (formData.submitter_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.submitter_email.trim())) {
        alert('Please enter a valid email address or leave the field blank.')
        setLoading(false)
        return
      }
    }

    // Generate case number
    const currentYear = new Date().getFullYear().toString().slice(-2)
    const { data: existingCases } = await supabase
      .from('cases')
      .select('sequence_number')
      .eq('year', parseInt(currentYear))
      .order('sequence_number', { ascending: false })
      .limit(1)

    const nextSequence = existingCases && existingCases.length > 0
      ? existingCases[0].sequence_number + 1
      : 1

    const newCaseNumber = `${nextSequence}-${currentYear}`

    const { data: statusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('name', 'Received')
      .single()

    // Insert case
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert([{
        case_number: newCaseNumber,
        sequence_number: nextSequence,
        year: parseInt(currentYear),
        date_submitted: new Date().toISOString(),
        location: formData.location,
        description: formData.description,
        issue_type_id: formData.issue_type_id || null,
        is_91a: formData.is_91a,
        submitter_name: formData.submitter_name,
        submitter_email: formData.submitter_email?.trim() || null,
        submitter_phone: formData.submitter_phone,
        status_id: statusData?.id || null,
        policy_acknowledged: true,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) {
      console.error('Error submitting case:', error)
      setLoading(false)
      return
    }

    // Auto-geocode road issue types
    const roadIssueTypes = ['Pothole', 'Crack / Pavement', 'Drainage', 'Heave', 'Signage / Traffic', 'Plowing / Sanding']
    const selectedIssueType = issueTypes.find(t => t.id === parseInt(formData.issue_type_id))
    if (selectedIssueType && roadIssueTypes.includes(selectedIssueType.name) && formData.location && newCase) {
      try {
        const geoQuery = `${formData.location}, Franklin, NH 03235`
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geoQuery)}&limit=1&countrycodes=us`,
          { headers: { 'User-Agent': 'CityOfFranklinNH-ServiceRequests/1.0' } }
        )
        const geoData = await geoRes.json()
        if (geoData && geoData.length > 0) {
          await supabase.from('cases').update({
            latitude: parseFloat(geoData[0].lat),
            longitude: parseFloat(geoData[0].lon),
          }).eq('id', newCase.id)
        }
      } catch (geoError) {
        console.error('Geocoding error:', geoError)
      }
    }

    // Create 91-A details record if needed
    if (formData.is_91a && newCase) {
      await supabase.from('details_91a').insert([{ case_id: newCase.id }])
    }

    // Auto-assign requestor ID for ALL cases
    if (newCase) {
      if (formData.submitter_name && formData.submitter_name.trim()) {
        const { data: existing } = await supabase
          .from('requestor_registry')
          .select('requestor_id')
          .ilike('requestor_name', formData.submitter_name.trim())
          .single()

        if (existing) {
          await supabase.from('cases').update({ requestor_id: existing.requestor_id }).eq('id', newCase.id)
        } else {
          const { data: allRids } = await supabase
            .from('requestor_registry')
            .select('requestor_id')
            .order('requestor_id', { ascending: false })
            .limit(1)
          const lastNum = allRids?.[0]?.requestor_id
            ? parseInt(allRids[0].requestor_id.replace('RID', ''))
            : 0
          const newRid = `RID${String(lastNum + 1).padStart(4, '0')}`
          await supabase.from('requestor_registry').insert([{
            requestor_name: formData.submitter_name.trim(),
            requestor_id: newRid,
          }])
          await supabase.from('cases').update({ requestor_id: newRid }).eq('id', newCase.id)
        }
      } else {
        await supabase.from('cases').update({ requestor_id: 'RID0050' }).eq('id', newCase.id)
      }
    }

    // Send confirmation email if email was provided
    if (formData.submitter_email) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: formData.submitter_email.trim(),
            caseNumber: newCaseNumber,
            location: formData.location,
            description: formData.description,
          }),
        })
      } catch (emailError) {
        console.error('Email error:', emailError)
      }
    }

    setNewCaseId(newCase.id)
    setCaseNumber(newCaseNumber)
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={styles.successPage}>
        <div style={styles.successCard}>
          <div style={styles.successHeader}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Request Submitted</h2>
          </div>
          <div style={styles.successBody}>
            <p style={styles.successText}>
              Thank you for contacting the City of Franklin. Your request has been received and will be reviewed shortly.
            </p>
            <div style={styles.caseNumberBox}>
              <div style={styles.caseNumberLabel}>Your Case Number</div>
              <div style={styles.caseNumberValue}>{caseNumber}</div>
            </div>
            <p style={styles.successText}>
              Please save your case number. You can use it to check the status of your request on our public dashboard.
            </p>
            <p style={styles.successText}>
              A confirmation email will be sent if you provided an email address.
            </p>
            <div style={{ marginTop: '20px', textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                📎 Attach Photos or Files (Optional)
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                You can attach up to 4 photos or documents (max 5MB each, 10MB total) to help describe your request.
              </div>
              {newCaseId && (
                <CaseFiles caseId={newCaseId} canUpload={true} uploadedBy="Public Submitter" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {showPolicyModal && <PolicyModal onClose={() => setShowPolicyModal(false)} />}

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Submit a Service Request</h1>
          <p style={styles.headerSub}>City of Franklin, New Hampshire</p>
        </div>
        <div style={styles.body}>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="is_91a"
              checked={formData.is_91a}
              onChange={handleChange}
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>
              This is a{' '}
              <a
                href="https://www.nhmunicipal.org/right-know-law"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1a56a0', fontWeight: '600' }}
              >
                Right-to-Know request (RSA 91-A)
              </a>
              {' '}— check this box if you are requesting public records under New Hampshire law.
            </span>
          </div>

          <div style={styles.sectionLabel}>Your Contact Information</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <span style={styles.labelHint}>Optional — you may submit anonymously</span>
            <input type="text" name="submitter_name" value={formData.submitter_name} onChange={handleChange} style={styles.input} placeholder="First and last name" />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <span style={styles.labelHint}>Optional — required to receive a confirmation email</span>
            <input type="email" name="submitter_email" value={formData.submitter_email} onChange={handleChange} style={styles.input} placeholder="you@example.com" />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Phone Number</label>
            <span style={styles.labelHint}>Optional</span>
            <input type="tel" name="submitter_phone" value={formData.submitter_phone} onChange={handleChange} style={styles.input} placeholder="(603) 000-0000" />
          </div>

          <hr style={styles.divider} />
          <div style={styles.sectionLabel}>Request Details</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              {formData.is_91a ? 'Subject of Request' : 'Location / Address of Issue'}
              {!formData.is_91a && <span style={styles.required}>*</span>}
            </label>
            <span style={styles.labelHint}>
              Street address or nearest intersection only — max 100 characters. Save details for the Description field below.
            </span>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required={!formData.is_91a}
              maxLength={100}
              style={styles.input}
              placeholder={formData.is_91a ? 'Brief subject of your records request' : 'e.g. 271 Central St or Central St & Bow St'}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Issue Type</label>
            <select name="issue_type_id" value={formData.issue_type_id} onChange={handleChange} style={styles.select}>
              <option value="">-- Select an issue type --</option>
              {issueTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Description <span style={styles.required}>*</span>
            </label>
            <span style={styles.labelHint}>
              This information will be visible on the public case tracker.
            </span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={styles.textarea}
              placeholder={formData.is_91a
                ? 'Describe the records you are requesting, including any relevant dates or details.'
                : 'Please describe the issue in as much detail as possible.'}
            />
          </div>

          <hr style={styles.divider} />

          {/* Policy acknowledgement */}
          <div style={{ ...styles.checkboxRow, backgroundColor: policyAcknowledged ? '#f0fdf4' : '#eff6ff', border: `1px solid ${policyAcknowledged ? '#86efac' : '#bfdbfe'}`, marginBottom: '16px' }}>
            <input
              type="checkbox"
              checked={policyAcknowledged}
              onChange={e => setPolicyAcknowledged(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>
              I have read and understand the{' '}
              <button style={styles.link} onClick={e => { e.preventDefault(); setShowPolicyModal(true) }}>
                Franklin Service Request System Policy
              </button>
              . <span style={{ color: '#dc2626', fontWeight: '600' }}>*</span>
            </span>
          </div>

          <div style={{ marginTop: '4px', marginBottom: '16px', padding: '10px 14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>
            📎 <strong>Want to attach a photo or file?</strong> After submitting you'll have the option to upload up to 4 photos or documents (max 5MB each).
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !policyAcknowledged}
            style={loading || !policyAcknowledged ? styles.submitBtnDisabled : styles.submitBtn}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>

          {!policyAcknowledged && (
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px', textAlign: 'center' }}>
              Please acknowledge the submission policy to continue.
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default SubmitForm
