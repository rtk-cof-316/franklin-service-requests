const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.json()
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'

  // ─── Department Assignment Notification ───────────────────────────
  if (body.type === 'department_assignment') {
    const { departmentId, caseNumber, location, description, departmentName } = body

    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?department_id=eq.${departmentId}&select=user_id`,
      { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
    )
    const profiles = await profilesRes.json()

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No users in department' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emails = []
    for (const profile of profiles) {
      const userRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${profile.user_id}`,
        { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
      )
      const user = await userRes.json()
      if (user?.email) emails.push(user.email)
    }

    if (emails.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No emails found' }), {
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

  // ─── Department Reminder Notification ────────────────────────────
  if (body.type === 'department_reminder') {
    const { departmentId, caseNumber, location, description, departmentName, lastUpdateText } = body

    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?department_id=eq.${departmentId}&select=user_id`,
      { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
    )
    const profiles = await profilesRes.json()

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No users in department' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emails = []
    for (const profile of profiles) {
      const userRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${profile.user_id}`,
        { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
      )
      const user = await userRes.json()
      if (user?.email) emails.push(user.email)
    }

    const results = []
    for (const email of emails) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: 'Franklin Service Request System', email: 'noreply.franklin.sr@gmail.com' },
          to: [{ email }],
          subject: `Action Required — Case #${caseNumber} Pending Update`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1a56a0; padding: 24px 32px;">
                <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">Franklin Service Request System</h1>
                <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Automated System Reminder</p>
              </div>
              <div style="padding: 32px; border: 1px solid #e5e7eb;">
                <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                  <div style="font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px;">⚠️ Action Required</div>
                  <div style="font-size: 13px; color: #92400e;">Case #${caseNumber} has been assigned to ${departmentName} and is awaiting a status update or case note.</div>
                </div>
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                  <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px;">Case Number</div>
                  <div style="font-size: 28px; font-weight: 700; color: #1a56a0;">#${caseNumber}</div>
                </div>
                <p style="font-size: 14px; color: #374151;"><strong>Location:</strong> ${location || '—'}</p>
                <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
                <p style="font-size: 13px; color: #6b7280; font-style: italic;">${lastUpdateText}</p>
                <div style="margin: 24px 0;">
                  <a href="https://franklin-service-requests-39a5.vercel.app" style="background-color: #1a56a0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                    Log In to Update This Case
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                  This is an automated system reminder. Please do not reply to this email. Log in to the staff portal to update the case.
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
                <div style="font-size: 14px; color: #065f46; margin-top: 6px; font-weight: 600;">✓ Resolved</div>
              </div>
              <p style="font-size: 14px; color: #374151;"><strong>Location / Subject:</strong> ${location || '—'}</p>
              <p style="font-size: 14px; color: #374151;"><strong>Description:</strong> ${description}</p>
              <div style="margin: 24px 0;">
                <a href="https://franklin-service-requests-39a5.vercel.app/?page=track" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  View Your Case
                </a>
              </div>
              <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">Thank you for contacting the City of Franklin. If you have any follow-up questions, please use the case tracker to view updates or contact us directly.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <div style="background-color: #f9fafb; border-left: 3px solid #d1d5db; padding: 12px 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                <strong>Please do not reply to this email.</strong> This is an automated message. If you have questions, contact the City Manager's Office at <a href="mailto:bdemers@franklinnh.gov" style="color: #1a56a0;">bdemers@franklinnh.gov</a>.
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
              <strong>Please do not reply to this email.</strong> This is an automated message from an unmonitored address. If you have questions, contact the City Manager's Office at <a href="mailto:bdemers@franklinnh.gov" style="color: #1a56a0;">bdemers@franklinnh.gov</a>.
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