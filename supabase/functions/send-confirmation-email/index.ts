import { resolveDepartmentRecipients } from '../_shared/departmentRecipients.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shared HTML shell for the MOU module's notification emails — used by all mou_* branches
// below. The rest of this file's email types were each written in separate phases (which
// is why they're inlined individually); these seven are all new in the same pass, so
// factoring out the repeated wrapper avoids seven near-identical copies of the same markup.
function mouEmailShell(eyebrow: string, headline: string, bodyHtml: string, ctaLabel: string, ctaUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a56a0; padding: 24px 32px;">
        <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
        <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">${eyebrow}</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb;">
        <p style="font-size: 15px; color: #111827; font-weight: 600;">${headline}</p>
        ${bodyHtml}
        <div style="margin: 24px 0;">
          <a href="${ctaUrl}" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            ${ctaLabel}
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
          <strong>Please do not reply to this email.</strong> This is an automated notification from the City of Franklin MOU module.
        </div>
      </div>
      <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
        City of Franklin, New Hampshire &nbsp;|&nbsp; MOU Module
      </div>
    </div>
  `
}

// Same shell as mouEmailShell, adapted for the CAR / Agenda / Packet module's notifications.
function carEmailShell(eyebrow: string, headline: string, bodyHtml: string, ctaLabel: string, ctaUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a56a0; padding: 24px 32px;">
        <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
        <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">${eyebrow}</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb;">
        <p style="font-size: 15px; color: #111827; font-weight: 600;">${headline}</p>
        ${bodyHtml}
        <div style="margin: 24px 0;">
          <a href="${ctaUrl}" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            ${ctaLabel}
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
          <strong>Please do not reply to this email.</strong> This is an automated notification from the City of Franklin CAR / Agenda module.
        </div>
      </div>
      <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
        City of Franklin, New Hampshire &nbsp;|&nbsp; CAR / Agenda Module
      </div>
    </div>
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.json()
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'

  // ─── Auto-Assign Department on Submission ─────────────────────────
  // Runs with the service role key because the public submission form uses the anon
  // role, which RLS deliberately keeps out of case_departments/case_audit_log so
  // arbitrary visitors can't write department assignments or audit entries directly.
  if (body.type === 'auto_assign_department') {
    const { caseId, departmentId, issueTypeName, caseNumber, location, description } = body
    const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }

    const [deptRes, statusRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/departments?id=eq.${departmentId}&select=name`, { headers: authHeaders }),
      fetch(`${supabaseUrl}/rest/v1/statuses?name=eq.Received&select=id`, { headers: authHeaders }),
    ])
    const departmentName = (await deptRes.json())?.[0]?.name
    const receivedStatusId = (await statusRes.json())?.[0]?.id

    await fetch(`${supabaseUrl}/rest/v1/case_departments`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        case_id: caseId,
        department_id: departmentId,
        status_id: receivedStatusId,
        status_changed_at: new Date().toISOString(),
      }),
    })
    await fetch(`${supabaseUrl}/rest/v1/case_audit_log`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        case_id: caseId,
        action: `Auto-assigned to ${departmentName || 'department'} based on issue type "${issueTypeName}"`,
        performed_by: 'System (auto-routing)',
        created_at: new Date().toISOString(),
      }),
    })

    const emails = await resolveDepartmentRecipients(departmentId, departmentName, serviceRoleKey, supabaseUrl)
    const results = []
    for (const email of emails) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
          to: [{ email }],
          subject: `New Case Assigned — Case #${caseNumber}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1a56a0; padding: 24px 32px;">
                <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
                <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Case Assignment Notification</p>
              </div>
              <div style="padding: 32px; border: 1px solid #e5e7eb;">
                <p style="font-size: 15px; color: #111827;">A new service request has been automatically assigned to <strong>${departmentName}</strong> based on its issue type (${issueTypeName}).</p>
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px;">Case Number</div>
                  <div style="font-size: 28px; font-weight: 700; color: #1a56a0;">#${caseNumber}</div>
                </div>
                <p style="font-size: 14px; color: #374151;"><strong>Location:</strong> ${location || '—'}</p>
                <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
                <div style="margin: 24px 0;">
                  <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    Log In to View Your Cases
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                  <strong>Please do not reply to this email.</strong> This is an automated notification. Log in to the staff portal to update the case status or add notes.
                </div>
              </div>
              <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
                City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
              </div>
            </div>
          `,
        }),
      })
      const data = await res.json()
      results.push(data)
    }
    return new Response(JSON.stringify({ success: true, departmentName, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Assign Requestor ID ───────────────────────────────────────────
  // Runs with the service role key for the same reason as auto_assign_department:
  // RLS blocks the anon role from inserting into requestor_registry or updating
  // cases.requestor_id, so a direct client-side write silently no-ops. This mirrors
  // the exact matching logic that used to live in SubmitForm.jsx (case-insensitive
  // name match against the registry; reuse the existing ID or mint the next one).
  if (body.type === 'assign_requestor_id') {
    const { caseId, submitterName } = body
    const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
    const name = (submitterName || '').trim()

    let requestorId
    if (name) {
      const lookupRes = await fetch(
        `${supabaseUrl}/rest/v1/requestor_registry?requestor_name=ilike.${encodeURIComponent(name)}&select=requestor_id`,
        { headers: authHeaders }
      )
      const existing = (await lookupRes.json())?.[0]

      if (existing) {
        requestorId = existing.requestor_id
      } else {
        const allRes = await fetch(
          `${supabaseUrl}/rest/v1/requestor_registry?select=requestor_id&order=requestor_id.desc&limit=1`,
          { headers: authHeaders }
        )
        const last = (await allRes.json())?.[0]
        const lastNum = last?.requestor_id ? parseInt(last.requestor_id.replace('RID', '')) : 0
        requestorId = `RID${String(lastNum + 1).padStart(4, '0')}`

        await fetch(`${supabaseUrl}/rest/v1/requestor_registry`, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ requestor_name: name, requestor_id: requestorId }),
        })
      }
    } else {
      requestorId = 'RID0050'
    }

    await fetch(`${supabaseUrl}/rest/v1/cases?id=eq.${caseId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ requestor_id: requestorId }),
    })

    return new Response(JSON.stringify({ success: true, requestorId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Department Assignment Notification ───────────────────────────
  if (body.type === 'department_assignment') {
    const { departmentId, caseNumber, location, description, departmentName } = body

    const emails = await resolveDepartmentRecipients(departmentId, departmentName, serviceRoleKey, supabaseUrl)

    if (emails.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No recipients for department' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = []
    for (const email of emails) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
          to: [{ email }],
          subject: `New Case Assigned — Case #${caseNumber}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1a56a0; padding: 24px 32px;">
                <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
                <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Case Assignment Notification</p>
              </div>
              <div style="padding: 32px; border: 1px solid #e5e7eb;">
                <p style="font-size: 15px; color: #111827;">A new service request has been assigned to <strong>${departmentName}</strong>.</p>
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px;">Case Number</div>
                  <div style="font-size: 28px; font-weight: 700; color: #1a56a0;">#${caseNumber}</div>
                </div>
                <p style="font-size: 14px; color: #374151;"><strong>Location:</strong> ${location || '—'}</p>
                <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
                <div style="margin: 24px 0;">
                  <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    Log In to View Your Cases
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                  <strong>Please do not reply to this email.</strong> This is an automated notification. Log in to the staff portal to update the case status or add notes.
                </div>
              </div>
              <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
                City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
              </div>
            </div>
          `,
        }),
      })
      const data = await res.json()
      results.push(data)
    }
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Case Closed Notification ─────────────────────────────────────
  if (body.type === 'case_closed') {
    const { email, caseNumber, location, description } = body

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email }],
        subject: `Your Service Request Has Been Resolved — Case #${caseNumber}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a56a0; padding: 24px 32px;">
              <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
              <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Service Request Update</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb;">
              <p style="font-size: 15px; color: #111827;">Good news! Your service request has been resolved.</p>
              <div style="background-color: #d1fae5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #065f46; margin-bottom: 4px;">Case Number</div>
                <div style="font-size: 28px; font-weight: 700; color: #065f46;">#${caseNumber}</div>
                <div style="font-size: 14px; color: #065f46; margin-top: 6px; font-weight: 600;">Resolved</div>
              </div>
              <p style="font-size: 14px; color: #374151;"><strong>Location / Subject:</strong> ${location || '—'}</p>
              <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
              <div style="margin: 24px 0;">
                <a href="https://franklin-service-requests-39a5.vercel.app/?page=track" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Your Case
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                <strong>Please do not reply to this email.</strong> If you have questions, contact the City Manager's Office at <a href="mailto:bdemers@franklinnh.gov" style="color: #1a56a0;">bdemers@franklinnh.gov</a>.
              </div>
            </div>
            <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
              City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
            </div>
          </div>
        `,
      }),
    })
    const data = await res.json()
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── Admin New Case Notification ──────────────────────────────────
  if (body.type === 'admin_new_case') {
    const { caseNumber, location, description, issueType, submitterName } = body

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'Franklin Service Request System', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: 'bdemers@franklinnh.gov' }],
        subject: `📬 New Request Just Came In — Case #${caseNumber}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a56a0; padding: 24px 32px;">
              <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">Hey, a new request just landed! 👋</h1>
              <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Franklin Service Request System</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb;">
              <p style="font-size: 15px; color: #111827;">No need to panic — it's just a new service request. Here's what came in:</p>
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px;">Case Number</div>
                <div style="font-size: 28px; font-weight: 700; color: #1a56a0;">#${caseNumber}</div>
              </div>
              <p style="font-size: 14px; color: #374151;"><strong>From:</strong> ${submitterName || 'Anonymous'}</p>
              <p style="font-size: 14px; color: #374151;"><strong>Issue Type:</strong> ${issueType || '—'}</p>
              <p style="font-size: 14px; color: #374151;"><strong>Location:</strong> ${location || '—'}</p>
              <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
              <p style="font-size: 13px; color: #6b7280; font-style: italic;">Take a breath — you've got this. 💙</p>
              <div style="margin: 24px 0;">
                <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View in Admin Dashboard
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                This is an automated notification for Brenda Demers, City Manager's Office. Please do not reply to this email.
              </div>
            </div>
            <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
              City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
            </div>
          </div>
        `,
      }),
    })
    const data = await res.json()
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ─── MOU Module Notifications ─────────────────────────────────────
  const MOU_APP_URL = 'https://franklin-service-requests-39a5.vercel.app/?page=admin-mou-submissions'
  const MOU_STATUS_URL = 'https://franklin-service-requests-39a5.vercel.app/?page=mou-status'

  if (body.type === 'mou_submitted') {
    const { submissionNumber, orgName, toEmail, toName } = body
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject: `New MOU Submission — ${submissionNumber}`,
        htmlContent: mouEmailShell(
          'New MOU Submission',
          `A new MOU proposal from ${orgName} is ready for review.`,
          `<p style="font-size: 14px; color: #374151;"><strong>Submission Number:</strong> ${submissionNumber}</p>`,
          'Review in Admin Dashboard', MOU_APP_URL
        ),
      }),
    })
    return new Response(JSON.stringify({ success: true, data: await res.json() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'mou_org_resubmitted') {
    const { submissionNumber, orgName, toEmail, toName } = body
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject: `MOU Resubmitted — ${submissionNumber}`,
        htmlContent: mouEmailShell(
          'MOU Resubmitted',
          `${orgName} has responded and resubmitted their MOU. It's ready for your review again.`,
          `<p style="font-size: 14px; color: #374151;"><strong>Submission Number:</strong> ${submissionNumber}</p>`,
          'Review in Admin Dashboard', MOU_APP_URL
        ),
      }),
    })
    return new Response(JSON.stringify({ success: true, data: await res.json() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'mou_sent_back_to_org') {
    const { submissionNumber, orgEmail, orgName, notes } = body
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: orgEmail, name: orgName }],
        subject: `Action Needed on Your MOU Submission — ${submissionNumber}`,
        htmlContent: mouEmailShell(
          'Action Needed',
          `The City has requested changes or clarification on your MOU submission (${submissionNumber}).`,
          `${notes ? `<p style="font-size: 14px; color: #374151;"><strong>Note from the City:</strong> ${notes}</p>` : ''}
           <p style="font-size: 14px; color: #374151;">Use your submission number and PIN to review the request, make updates, and resubmit.</p>`,
          'Check Status & Update', MOU_STATUS_URL
        ),
      }),
    })
    return new Response(JSON.stringify({ success: true, data: await res.json() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'mou_pushed_to_city_manager') {
    const { submissionNumber, orgName } = body
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' }],
        subject: `MOU Ready for Your Review — ${submissionNumber}`,
        htmlContent: mouEmailShell(
          'City Manager Review',
          `The MOU submission from ${orgName} has cleared initial review and is ready for your review.`,
          `<p style="font-size: 14px; color: #374151;"><strong>Submission Number:</strong> ${submissionNumber}</p>`,
          'Review in Admin Dashboard', MOU_APP_URL
        ),
      }),
    })
    return new Response(JSON.stringify({ success: true, data: await res.json() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'mou_sent_back_to_brenda') {
    const { submissionNumber, orgName } = body
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' }],
        subject: `MOU Sent Back for Your Review — ${submissionNumber}`,
        htmlContent: mouEmailShell(
          'Sent Back for Your Review',
          `The City Manager has sent the MOU submission from ${orgName} back to you.`,
          `<p style="font-size: 14px; color: #374151;"><strong>Submission Number:</strong> ${submissionNumber}</p>`,
          'Review in Admin Dashboard', MOU_APP_URL
        ),
      }),
    })
    return new Response(JSON.stringify({ success: true, data: await res.json() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'mou_finalized') {
    const { submissionNumber, orgName } = body
    const results = []
    for (const to of [{ email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' }, { email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' }]) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
          to: [to],
          subject: `MOU Finalized — ${submissionNumber}`,
          htmlContent: mouEmailShell(
            'MOU Finalized',
            `The MOU with ${orgName} (${submissionNumber}) has been finalized. The agreement text is now locked for export and ready to schedule for City Council.`,
            '',
            'View in Admin Dashboard', MOU_APP_URL
          ),
        }),
      })
      results.push(await res.json())
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'mou_council_decision') {
    const { submissionNumber, orgName, orgEmail, decision, notifyOrg } = body
    const decisionLabel = decision === 'approved' ? 'Approved' : decision === 'disapproved' ? 'Disapproved' : 'Sent Back for Edits'
    const recipients = [
      { email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' },
      { email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' },
    ]
    if (notifyOrg && orgEmail) recipients.push({ email: orgEmail, name: orgName })
    const results = []
    for (const to of recipients) {
      const isOrg = to.email === orgEmail
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
          to: [to],
          subject: `City Council Decision: ${decisionLabel} — ${submissionNumber}`,
          htmlContent: mouEmailShell(
            'City Council Decision',
            `City Council has recorded a decision on the MOU with ${orgName}: ${decisionLabel}.`,
            decision === 'sent_back_for_edits'
              ? `<p style="font-size: 14px; color: #374151;">${isOrg ? 'This submission has been reopened for another round of edits. Use your submission number and PIN to review what changed and update accordingly.' : 'The submission has been reopened for another round of review.'}</p>`
              : '',
            isOrg ? 'Check Status' : 'View in Admin Dashboard', isOrg ? MOU_STATUS_URL : MOU_APP_URL
          ),
        }),
      })
      results.push(await res.json())
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // ─── CAR / Agenda Module Notifications ─────────────────────────────
  const CAR_ADMIN_URL = 'https://franklin-service-requests-39a5.vercel.app/?page=admin-car'
  const CAR_STATUS_URL = 'https://franklin-service-requests-39a5.vercel.app/?page=car-status'
  const CAR_REVIEWERS = [
    { email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' },
    { email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' },
  ]

  async function sendCarEmail(to: { email: string; name: string }, subjectLine: string, html: string) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
        to: [{ email: to.email, name: to.name }],
        subject: subjectLine,
        htmlContent: html,
      }),
    })
    return res.json()
  }

  if (body.type === 'car_submitted') {
    const { submissionNumber, subject, toEmail, toName } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `CAR Received — ${submissionNumber}`, carEmailShell(
      'CAR Received',
      `Your Council Action Report (${submissionNumber}) has been received.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>
       <p style="font-size: 14px; color: #374151;">It will be reviewed by the City Manager's Office ahead of the next Council meeting cycle's Review Date. Submission of a CAR does not guarantee placement on a Council agenda.</p>`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_new_submission') {
    const { submissionNumber, subject } = body
    const results = []
    for (const to of CAR_REVIEWERS) {
      results.push(await sendCarEmail(to, `New CAR Submission — ${submissionNumber}`, carEmailShell(
        'New CAR Submission',
        `A new Council Action Report has been submitted.`,
        `<p style="font-size: 14px; color: #374151;"><strong>Submission Number:</strong> ${submissionNumber}</p>
         <p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
        'Review in Admin Dashboard', CAR_ADMIN_URL
      )))
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_rejected') {
    const { submissionNumber, subject, toEmail, toName, reviewNote } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `CAR Not Approved — ${submissionNumber}`, carEmailShell(
      'Review Decision',
      `Your Council Action Report (${submissionNumber}) was not approved for the Council agenda.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>
       ${reviewNote ? `<p style="font-size: 14px; color: #374151;"><strong>Note:</strong> ${reviewNote}</p>` : ''}`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_approved_normal') {
    const { submissionNumber, subject, toEmail, toName } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `CAR Approved — ${submissionNumber}`, carEmailShell(
      'Review Decision',
      `Your Council Action Report (${submissionNumber}) has been approved and will be included in the packet for the upcoming Council meeting.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_approved_hot') {
    const { submissionNumber, subject, toEmail, toName } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `CAR Approved — Work Session Required — ${submissionNumber}`, carEmailShell(
      'Review Decision',
      `Your Council Action Report (${submissionNumber}) has been approved as a "hot button" item and will be scheduled for a Council work session before moving to a packet.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_scheduled_work_session') {
    const { submissionNumber, subject, toEmail, toName, workSessionDate } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `Work Session Scheduled — ${submissionNumber}`, carEmailShell(
      'Work Session Scheduled',
      `Your Council Action Report (${submissionNumber}) has been scheduled for a Council work session${workSessionDate ? ` on ${workSessionDate}` : ''}.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>
       <p style="font-size: 14px; color: #374151;">A written answer will be requested following the work session.</p>`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_answer_submitted') {
    const { submissionNumber, subject } = body
    const results = []
    for (const to of CAR_REVIEWERS) {
      results.push(await sendCarEmail(to, `Answer Submitted — ${submissionNumber}`, carEmailShell(
        'Answer Submitted',
        `A written answer has been submitted for a work-session CAR and is ready for sign-off.`,
        `<p style="font-size: 14px; color: #374151;"><strong>Submission Number:</strong> ${submissionNumber}</p>
         <p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
        'Review in Admin Dashboard', CAR_ADMIN_URL
      )))
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_answer_signed_off') {
    const { submissionNumber, subject, toEmail, toName } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `Answer Signed Off — ${submissionNumber}`, carEmailShell(
      'Answer Signed Off',
      `Your submitted answer for Council Action Report ${submissionNumber} has been signed off and the CAR will be included in the packet.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_pushed_to_reassignment') {
    const { submissionNumber, subject, toEmail, toName } = body
    const recipients = [...CAR_REVIEWERS]
    if (toEmail) recipients.push({ email: toEmail, name: toName })
    const results = []
    for (const to of recipients) {
      const isSubmitter = to.email === toEmail
      results.push(await sendCarEmail(to, `Missed Sign-Off Deadline — ${submissionNumber}`, carEmailShell(
        'Missed Sign-Off Deadline',
        `Council Action Report ${submissionNumber} missed its sign-off deadline before the Packet Publish Date and needs to be reassigned to a future meeting cycle.`,
        `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
        isSubmitter ? 'Check Status' : 'Review in Admin Dashboard', isSubmitter ? CAR_STATUS_URL : CAR_ADMIN_URL
      )))
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_reassigned') {
    const { submissionNumber, subject, toEmail, toName, reason } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `CAR Reassigned — ${submissionNumber}`, carEmailShell(
      'Reassigned to a New Meeting Cycle',
      `Your Council Action Report (${submissionNumber}) has been reassigned to a different meeting cycle.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>
       ${reason ? `<p style="font-size: 14px; color: #374151;"><strong>Reason:</strong> ${reason}</p>` : ''}`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (body.type === 'car_packet_published') {
    const { submissionNumber, subject, toEmail, toName } = body
    const data = await sendCarEmail({ email: toEmail, name: toName }, `Packet Published — ${submissionNumber}`, carEmailShell(
      'Packet Published',
      `The Council meeting packet including your Council Action Report (${submissionNumber}) has been published.`,
      `<p style="font-size: 14px; color: #374151;"><strong>Subject:</strong> ${subject || '—'}</p>`,
      'Check Status', CAR_STATUS_URL
    ))
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // ─── Original Case Confirmation Email ────────────────────────────
  const { email, caseNumber, location, description } = body
  if (!email) {
    return new Response(JSON.stringify({ success: false, reason: 'no email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
    body: JSON.stringify({
      sender: { name: 'City of Franklin NH', email: 'noreply.franklin.sr@gmail.com' },
      to: [{ email }],
      subject: `Service Request Received — Case #${caseNumber}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a56a0; padding: 24px 32px;">
            <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
            <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Service Request Confirmation</p>
          </div>
          <div style="padding: 32px; border: 1px solid #e5e7eb;">
            <p style="font-size: 15px; color: #111827;">Thank you for contacting the City of Franklin. Your request has been received.</p>
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px;">Your Case Number</div>
              <div style="font-size: 32px; font-weight: 700; color: #1a56a0;">${caseNumber}</div>
            </div>
            <p style="font-size: 14px; color: #374151;"><strong>Location / Subject:</strong> ${location || '—'}</p>
            <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
            <div style="margin: 24px 0;">
              <a href="https://franklin-service-requests-39a5.vercel.app/?page=track" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Check Your Case Status
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">You can use your case number to look up the status of your request at any time on our public dashboard.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
              <strong>Please do not reply to this email.</strong> If you have questions, contact the City Manager's Office at <a href="mailto:bdemers@franklinnh.gov" style="color: #1a56a0;">bdemers@franklinnh.gov</a>.
            </div>
          </div>
          <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
            City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
          </div>
        </div>
      `,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
