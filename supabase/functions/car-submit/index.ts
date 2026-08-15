// Creates a brand-new CAR submission. Runs with the service role key because the public
// CAR form uses the anon role, which has no write access to car_submissions (see the CAR
// module RLS migration) — org access from here on is entirely PIN-gated through
// car-org-action. This function also resolves which meeting cycle is currently open for
// submissions server-side, since meeting_cycles has no anon read policy at all (nothing
// about cycle scheduling should be queryable by the public client directly).

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

  const { submitterType, submitterName, submitterEmail, submitterPhone } = await req.json()
  if (!submitterType || !submitterName || !submitterEmail) {
    return new Response(JSON.stringify({ error: 'submitterType, submitterName, and submitterEmail are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }

  const cyclesRes = await fetch(
    `${supabaseUrl}/rest/v1/meeting_cycles?status=eq.open_for_submissions&select=*&order=meeting_date.asc`,
    { headers: authHeaders }
  )
  const cycles = await cyclesRes.json()
  const today = new Date().toISOString().slice(0, 10)
  const openCycle = cycles.find((c: any) => (c.car_submission_close_override || c.car_submission_close_default) >= today)

  if (!openCycle) {
    return new Response(JSON.stringify({ error: 'No CAR submission window is currently open.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const currentYear = new Date().getFullYear()
  const seqRes = await fetch(
    `${supabaseUrl}/rest/v1/car_submissions?select=sequence_number&year=eq.${currentYear}&order=sequence_number.desc&limit=1`,
    { headers: authHeaders }
  )
  const seqData = await seqRes.json()
  const nextSequence = seqData?.[0]?.sequence_number ? seqData[0].sequence_number + 1 : 1
  const submissionNumber = `CAR-${currentYear}-${nextSequence}`

  const pin = generatePin()
  const pinHash = await hashPin(pin)

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/car_submissions`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      submission_number: submissionNumber,
      sequence_number: nextSequence,
      year: currentYear,
      pin_hash: pinHash,
      submitter_type: submitterType,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      submitter_phone: submitterPhone || null,
      meeting_cycle_id: openCycle.id,
      status: 'submitted',
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

  await fetch(`${supabaseUrl}/rest/v1/car_activity_log`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      car_submission_id: submission.id,
      actor_type: 'submitter',
      actor_name: submitterName,
      action_type: 'submission_started',
      notes: `Started by ${submitterName} (${submitterType})`,
    }),
  })

  return new Response(
    JSON.stringify({ submissionId: submission.id, submissionNumber, pin, meetingCycleId: openCycle.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
