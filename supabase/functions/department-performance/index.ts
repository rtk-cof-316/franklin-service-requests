// Computes YTD department performance stats server-side (service role key, bypasses RLS so
// the citywide comparison is guaranteed complete regardless of what a department-role session
// can normally see). Volume/comment-rate/status-breakdown come straight from case_departments
// and case_comments. Resolution time is different: case_departments.created_at/closed_date and
// cases.closed_date turned out to be unreliable on historical data (bulk-seeded, not written by
// real actions), so dwell time is instead reconstructed from case_audit_log, which records the
// two events that actually matter -- when a case was assigned to a department, and when that
// department closed it -- with real, trustworthy timestamps. Going forward, every real
// assignment/close still gets logged here the same way, so this stays accurate long-term.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function daysBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24))
}

function toPct(fraction: number | null): number | null {
  return fraction === null ? null : Math.round(fraction * 1000) / 10
}

// Matches the exact audit log phrasings written by CaseDetail.jsx / SubmitForm.jsx / the
// send-confirmation-email edge function. If those messages' wording ever changes, these need
// to change with them.
const ASSIGNED_TO_RE = /^Assigned to (.+)$/
const AUTO_ASSIGNED_RE = /^Auto-assigned to (.+?) based on issue type/
const REFERRED_TO_RE = /^Referred from .+ to (.+)$/
const DEPT_STATUS_RE = /^(.+?) status (?:changed|updated) from ".*?" to "(.+?)"/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { departmentId } = await req.json()
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
  const supabaseUrl = 'https://sdibtkmmcegthmytmzvy.supabase.co'
  const authHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }

  const yearStart = `${new Date().getFullYear()}-01-01T00:00:00.000Z`

  const [deptRes, statusRes, cwCaseRes, cdRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/departments?select=id,name`, { headers: authHeaders }),
    fetch(`${supabaseUrl}/rest/v1/statuses?select=name,is_closing`, { headers: authHeaders }),
    fetch(`${supabaseUrl}/rest/v1/cases?select=id&date_submitted=gte.${yearStart}`, { headers: { ...authHeaders, Prefer: 'count=exact' } }),
    fetch(
      `${supabaseUrl}/rest/v1/case_departments?select=case_id,department_id,created_at,statuses(name,is_closing)&created_at=gte.${yearStart}`,
      { headers: authHeaders }
    ),
  ])

  const departments: { id: number; name: string }[] = await deptRes.json()
  const statuses: { name: string; is_closing: boolean }[] = await statusRes.json()
  const citywideCaseCount = parseInt(cwCaseRes.headers.get('content-range')?.split('/')[1] || '0')
  const rows: any[] = await cdRes.json()

  const deptNameToId = new Map(departments.map(d => [d.name.toLowerCase(), d.id]))
  const closingStatusNames = new Set(statuses.filter(s => s.is_closing).map(s => s.name.toLowerCase()))

  const deptRows = rows.filter(r => r.department_id === departmentId)
  if (deptRows.length === 0) {
    return new Response(JSON.stringify({ hasData: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const deptCaseIds = new Set(deptRows.map(r => r.case_id))
  const deptVolume = deptCaseIds.size
  const volumeSharePct = toPct(citywideCaseCount ? deptVolume / citywideCaseCount : null)

  // Reconstruct real assignment/closure timestamps per (case_id, department_id) from the audit
  // log, for every case any of these rows belong to. PostgREST caps unpaginated responses at
  // 1000 rows, which silently truncated this to the oldest entries only (missing later closure
  // events) before this paged -- has to page through everything to get the full history.
  const allCaseIds = [...new Set(rows.map(r => r.case_id))]
  const auditRows: { case_id: number; action: string; created_at: string }[] = []
  const PAGE_SIZE = 1000
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const auditRes = await fetch(
      `${supabaseUrl}/rest/v1/case_audit_log?select=case_id,action,created_at&case_id=in.(${allCaseIds.join(',')})&order=created_at.asc&offset=${offset}&limit=${PAGE_SIZE}`,
      { headers: authHeaders }
    )
    const page = await auditRes.json()
    auditRows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  const assignedAt = new Map<string, string>() // `${case_id}:${department_id}` -> earliest timestamp
  const closedAt = new Map<string, string>() // same key -> latest closing-transition timestamp

  for (const log of auditRows || []) {
    const key = (deptId: number) => `${log.case_id}:${deptId}`

    const assignedMatch = log.action.match(ASSIGNED_TO_RE) || log.action.match(AUTO_ASSIGNED_RE) || log.action.match(REFERRED_TO_RE)
    if (assignedMatch) {
      const deptId = deptNameToId.get(assignedMatch[1].trim().toLowerCase())
      if (deptId) {
        const k = key(deptId)
        if (!assignedAt.has(k)) assignedAt.set(k, log.created_at)
      }
    }

    const statusMatch = log.action.match(DEPT_STATUS_RE)
    if (statusMatch) {
      const deptId = deptNameToId.get(statusMatch[1].trim().toLowerCase())
      const newStatusName = statusMatch[2].trim().toLowerCase()
      if (deptId && closingStatusNames.has(newStatusName)) {
        closedAt.set(key(deptId), log.created_at)
      }
    }
  }

  // Older cases often had their department set at creation time with no separate "Assigned to
  // X" audit entry (that's only ever logged for a later add/auto-route/referral action), so
  // there's nothing to parse for the assignment side. case_departments.created_at is a fine
  // fallback for that half on its own -- it only broke down earlier when paired with the
  // unreliable cases.closed_date; paired with the audit-log-derived closedAt here, it's sound.
  function measuredDwellDays(candidateRows: any[]): number[] {
    const out: number[] = []
    for (const r of candidateRows) {
      if (!r.statuses?.is_closing) continue // only count rows currently in a closing status
      const k = `${r.case_id}:${r.department_id}`
      const a = assignedAt.get(k) || r.created_at
      const c = closedAt.get(k)
      if (a && c && new Date(c) >= new Date(a)) out.push(daysBetween(a, c))
    }
    return out
  }

  const deptDwellDays = measuredDwellDays(deptRows)
  const citywideDwellDays = measuredDwellDays(rows)
  const deptClosedCount = deptRows.filter(r => r.statuses?.is_closing).length

  const deptMedian = median(deptDwellDays)
  const citywideMedian = median(citywideDwellDays)
  const deptFastest = deptDwellDays.length ? Math.min(...deptDwellDays) : null
  const deptLongest = deptDwellDays.length ? Math.max(...deptDwellDays) : null

  // Public comment rate
  let commentedCaseIds = new Set<number>()
  if (allCaseIds.length > 0) {
    const commentsRes = await fetch(
      `${supabaseUrl}/rest/v1/case_comments?select=case_id&case_id=in.(${allCaseIds.join(',')})`,
      { headers: authHeaders }
    )
    const comments: { case_id: number }[] = await commentsRes.json()
    commentedCaseIds = new Set((comments || []).map(c => c.case_id))
  }
  const deptCommentRatePct = toPct(
    [...deptCaseIds].filter(id => commentedCaseIds.has(id)).length / deptCaseIds.size
  )
  const citywideCommentRatePct = toPct(
    allCaseIds.length ? allCaseIds.filter(id => commentedCaseIds.has(id)).length / allCaseIds.length : null
  )

  // Status breakdown
  const statusBreakdown: Record<string, number> = {}
  deptRows.forEach(r => {
    const name = r.statuses?.name || 'Unknown'
    statusBreakdown[name] = (statusBreakdown[name] || 0) + 1
  })

  // Resource-need signal (volume vs. the average of departments that actually receive cases)
  const volumeByDept: Record<number, Set<number>> = {}
  rows.forEach(r => {
    if (!volumeByDept[r.department_id]) volumeByDept[r.department_id] = new Set()
    volumeByDept[r.department_id].add(r.case_id)
  })
  const activeDeptVolumes = Object.values(volumeByDept).map(s => s.size).filter(v => v > 0)
  const avgActiveDeptVolume = activeDeptVolumes.length
    ? activeDeptVolumes.reduce((a, b) => a + b, 0) / activeDeptVolumes.length
    : null

  const highVolume = avgActiveDeptVolume !== null && deptVolume > avgActiveDeptVolume * 1.25
  const slowResolution = deptMedian !== null && citywideMedian !== null && deptMedian > citywideMedian
  const showResourceNeedNote = highVolume && slowResolution

  return new Response(JSON.stringify({
    hasData: true,
    deptVolume,
    citywideCaseCount,
    volumeSharePct,
    deptMedian,
    citywideMedian,
    deptFastest,
    deptLongest,
    deptMeasuredCount: deptDwellDays.length,
    deptClosedCount,
    deptCommentRatePct,
    citywideCommentRatePct,
    statusBreakdown,
    showResourceNeedNote,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
