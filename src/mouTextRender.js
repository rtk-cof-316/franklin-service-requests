// Shared locked-text token parsing for the MOU module's fill/review views (MouSubmit,
// MouStatus, MouSubmissionDetail). Each of those needs to know, per {{field_key}} token,
// whether to show the real value, an empty-placeholder bracket, or "Not Applicable" for a
// conditional field (e.g. bonding_terms) whose toggle isn't "yes" — this was previously
// duplicated three times and only handled the "real value vs. placeholder" case, not the
// conditional one, so a "No" toggle rendered the raw placeholder instead of "Not
// Applicable". PrintMouAgreement.jsx has its own plain-text version of this same rule
// since it renders to a string, not JSX segments.
//
// resolveSectionText() below is the ONE function every admin-edit/org-review/print call
// site uses post-rework — never reimplement its fallback logic a second time. The whole
// point of centralizing it here is that the exact bug described above (rules drifting
// across duplicated copies) is trivially easy to reintroduce otherwise.

export function buildFieldsByKey(sections) {
  const fieldsByKey = {}
  for (const section of sections || []) {
    for (const field of section.field_definitions || []) fieldsByKey[field.key] = field
  }
  return fieldsByKey
}

// Splits locked_text into an ordered list of segments: { type: 'text', text } for literal
// text, or { type: 'field', key, displayValue, isBlank } for a {{field_key}} token.
// displayValue is the real value, "Not Applicable" for an unmet conditional field, or null
// if it's genuinely still blank (caller renders its own placeholder bracket for that case).
export function parseMouLockedText(text, valuesByKey, fieldsByKey) {
  const parts = (text || '').split(/(\{\{[a-z_]+\}\})/g)
  return parts.map(part => {
    const m = part.match(/^\{\{([a-z_]+)\}\}$/)
    if (!m) return { type: 'text', text: part }
    const key = m[1]
    const fieldDef = fieldsByKey[key]
    if (fieldDef?.conditional_on && valuesByKey[fieldDef.conditional_on] !== 'yes') {
      return { type: 'field', key, displayValue: 'Not Applicable', isBlank: false }
    }
    const value = valuesByKey[key]
    return { type: 'field', key, displayValue: value || null, isBlank: !value }
  })
}

// Plain-string equivalent of parseMouLockedText, for contexts that need a single string
// rather than JSX segments (the org's whole-document review page, print).
export function renderTokenSubstitutedText(text, valuesByKey, fieldsByKey) {
  return parseMouLockedText(text, valuesByKey, fieldsByKey)
    .map(seg => (seg.type === 'text' ? seg.text : (seg.displayValue || '_____________')))
    .join('')
}

// Prefers an admin's saved edited_text for this section (mou_submission_section_text);
// falls back to token substitution only for sections no admin has ever touched. Call this
// the same way everywhere a section's "real" text is needed — MouSubmissionDetail.jsx's
// editable textarea seed, MouStatus.jsx's page-2 review, and PrintMouAgreement.jsx.
export function resolveSectionText(section, valuesByKey, fieldsByKey, editedText) {
  return editedText || renderTokenSubstitutedText(section.locked_text, valuesByKey, fieldsByKey)
}
