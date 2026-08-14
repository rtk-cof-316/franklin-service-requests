import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '32px 24px', fontFamily: "'Segoe UI', Arial, sans-serif" },
  card: { maxWidth: '900px', margin: '0 auto' },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a56a0', margin: '0 0 4px 0' },
  subtitle: { fontSize: '13px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.5 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: '16px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', fontWeight: '600' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', minHeight: '110px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '12px' },
  jsonArea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', minHeight: '90px', fontFamily: 'Consolas, monospace', resize: 'vertical', marginBottom: '4px' },
  jsonError: { fontSize: '11px', color: '#dc2626', marginBottom: '10px' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginBottom: '8px' },
  button: { padding: '12px 24px', backgroundColor: '#1a56a0', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { padding: '12px 24px', backgroundColor: '#9ca3af', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
  buttonSecondary: { padding: '8px 16px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  buttonDanger: { padding: '6px 12px', backgroundColor: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  versionBadge: { fontSize: '12px', color: '#6b7280', marginBottom: '20px' },
  successBox: { backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#065f46' },
  errorBox: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' },
}

function AdminMouTemplates() {
  const [currentTemplate, setCurrentTemplate] = useState(null)
  const [sections, setSections] = useState([])
  const [jsonErrors, setJsonErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data: template } = await supabase.from('mou_templates').select('*').eq('is_current', true).single()
    setCurrentTemplate(template)
    if (template) {
      const { data: secs } = await supabase.from('mou_template_sections').select('*').eq('template_id', template.id).order('section_order')
      setSections((secs || []).map(sec => ({ ...sec, field_definitions_json: JSON.stringify(sec.field_definitions || [], null, 2) })))
    }
    setLoading(false)
  }

  function updateSection(index, patch) {
    setSections(prev => prev.map((sec, i) => (i === index ? { ...sec, ...patch } : sec)))
  }

  function handleJsonChange(index, value) {
    updateSection(index, { field_definitions_json: value })
    try {
      JSON.parse(value)
      setJsonErrors(prev => ({ ...prev, [index]: null }))
    } catch {
      setJsonErrors(prev => ({ ...prev, [index]: 'Invalid JSON' }))
    }
  }

  function addSection() {
    setSections(prev => [...prev, {
      id: `new-${Date.now()}`,
      title: 'New Section',
      locked_text: '',
      field_definitions_json: '[]',
      allow_section_comment: true,
    }])
  }

  function removeSection(index) {
    setSections(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSaveNewVersion() {
    setSaveError(null)
    setSaveMessage(null)
    const hasErrors = sections.some((_, i) => {
      try { JSON.parse(sections[i].field_definitions_json); return false } catch { return true }
    })
    if (hasErrors) {
      setSaveError('Fix invalid field definitions JSON before saving.')
      return
    }
    setSaving(true)
    const nextVersion = (currentTemplate?.version_number || 0) + 1
    const { data: newTemplate, error: templateErr } = await supabase
      .from('mou_templates')
      .insert([{ version_number: nextVersion, is_current: false, created_by: 'admin' }])
      .select()
      .single()
    if (templateErr || !newTemplate) {
      setSaveError('Failed to create new template version.')
      setSaving(false)
      return
    }
    const rows = sections.map((sec, i) => ({
      template_id: newTemplate.id,
      section_order: i,
      title: sec.title,
      locked_text: sec.locked_text,
      field_definitions: JSON.parse(sec.field_definitions_json),
      allow_section_comment: sec.allow_section_comment,
    }))
    const { error: sectionsErr } = await supabase.from('mou_template_sections').insert(rows)
    if (sectionsErr) {
      setSaveError('Failed to save sections for the new version.')
      setSaving(false)
      return
    }
    if (currentTemplate) {
      await supabase.from('mou_templates').update({ is_current: false }).eq('id', currentTemplate.id)
    }
    await supabase.from('mou_templates').update({ is_current: true }).eq('id', newTemplate.id)
    setSaveMessage(`Saved as version ${nextVersion}. In-progress submissions stay on their original template version.`)
    setSaving(false)
    await load()
  }

  if (loading) {
    return <div style={s.page}><div style={s.card}>Loading…</div></div>
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>MOU Master Template</h1>
        <p style={s.subtitle}>
          Editing here creates a new template version — it never changes the template underneath an MOU that's already in progress.
          Only new submissions started after saving will use these changes.
        </p>
        <div style={s.versionBadge}>Current version: {currentTemplate?.version_number ?? '—'}</div>

        {saveMessage && <div style={s.successBox}>{saveMessage}</div>}
        {saveError && <div style={s.errorBox}>{saveError}</div>}

        {sections.map((section, i) => (
          <div key={section.id} style={s.sectionCard}>
            <div style={s.sectionHeader}>
              <input style={{ ...s.input, marginBottom: 0, flex: 1 }} value={section.title} onChange={e => updateSection(i, { title: e.target.value })} />
              <button style={{ ...s.buttonDanger, marginLeft: '10px' }} onClick={() => removeSection(i)}>Remove</button>
            </div>
            <label style={s.label}>Locked Text (use {'{{field_key}}'} for inline fields)</label>
            <textarea style={s.textarea} value={section.locked_text} onChange={e => updateSection(i, { locked_text: e.target.value })} />
            <label style={s.label}>Field Definitions (JSON)</label>
            <textarea style={s.jsonArea} value={section.field_definitions_json} onChange={e => handleJsonChange(i, e.target.value)} />
            {jsonErrors[i] && <div style={s.jsonError}>{jsonErrors[i]}</div>}
            <label style={s.checkboxRow}>
              <input type="checkbox" checked={section.allow_section_comment} onChange={e => updateSection(i, { allow_section_comment: e.target.checked })} />
              Allow "suggest a change" comment box on this section
            </label>
          </div>
        ))}

        <button style={s.buttonSecondary} onClick={addSection}>+ Add Section</button>

        <div style={{ marginTop: '24px' }}>
          <button style={saving ? s.buttonDisabled : s.button} disabled={saving} onClick={handleSaveNewVersion}>
            {saving ? 'Saving…' : 'Save as New Version'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminMouTemplates
