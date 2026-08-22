import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { resolveSectionText } from './mouTextRender'

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const s = {
  page: { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#111827', maxWidth: '800px', margin: '0 auto', padding: '0 28px' },
  header: { textAlign: 'center', padding: '24px 0', borderBottom: '2px solid #111827', marginBottom: '20px' },
  headerTitle: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' },
  headerSub: { margin: 0, fontSize: '11px', color: '#6b7280' },
  sectionTitle: { fontSize: '13px', fontWeight: '700', marginTop: '20px', marginBottom: '8px' },
  sectionText: { fontSize: '12px', lineHeight: 1.7, whiteSpace: 'pre-wrap', textAlign: 'left' },
  footer: { textAlign: 'center', fontSize: '10px', color: '#9ca3af', padding: '20px 0', borderTop: '1px solid #e5e7eb', marginTop: '30px' },
  noPrint: { textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
}

function PrintMouAgreement({ submissionId, onClose }) {
  const [submission, setSubmission] = useState(null)
  const [sections, setSections] = useState([])
  const [valuesByKey, setValuesByKey] = useState({})
  const [editedTextBySectionId, setEditedTextBySectionId] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [submissionId])

  async function load() {
    setLoading(true)
    const { data: sub } = await supabase.from('mou_submissions').select('*').eq('id', submissionId).single()
    if (sub) {
      setSubmission(sub)
      const [secRes, valRes, textRes] = await Promise.all([
        supabase.from('mou_template_sections').select('*').eq('template_id', sub.template_id).order('section_order'),
        supabase.from('mou_submission_field_values').select('*').eq('submission_id', submissionId),
        supabase.from('mou_submission_section_text').select('*').eq('submission_id', submissionId),
      ])
      setSections(secRes.data || [])
      const values = {}
      for (const fv of valRes.data || []) values[fv.field_key] = fv.value
      setValuesByKey(values)
      setEditedTextBySectionId(Object.fromEntries((textRes.data || []).map(row => [row.template_section_id, row.edited_text])))
    }
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>Loading agreement…</div>
  }
  if (!submission) {
    return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>Submission not found.</div>
  }

  const fieldsByKey = {}
  for (const section of sections) {
    for (const field of section.field_definitions || []) fieldsByKey[field.key] = field
  }

  return (
    <div>
      <div style={s.noPrint} className="no-print">
        <button onClick={() => window.print()} style={{ padding: '8px 20px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>
          🖨️ Print / Save as PDF
        </button>
        <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>

      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerTitle}>MEMORANDUM OF UNDERSTANDING</div>
          <div style={s.headerSub}>{submission.org_name} &nbsp;|&nbsp; {submission.submission_number} &nbsp;|&nbsp; Prepared for City Council {formatDateTime(new Date().toISOString())}</div>
          <div style={{ ...s.headerSub, marginTop: '4px', fontStyle: 'italic' }}>This document is not the final legal state of the agreement until executed following City Council review.</div>
        </div>

        {sections.map(section => (
          <div key={section.id}>
            <div style={s.sectionTitle}>{section.title}</div>
            <div style={s.sectionText}>{resolveSectionText(section, valuesByKey, fieldsByKey, editedTextBySectionId[section.id])}</div>
          </div>
        ))}

        <div style={s.footer}>
          City of Franklin, New Hampshire &nbsp;|&nbsp; MOU Module &nbsp;|&nbsp; Exported {formatDateTime(new Date().toISOString())}
        </div>
      </div>
    </div>
  )
}

export default PrintMouAgreement
