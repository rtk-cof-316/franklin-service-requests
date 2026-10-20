// Some departments have no user_profiles set up (rarely get requests) or need
// notifications routed to a fixed address instead of whoever's logged in as
// that department. This override map takes precedence over the dynamic
// user_profiles -> Admin Auth API lookup used for every other department.
const DEPARTMENT_EMAIL_OVERRIDES: Record<string, string[]> = {
  'City Manager': ['bdemers@franklinnh.gov', 'citymgr@franklinnh.gov'],
  'IT': ['bdemers@franklinnh.gov'],
  // Assessing has one real user_profiles account (assessingdept@franklinnh.gov, split out
  // of the old PZA department bucket on 2026-09-17) plus everyone currently on Fire/Code —
  // a one-time snapshot of Fire/Code's roster as of 2026-09-17, not a live mirror. If
  // Fire/Code's roster changes later, update this list by hand to match.
  'Assessing': ['AssessingDept@franklinnh.gov', 'mfoss@franklinnh.gov', 'sbreault@franklinnh.gov', 'dhall@franklinnh.gov', 'fdoffice@franklinnh.gov'],
}

// Addresses that already get their own alert for every new case ('admin_new_case' in
// send-confirmation-email) and so are left off the per-department "New Case Assigned"
// email — otherwise they receive two emails for the same case.
const CASE_ASSIGNMENT_EXCLUDED = new Set(['bdemers@franklinnh.gov'])

// Recipients for the "New Case Assigned" email (auto-routing on submission, manual
// assignment, and referrals). Reminders, escalations, and the JLC notice deliberately keep
// using resolveDepartmentRecipients so those still reach everyone on the department's list.
export async function resolveCaseAssignmentRecipients(
  departmentId: number,
  departmentName: string,
  serviceRoleKey: string,
  supabaseUrl: string,
): Promise<string[]> {
  const all = await resolveDepartmentRecipients(departmentId, departmentName, serviceRoleKey, supabaseUrl)
  return all.filter(email => !CASE_ASSIGNMENT_EXCLUDED.has(email.toLowerCase()))
}

export async function resolveDepartmentRecipients(
  departmentId: number,
  departmentName: string,
  serviceRoleKey: string,
  supabaseUrl: string,
): Promise<string[]> {
  const override = DEPARTMENT_EMAIL_OVERRIDES[departmentName]
  if (override) return override

  const profilesRes = await fetch(
    `${supabaseUrl}/rest/v1/user_profiles?department_id=eq.${departmentId}&select=user_id`,
    { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
  )
  const profiles = await profilesRes.json()
  if (!profiles || profiles.length === 0) return []

  const emails: string[] = []
  for (const profile of profiles) {
    const userRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${profile.user_id}`,
      { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
    )
    const user = await userRes.json()
    if (user?.email) emails.push(user.email)
  }
  return emails
}
