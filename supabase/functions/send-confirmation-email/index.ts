const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { email, caseNumber, location, description } = await req.json()

  if (!email) {
    return new Response(JSON.stringify({ success: false, reason: 'no email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  const brevoKey = Deno.env.get('BREVO_API_KEY')

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a56a0; padding: 24px 32px;">
        <h1 style="color: #e8eef6; margin: 0; font-size: 20px;">City of Franklin, NH</h1>
        <p style="color: #93afd4; margin: 4px 0 0 0; font-size: 13px;">Service Request Confirmation</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb;">
        <p style="font-size: 15px; color: #111827;">Thank you for contacting the City of Franklin. Your service request has been received.</p>
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
          <strong>Please do not reply to this email.</strong> This is an automated message from an unmonitored address. If you have questions about your request, please use the public case tracker linked above, or contact the City Manager's Office at <a href="mailto:bdemers@franklinnh.gov" style="color: #1a56a0;">bdemers@franklinnh.gov</a>.
        </div>
      </div>
      <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
        City of Franklin, New Hampshire &nbsp;|&nbsp; Service Request System
      </div>
    </div>
  `

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': brevoKey,
    },
    body: JSON.stringify({
      sender: {
        name: 'City of Franklin NH',
        email: 'noreply.franklin.sr@gmail.com',
      },
      to: [{ email }],
      subject: `Service Request Received — Case #${caseNumber}`,
      htmlContent: emailBody,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})