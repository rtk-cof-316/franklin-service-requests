const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// The actual computation runs server-side (department-performance edge function, service role
// key) since it needs to see every department's cases and audit log entries for the citywide
// comparison, and reconstructing resolution time means parsing case_audit_log -- see that
// function for why case_departments/cases timestamps alone aren't trustworthy for this.
export async function loadDepartmentPerformance(departmentId) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/department-performance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ departmentId }),
  })
  return res.json()
}
