// Shown under the department status field. The names come from the departments marked
// inactive (departments.is_active = false), so the notice stays accurate if that list changes.
function RetiredDepartmentsNote({ names, style }) {
  if (!names || names.length === 0) return null
  return (
    <div
      style={{
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '6px',
        padding: '10px 12px',
        margin: '0 0 12px 0',
        fontSize: '12px',
        lineHeight: 1.5,
        color: '#92400e',
        textAlign: 'left',
        ...style,
      }}
    >
      <strong>{names.join(', ')}</strong> {names.length === 1 ? 'does' : 'do'} not use this system, so cases can't be
      referred to {names.length === 1 ? 'it' : 'them'} here. If a case needs to go to {names.length === 1 ? 'that department' : 'one of those departments'},
      email them directly, close out the case on your end, and add a public comment saying who has the case and why.
    </div>
  )
}

export default RetiredDepartmentsNote
