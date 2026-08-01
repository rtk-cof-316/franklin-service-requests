// Some departments have no user_profiles set up (rarely get requests) or need
// notifications routed to a fixed address instead of whoever's logged in as
// that department. This override map takes precedence over the dynamic
// user_profiles -> Admin Auth API lookup used for every other department.
const DEPARTMENT_EMAIL_OVERRIDES: Record<string, string[]> = {
  'City Manager': ['bdemers@franklinnh.gov', 'citymgr@franklinnh.gov'],
  'IT': ['bdemers@franklinnh.gov'],
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
