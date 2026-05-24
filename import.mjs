import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { read, utils } from 'xlsx'

const SUPABASE_URL = 'https://sdibtkmmcegthmytmzvy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function excelDateToISO(serial) {
  if (!serial || isNaN(serial)) return null
  const date = new Date((serial - 25569) * 86400 * 1000)
  return date.toISOString()
}

function mapStatus(primaryStatus) {
  if (!primaryStatus) return 'Received'
  const s = primaryStatus.toString().toLowerCase().trim()
  if (s === 'closed') return 'Closed'
  if (s === 'open') return 'In Progress'
  return 'Received'
}

function mapDept(deptName) {
  if (!deptName) return null
  const d = deptName.toString().trim()
  const map = {
    'MSD': 'MSD',
    'Fire/Code': 'Fire/Code',
    'PZA': 'PZA',
    'City Manager': 'City Manager',
    'Police/Prosecutor': 'Police/Prosecutor',
    'Finance': 'Finance',
    'Legal': 'Legal',
    'Human Resources': 'Human Resources',
    'HR': 'Human Resources',
    'Parks & Rec': 'Parks & Rec',
    'P&R': 'Parks & Rec',
    'IT': 'IT',
    'City Attorney': 'City Attorney',
  }
  return map[d] || null
}

async function main() {
  console.log('Starting import...')

  const fileBuffer = readFileSync('./Service_Request_Log__1_.xlsx')
  const workbook = read(fileBuffer)
  const sheet = workbook.Sheets['2026']
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: null })

  const dataRows = rows.slice(2).filter(row => row[0] && !isNaN(row[0]))
  console.log(`Found ${dataRows.length} cases to import`)

  const { data: statuses } = await supabase.from('statuses').select('id, name')
  const statusMap = {}
  statuses.forEach(s => { statusMap[s.name.toLowerCase()] = s.id })

  const { data: departments } = await supabase.from('departments').select('id, name')
  const deptMap = {}
  departments.forEach(d => { deptMap[d.name] = d.id })

  let successCount = 0
  let errorCount = 0

  for (const row of dataRows) {
    const caseNumber = row[1]?.toString().trim()
    if (!caseNumber) continue

    const sequenceNumber = parseInt(caseNumber.split('-')[0])
    const year = 26

    const location = row[3]?.toString().trim() || null
    const description = row[4]?.toString().trim() || null
    const requestTopic = row[5]?.toString().trim() || null
    const receivedBy = row[7]?.toString().trim() || null
    const primaryStatus = row[8]?.toString().trim() || null
    const primaryDept = mapDept(row[10]?.toString().trim())
    const secondaryDept = mapDept(row[11]?.toString().trim())
    const requestorName = row[13]?.toString().trim() || null
    const contactInfo = row[15]?.toString().trim() || null
    const notes = row[25]?.toString().trim() || null

    const dateSubmitted = excelDateToISO(row[2])
    const dateAcknowledged = excelDateToISO(row[16])
    const followUpDue = excelDateToISO(row[17])
    const closedDate = excelDateToISO(row[19])

    const numRecords = row[20] ? parseInt(row[20]) : null
    const hoursWorked = row[21] ? parseFloat(row[21]) : null
    const feesAssessed = row[22] ? parseFloat(row[22]) : null
    const feesCollected = row[23] ? parseFloat(row[23]) : null
    const hoursWorkedClosed = row[24] ? parseFloat(row[24]) : null

    const is91a = !!(location === '91A Request' ||
      (requestTopic && ['administrative records', 'financial records', 'communication records',
        'property records', 'police/fire incident records', 'personnel records',
        'incident records'].includes(requestTopic.toLowerCase())))

    const statusName = mapStatus(primaryStatus)
    const statusId = statusMap[statusName.toLowerCase()] || statusMap['received']

    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert([{
        case_number: caseNumber,
        sequence_number: sequenceNumber,
        year: year,
        date_submitted: dateSubmitted || new Date().toISOString(),
        location: is91a ? (description || location) : location,
        description: description || 'Imported from service request log',
        is_91a: is91a,
        submitter_name: requestorName,
        submitter_email: null,
        submitter_phone: contactInfo,
        status_id: statusId,
        received_by: receivedBy,
        followup_due_date: followUpDue,
        closed_date: closedDate,
        created_at: dateSubmitted || new Date().toISOString(),
      }])
      .select()
      .single()

    if (caseError) {
      console.error(`Error inserting case ${caseNumber}:`, caseError.message)
      errorCount++
      continue
    }

    const depts = [primaryDept, secondaryDept].filter(Boolean)
    for (const deptName of depts) {
      const deptId = deptMap[deptName]
      if (!deptId) continue
      const deptStatusId = closedDate ? statusMap['closed'] : statusMap['in progress'] || statusMap['received']
      await supabase.from('case_departments').insert([{
        case_id: newCase.id,
        department_id: deptId,
        status_id: deptStatusId,
      }])
    }

    if (is91a) {
      await supabase.from('details_91a').insert([{
        case_id: newCase.id,
        acknowledged_date: dateAcknowledged,
        request_topic: requestTopic,
        number_of_records: numRecords,
        hours_worked: hoursWorked,
        hours_worked_closed: hoursWorkedClosed,
        fees_assessed: feesAssessed,
        fees_collected: feesCollected,
      }])
    }

    if (notes) {
      await supabase.from('internal_notes').insert([{
        case_id: newCase.id,
        note: notes,
        created_by: receivedBy || 'Import',
        created_at: dateSubmitted || new Date().toISOString(),
      }])
    }

    successCount++
    console.log(`✓ Imported ${caseNumber}`)
  }

  console.log(`\nImport complete!`)
  console.log(`✓ Success: ${successCount}`)
  console.log(`✗ Errors: ${errorCount}`)
}

main().catch(console.error)
