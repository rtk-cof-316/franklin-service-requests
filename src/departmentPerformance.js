import { supabase } from './supabaseClient'

function median(nums) {
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function daysBetween(startIso, endIso) {
  return Math.round((new Date(endIso) - new Date(startIso)) / (1000 * 60 * 60 * 24))
}

function toPct(fraction) {
  return fraction === null ? null : Math.round(fraction * 1000) / 10
}

// Computes this department's YTD stats plus citywide comparisons, entirely client-side
// (no new tables/RPCs -- same aggregate-in-JS approach PublicAnalytics.jsx already uses).
// YTD is scoped to when a department was assigned (case_departments.created_at), not when
// a case closed, to match the existing "cases received YTD" framing on this dashboard.
export async function loadDepartmentPerformance(departmentId) {
  const yearStart = `${new Date().getFullYear()}-01-01T00:00:00.000Z`

  const { data: allRows } = await supabase
    .from('case_departments')
    .select('case_id, department_id, created_at, closed_date, statuses ( name, is_closing ), cases ( statuses ( is_closing ) )')
    .gte('created_at', yearStart)

  const rows = allRows || []
  const deptRows = rows.filter(r => r.department_id === departmentId)

  if (deptRows.length === 0) {
    return { hasData: false }
  }

  const { count: citywideCaseCount } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
    .gte('date_submitted', yearStart)

  // Volume
  const deptCaseIds = new Set(deptRows.map(r => r.case_id))
  const deptVolume = deptCaseIds.size
  const volumeSharePct = toPct(citywideCaseCount ? deptVolume / citywideCaseCount : null)

  // Resolution time (each department's own dwell time on a case: closed_date - created_at).
  // Eligibility checks the case's own closure too, not just the department row's status --
  // some historical rows never got their own status flipped to a closing one even though the
  // case itself genuinely closed, so relying on the department row alone would miss them.
  // closed_date === created_at exactly would mark a same-instant closure, which in practice
  // only ever happens from a bad backfill, not a real close -- excluded as a safety net.
  // closed_date < created_at is chronologically impossible and shows up on historical
  // multi-department cases where the seed data's per-row timestamps weren't kept in lifecycle
  // order -- those rows are skipped rather than guessed at; real usage can't produce this since
  // a department can't be closed before it was assigned.
  const isMeasuredClosure = r =>
    (r.statuses?.is_closing || r.cases?.statuses?.is_closing) &&
    r.closed_date &&
    r.closed_date !== r.created_at &&
    new Date(r.closed_date) >= new Date(r.created_at)
  const deptDwellDays = deptRows.filter(isMeasuredClosure).map(r => daysBetween(r.created_at, r.closed_date))
  const citywideDwellDays = rows.filter(isMeasuredClosure).map(r => daysBetween(r.created_at, r.closed_date))

  const deptMedian = median(deptDwellDays)
  const citywideMedian = median(citywideDwellDays)
  const deptFastest = deptDwellDays.length ? Math.min(...deptDwellDays) : null
  const deptLongest = deptDwellDays.length ? Math.max(...deptDwellDays) : null

  // Public comment rate -- cases with >=1 row in case_comments (every row there is already
  // public-facing; there's no separate visibility flag to check)
  const allCaseIds = [...new Set(rows.map(r => r.case_id))]
  let commentedCaseIds = new Set()
  if (allCaseIds.length > 0) {
    const { data: comments } = await supabase
      .from('case_comments')
      .select('case_id')
      .in('case_id', allCaseIds)
    commentedCaseIds = new Set((comments || []).map(c => c.case_id))
  }
  const deptCommentRatePct = toPct(
    [...deptCaseIds].filter(id => commentedCaseIds.has(id)).length / deptCaseIds.size
  )
  const citywideCommentRatePct = toPct(
    allCaseIds.length ? allCaseIds.filter(id => commentedCaseIds.has(id)).length / allCaseIds.length : null
  )

  // Status breakdown (this department's current status per case)
  const statusBreakdown = {}
  deptRows.forEach(r => {
    const name = r.statuses?.name || 'Unknown'
    statusBreakdown[name] = (statusBreakdown[name] || 0) + 1
  })

  // Resource-need signal: volume meaningfully above the average of departments that
  // actually receive cases (excluding structurally-zero-volume departments from the
  // baseline keeps a handful of departments with no routed issue types from making
  // every active department look "above average" by default).
  const volumeByDept = {}
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

  return {
    hasData: true,
    deptVolume,
    citywideCaseCount: citywideCaseCount || 0,
    volumeSharePct,
    deptMedian,
    citywideMedian,
    deptFastest,
    deptLongest,
    deptCommentRatePct,
    citywideCommentRatePct,
    statusBreakdown,
    showResourceNeedNote,
  }
}
