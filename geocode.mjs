import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ROAD_ISSUE_TYPES = ['Pothole', 'Crack / Pavement', 'Drainage', 'Heave', 'Signage / Traffic', 'Plowing / Sanding']

async function geocodeAddress(address) {
  const query = `${address}, Franklin, NH 03235`
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CityOfFranklinNH-ServiceRequests/1.0' }
  })
  const data = await res.json()
  
  if (data && data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    }
  }
  return null
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('Starting geocoding...')

  // Get all road cases without coordinates
  const { data: cases, error } = await supabase
    .from('cases')
    .select('id, case_number, location, issue_types ( name )')
    .is('latitude', null)
    .not('issue_type_id', 'is', null)

  if (error) {
    console.error('Error fetching cases:', error)
    process.exit(1)
  }

  // Filter to road issue types only
  const roadCases = cases.filter(c => ROAD_ISSUE_TYPES.includes(c.issue_types?.name))
  console.log(`Found ${roadCases.length} road cases to geocode`)

  let success = 0
  let failed = 0
  const failedCases = []

  for (const c of roadCases) {
    if (!c.location || c.location.trim() === '') {
      console.log(`⚠ Skipping ${c.case_number} — no location`)
      failed++
      failedCases.push({ case_number: c.case_number, reason: 'No location' })
      continue
    }

    const coords = await geocodeAddress(c.location)

    if (coords) {
      await supabase
        .from('cases')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', c.id)
      console.log(`✓ ${c.case_number} — ${c.location} → ${coords.latitude}, ${coords.longitude}`)
      success++
    } else {
      console.log(`✗ ${c.case_number} — ${c.location} → Could not geocode`)
      failed++
      failedCases.push({ case_number: c.case_number, location: c.location, reason: 'No result from Nominatim' })
    }

    // Nominatim requires 1 second between requests
    await sleep(1100)
  }

  console.log(`\nGeocoding complete!`)
  console.log(`✓ Success: ${success}`)
  console.log(`✗ Failed: ${failed}`)

  if (failedCases.length > 0) {
    console.log('\nFailed cases:')
    failedCases.forEach(c => console.log(`  ${c.case_number} — ${c.location || 'no location'} (${c.reason})`))
    console.log('\nFor failed cases, you can manually update coordinates in Supabase Table Editor.')
  }
}

main().catch(console.error)
