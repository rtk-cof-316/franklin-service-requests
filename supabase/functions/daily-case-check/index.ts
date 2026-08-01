import { resolveDepartmentRecipients } from '../_shared/departmentRecipients.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BREVO_SENDER = { name: 'Franklin Service Request System', email: 'noreply.franklin.sr@gmail.com' }

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function latestDate(...dates: (string | null | undefined)[]): string {
  return dates.filter(Boolean).sort().pop() as string
}

async function sendBrevoEmail(brevoKey: string, to: string, subject: string, htmlContent: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
    body: JSON.stringify({ sender: BREVO_SENDER, to: [{ email: to }], subject, htmlContent }),
  })
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const brevoKey = Deno.env.get('BREVO_API_KEY')!
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'
  const authHeaders = { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }

  // Look up City Manager's department id once — only used as a resolveDepartmentRecipients
  // argument, which short-circuits on the name override anyway, but keeps the call sensible.
  const cmDeptRes = await fetch(`${supabaseUrl}/rest/v1/departments?name=eq.City%20Manager&select=id`, { headers: authHeaders })
  const cmDeptRows = await cmDeptRes.json()
  const cmDepartmentId = cmDeptRows?.[0]?.id ?? null

  const cdRes = await fetch(
    `${supabaseUrl}/rest/v1/case_departments?select=id,case_id,department_id,status_changed_at,created_at,escalated_at,departments(name),statuses(name,is_closing),cases(case_number,location,description)`,
    { headers: authHeaders }
  )
  const caseDepts = await cdRes.json()
  const openAssignments = (caseDepts || []).filter((cd: any) => cd.statuses && !cd.statuses.is_closing)

  if (openAssignments.length === 0) {
    return new Response(JSON.stringify({ success: true, remindersSent: 0, escalationsFired: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // A department is "working on it" if there's been a status change, a public comment, or an
  // internal note on the case — not just a formal status change. Pull the latest of each per
  // case (bulk, not N+1) and combine with each assignment's own status_changed_at/created_at.
  const caseIds = [...new Set(openAssignments.map((cd: any) => cd.case_id))]
  const caseIdFilter = `in.(${caseIds.join(',')})`

  const [commentsRes, notesRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/case_comments?select=case_id,created_at&case_id=${caseIdFilter}`, { headers: authHeaders }),
    fetch(`${supabaseUrl}/rest/v1/internal_notes?select=case_id,created_at&case_id=${caseIdFilter}`, { headers: authHeaders }),
  ])
  const comments = await commentsRes.json()
  const notes = await notesRes.json()

  const lastCommentByCase: Record<string, string> = {}
  for (const c of comments || []) {
    lastCommentByCase[c.case_id] = latestDate(lastCommentByCase[c.case_id], c.created_at)
  }
  const lastNoteByCase: Record<string, string> = {}
  for (const n of notes || []) {
    lastNoteByCase[n.case_id] = latestDate(lastNoteByCase[n.case_id], n.created_at)
  }

  for (const cd of openAssignments) {
    cd.lastActivityAt = latestDate(
      cd.status_changed_at,
      lastCommentByCase[cd.case_id],
      lastNoteByCase[cd.case_id],
      cd.created_at,
    )
  }

  // ─── 3-Day Silence Reminders (grouped per department, one digest email) ───
  const reminderGroups: Record<string, { departmentId: number; departmentName: string; cases: any[] }> = {}

  for (const cd of openAssignments) {
    const days = daysSince(cd.lastActivityAt)
    if (days < 3 || days % 3 !== 0) continue
    const deptName = cd.departments?.name
    if (!deptName) continue
    if (!reminderGroups[deptName]) {
      reminderGroups[deptName] = { departmentId: cd.department_id, departmentName: deptName, cases: [] }
    }
    reminderGroups[deptName].cases.push({
      caseNumber: cd.cases?.case_number,
      location: cd.cases?.location,
      description: cd.cases?.description,
      daysWaiting: days,
    })
  }

  let remindersSent = 0
  for (const group of Object.values(reminderGroups)) {
    const emails = await resolveDepartmentRecipients(group.departmentId, group.departmentName, serviceRoleKey, supabaseUrl)
    if (emails.length === 0) continue

    const rowsHtml = group.cases.map(c => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #1a56a0;">#${c.caseNumber}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${c.location || '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${c.daysWaiting} days</td>
      </tr>
    `).join('')

    const subject = `Action Required — ${group.cases.length} Case${group.cases.length === 1 ? '' : 's'} Awaiting Update`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a56a0; padding: 24px 32px;">
          <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">Franklin Service Request System</h1>
          <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Automated System Reminder</p>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb;">
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px;">Action Required</div>
            <div style="font-size: 13px; color: #92400e;">${group.departmentName}, the following case${group.cases.length === 1 ? ' has' : 's have'} had no comment or status update in 3+ days:</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Case</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Location</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Waiting</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div style="margin: 24px 0;">
            <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Log In to Update These Cases
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
            This is an automated system reminder sent every 3 days until there's a comment or status update. Please do not reply to this email.
          </div>
        </div>
        <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
          City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
        </div>
      </div>
    `
    for (const email of emails) {
      await sendBrevoEmail(brevoKey, email, subject, htmlContent)
      remindersSent++
    }
  }

  // ─── 2-Week Escalation ──────────────────────────────────────────────
  // Escalates once per silence period: eligible if never escalated, or if there's been fresh
  // activity since the last escalation (meaning a new 2-week silence window has since elapsed).
  let escalationsFired = 0
  for (const cd of openAssignments) {
    const daysQuiet = daysSince(cd.lastActivityAt)
    if (daysQuiet < 14) continue
    if (cd.escalated_at && cd.escalated_at >= cd.lastActivityAt) continue

    const deptName = cd.departments?.name
    const caseNumber = cd.cases?.case_number
    const location = cd.cases?.location
    const description = cd.cases?.description
    const reasonText = `No comment or status update has been logged for this case in over 2 weeks (last activity ${daysQuiet} days ago).`

    // Department-facing warning
    const deptEmails = await resolveDepartmentRecipients(cd.department_id, deptName, serviceRoleKey, supabaseUrl)
    const deptSubject = `⚠️ Case #${caseNumber} Will Be Escalated to the City Manager's Office`
    const deptHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #d97706; padding: 24px 32px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Case Escalation Notice</h1>
          <p style="color: #fef3c7; margin: 4px 0 0 0; font-size: 13px;">Franklin Service Request System</p>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb;">
          <p style="font-size: 15px; color: #111827;"><strong>${deptName}</strong>, this case has gone 2+ weeks with no comment or status update. Because it's crossed the 2-week mark, we're notifying the City Manager's Office so they're aware.</p>
          <p style="font-size: 13px; color: #6b7280;">This case is still yours to resolve — nothing has been reassigned.</p>
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #92400e; margin-bottom: 4px;">Case Number</div>
            <div style="font-size: 28px; font-weight: 700; color: #92400e;">#${caseNumber}</div>
          </div>
          <p style="font-size: 14px; color: #374151;"><strong>Location:</strong> ${location || '—'}</p>
          <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
          <div style="margin: 24px 0;">
            <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Log In to Update This Case
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
            This is an automated notification. Please do not reply to this email.
          </div>
        </div>
        <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
          City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
        </div>
      </div>
    `
    for (const email of deptEmails) {
      await sendBrevoEmail(brevoKey, email, deptSubject, deptHtml)
    }

    // City Manager's Office notice
    const cmEmails = await resolveDepartmentRecipients(cmDepartmentId, 'City Manager', serviceRoleKey, supabaseUrl)
    const cmSubject = `🔺 Escalation — Case #${caseNumber} Open 2+ Weeks (${deptName})`
    const assignedDateFormatted = new Date(cd.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const cmHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #991b1b; padding: 24px 32px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Escalation Notice</h1>
          <p style="color: #fecaca; margin: 4px 0 0 0; font-size: 13px;">Franklin Service Request System</p>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb;">
          <p style="font-size: 15px; color: #111827;">A service request assigned to <strong>${deptName}</strong> has passed the City's 2-week response threshold.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; width: 160px;">Case Number</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">#${caseNumber}</td></tr>
              <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Assigned Department</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${deptName}</td></tr>
              <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Date Assigned</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${assignedDateFormatted}</td></tr>
              <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Days Since Last Activity</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${daysQuiet} days</td></tr>
              <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Location</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${location || '—'}</td></tr>
              <tr><td style="padding: 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; vertical-align: top;">Description</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${description}</td></tr>
            </tbody>
          </table>
          <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #991b1b; margin-bottom: 4px;">Reason for Escalation</div>
            <div style="font-size: 13px; color: #991b1b;">${reasonText}</div>
          </div>
          <div style="margin: 24px 0;">
            <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #991b1b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Review Case in Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
            This is an automated notification sent to the City Manager's Office. Please do not reply to this email.
          </div>
        </div>
        <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
          City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
        </div>
      </div>
    `
    for (const email of cmEmails) {
      await sendBrevoEmail(brevoKey, email, cmSubject, cmHtml)
    }

    // Mark escalated so this doesn't re-fire until fresh activity restarts a new silence period
    await fetch(`${supabaseUrl}/rest/v1/case_departments?id=eq.${cd.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ escalated_at: new Date().toISOString() }),
    })
    await fetch(`${supabaseUrl}/rest/v1/case_audit_log`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        case_id: cd.case_id,
        action: `Escalated to City Manager's Office — no comment or status update in 2+ weeks`,
        performed_by: 'System Notification',
        created_at: new Date().toISOString(),
      }),
    })
    escalationsFired++
  }

  return new Response(JSON.stringify({ success: true, remindersSent, escalationsFired }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
