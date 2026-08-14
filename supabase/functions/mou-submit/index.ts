// Creates a brand-new MOU submission draft. Runs with the service role key because the
// public MOU form uses the anon role, which has no write access to mou_submissions (see
// the MOU module RLS migration) — org access from here on is entirely PIN-gated through
// the mou-org-action function. This function's only job is minting the submission,
// submission number, and PIN; everything else (field edits, comments, submit/resubmit,
// status lookup) goes through mou-org-action.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generatePin(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 100000000).padStart(8, '0')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { orgName, orgContactName, orgEmail } = await req.json()
  if (!orgName || !orgContactName || !orgEmail) {
    return new Response(JSON.stringify({ error: 'orgName, orgContactName, and orgEmail are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }

  const templateRes = await fetch(`${supabaseUrl}/rest/v1/mou_templates?is_current=eq.true&select=id`, { headers: authHeaders })
  const templateData = await templateRes.json()
  const templateId = templateData?.[0]?.id
  if (!templateId) {
    return new Response(JSON.stringify({ error: 'No current MOU template is configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const currentYear = new Date().getFullYear()
  const seqRes = await fetch(
    `${supabaseUrl}/rest/v1/mou_submissions?select=sequence_number&year=eq.${currentYear}&order=sequence_number.desc&limit=1`,
    { headers: authHeaders }
  )
  const seqData = await seqRes.json()
  const nextSequence = seqData?.[0]?.sequence_number ? seqData[0].sequence_number + 1 : 1
  const submissionNumber = `MOU-${currentYear}-${nextSequence}`

  const pin = generatePin()
  const pinHash = await hashPin(pin)

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/mou_submissions`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      template_id: templateId,
      org_name: orgName,
      org_contact_name: orgContactName,
      org_email: orgEmail,
      submission_number: submissionNumber,
      sequence_number: nextSequence,
      year: currentYear,
      pin_hash: pinHash,
      current_stage: 'org_drafting',
    }),
  })
  const inserted = await insertRes.json()
  const submission = inserted?.[0]
  if (!submission) {
    return new Response(JSON.stringify({ error: 'Failed to create submission', details: inserted }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await fetch(`${supabaseUrl}/rest/v1/mou_activity_log`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      submission_id: submission.id,
      actor_type: 'org',
      actor_name: orgContactName,
      action_type: 'draft_started',
      notes: `Draft started by ${orgName}`,
    }),
  })

  return new Response(
    JSON.stringify({ submissionId: submission.id, submissionNumber, pin, templateId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
