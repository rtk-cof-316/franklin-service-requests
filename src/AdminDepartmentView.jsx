import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import DepartmentDashboard from './DepartmentDashboard'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '32px 24px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a56a0',
    margin: '0 0 4px 0',
  },
  pageSub: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px 0',
  },
  picker: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    minWidth: '260px',
    marginBottom: '24px',
  },
  empty: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
    fontStyle: 'italic',
  },
}

function AdminDepartmentView({ onViewCase, refreshKey, onBulkPrint }) {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')

  useEffect(() => {
    async function loadDepartments() {
      const { data } = await supabase.from('departments').select('id, name').order('name')
      setDepartments(data || [])
    }
    loadDepartments()
  }, [])

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Department Dashboards</h1>
      <p style={styles.pageSub}>View any department's cases and performance stats, read-only.</p>

      <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={styles.picker}>
        <option value="">-- Select a department --</option>
        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      {selectedDept ? (
        <DepartmentDashboard
          key={selectedDept}
          departmentId={parseInt(selectedDept)}
          onViewCase={onViewCase}
          refreshKey={refreshKey}
          onBulkPrint={onBulkPrint}
          isAdminView
        />
      ) : (
        <div style={styles.empty}>Pick a department above to view its dashboard.</div>
      )}
    </div>
  )
}

export default AdminDepartmentView
