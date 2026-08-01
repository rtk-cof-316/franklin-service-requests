// Vercel Cron can only trigger routes within this same deployment, so this
// function's only job is to relay the trigger to the actual Supabase Edge
// Function that does the real work. Keeps SERVICE_ROLE_KEY/Brevo key
// confined to Supabase's secret store instead of duplicating them here.
export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/daily-case-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({}),
    })
    const data = await response.json()
    res.status(response.ok ? 200 : 502).json(data)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
