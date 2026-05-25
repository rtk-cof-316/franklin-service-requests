import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function formatNum(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString()
}

function formatMoney(n) {
  if (!n) return '$0.00'
  return `$${parseFloat(n).toFixed(2)}`
}

function formatHours(n) {
  if (!n) return '0h'
  return `${parseFloat(n).toFixed(1)}h`
}

function isWithin5BusinessDays(submitted, acknowledged) {
  if (!submitted || !acknowledged) return false
  let count = 0
  let current = new Date(submitted)
  const ack = new Date(acknowledged)
  while (current < ack) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    if (count > 5) return false
  }
  return true
}

const BAR_COLORS = ['#1a56a0','#2563eb','#3b82f6','#60a5fa','#93c5fd','#1e40af','#1d4ed8','#0284c7','#0369a1','#075985']

function BarChart({ data, labelKey, valueKey, colorFn }) {
  if (!data || data.length === 0) return <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No data available.</div>
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: '#374151', width: '200px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d[labelKey]}
          </div>
          <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: '4px', height: '22px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: colorFn ? colorFn(i) : '#1a56a0', borderRadius: '4px', width: `${(d[valueKey] / max) * 100}%`, minWidth: d[valueKey] > 0 ? '4px' : '0' }} />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', width: '40px', textAlign: 'right', flexShrink: 0 }}>
            {d[valueKey]}
          </div>
        </div>
      ))}
    </div>
  )
}

function ScoreCard({ value, label, sub, color = '#1a56a0' }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px 24px', flex: '1', minWidth: '140px', borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: '30px', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginTop: '6px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

const closedStatuses = ['resolved', 'closed', 'unfounded', 'referred to another department', 'lacks resources to resolve', 'request abandoned']

function PublicAnalytics() {
  const [cases, setCases] = useState([])
  const [deptCases, setDeptCases] = useState([])
  const [rtkDetails, setRtkDetails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCases(), loadDeptCases(), loadRtkDetails()])
    setLoading(false)
  }

  async function loadCases() {
    const { data } = await supabase
      .from('cases')
      .select('id, date_submitted, closed_date, is_91a, submitter_name, statuses ( name ), issue_types ( name )')
    setCases(data || [])
  }

  async function loadDeptCases() {
    const { data } = await supabase
      .from('case_departments')
      .select('case_id, departments ( name )')
    setDeptCases(data || [])
  }

  async function loadRtkDetails() {
    const { data } = await supabase
      .from('details_91a')
      .select('*')
    setRtkDetails(data || [])
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading analytics...</div>
    </div>
  )

  // General metrics
  const totalCases = cases.length
  const resolvedCases = cases.filter(c => closedStatuses.includes((c.statuses?.name || '').toLowerCase()))
  const openCases = cases.filter(c => !closedStatuses.includes((c.statuses?.name || '').toLowerCase()))
  const resolutionRate = totalCases > 0 ? `${Math.round((resolvedCases.length / totalCases) * 100)}%` : '—'

  const avgDaysToResolve = (() => {
    const resolved = resolvedCases.filter(c => c.date_submitted && c.closed_date)
    if (resolved.length === 0) return '—'
    const avg = resolved.reduce((sum, c) => {
      return sum + Math.round((new Date(c.closed_date) - new Date(c.date_submitted)) / (1000 * 60 * 60 * 24))
    }, 0) / resolved.length
    return `${Math.round(avg)} days`
  })()

  // Cases by department
  const deptCounts = {}
  deptCases.forEach(dc => {
    const name = dc.departments?.name
    if (name) deptCounts[name] = (deptCounts[name] || 0) + 1
  })
  const deptData = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count)

  // Cases by issue type
  const typeCounts = {}
  cases.forEach(c => {
    const name = c.issue_types?.name
    if (name && name !== 'null') typeCounts[name] = (typeCounts[name] || 0) + 1
  })
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)

  // Monthly volume
  const monthlyCounts = {}
  cases.forEach(c => {
    if (!c.date_submitted) return
    const d = new Date(c.date_submitted)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1
  })
  const monthlyData = Object.entries(monthlyCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => {
      const [year, m] = month.split('-')
      const label = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      return { label, count }
    })

  // 91-A metrics — all from rtkDetails directly
  const rtkCases = cases.filter(c => c.is_91a)
  const total91a = rtkCases.length

  const totalDocsReleased = rtkDetails.reduce((sum, d) => sum + (parseInt(d.number_of_records) || 0), 0)
  const totalHours = rtkDetails.reduce((sum, d) => sum + (parseFloat(d.hours_worked) || 0), 0)
  const totalFees = rtkDetails.reduce((sum, d) => sum + (parseFloat(d.fees_collected) || 0), 0)

  // Acknowledged on time — need case date_submitted, match by case_id
  const caseMap = {}
  cases.forEach(c => { caseMap[c.id] = c })

  const acknowledgedTotal = rtkDetails.filter(d => d.acknowledged_date).length
  const acknowledgedOnTime = rtkDetails.filter(d => {
    if (!d.acknowledged_date || !d.case_id) return false
    const c = caseMap[d.case_id]
    if (!c?.date_submitted) return false
    return isWithin5BusinessDays(c.date_submitted, d.acknowledged_date)
  }).length
  const onTimeRate = acknowledgedTotal > 0 ? `${Math.round((acknowledgedOnTime / acknowledgedTotal) * 100)}%` : '—'

  // Topic breakdown
  const topicCounts = {}
  rtkDetails.forEach(d => {
    if (d.request_topic) topicCounts[d.request_topic] = (topicCounts[d.request_topic] || 0) + 1
  })
  const topicData = Object.entries(topicCounts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count)

  // Repeat requestors — anonymized, use submitter_name from rtk cases
  const requestorCounts = {}
  rtkCases.forEach(c => {
    const name = c.submitter_name || 'Anonymous'
    requestorCounts[name] = (requestorCounts[name] || 0) + 1
  })
  const repeatRequestors = Object.entries(requestorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([_, count], i) => ({ label: `R${String(i + 1).padStart(3, '0')}`, count }))

  // Released records with public URLs
  const releasedRecords = rtkDetails.filter(d => {
    if (!d.public_records_url) return false
    const c = caseMap[d.case_id]
    return c && closedStatuses.includes((c.statuses?.name || '').toLowerCase())
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      <div style={{ backgroundColor: '#1a56a0', padding: '32px 32px 28px 32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#e8eef6', margin: '0 0 4px 0' }}>📊 City of Franklin — Service Request Analytics</h1>
        <p style={{ fontSize: '14px', color: '#93afd4', margin: 0 }}>Public transparency dashboard — Franklin, New Hampshire</p>
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <ScoreCard value={formatNum(totalCases)} label="Total Cases Received" color="#1a56a0" />
          <ScoreCard value={formatNum(resolvedCases.length)} label="Cases Resolved" color="#16a34a" />
          <ScoreCard value={formatNum(openCases.length)} label="Currently Open" color="#d97706" />
          <ScoreCard value={avgDaysToResolve} label="Avg Days to Resolve" color="#7c3aed" />
          <ScoreCard value={resolutionRate} label="Resolution Rate" color="#0891b2" />
        </div>

        <SectionCard title="📋 Cases by Department">
          <BarChart data={deptData} labelKey="dept" valueKey="count" colorFn={i => BAR_COLORS[i % BAR_COLORS.length]} />
        </SectionCard>

        <SectionCard title="🔧 Cases by Issue Type">
          <BarChart data={typeData} labelKey="type" valueKey="count" />
        </SectionCard>

        <SectionCard title="📅 Monthly Case Volume">
          <BarChart data={monthlyData} labelKey="label" valueKey="count" />
        </SectionCard>

        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a56a0', marginBottom: '4px' }}>⚖️ Right-to-Know Requests (RSA 91-A)</div>
          <div style={{ fontSize: '13px', color: '#3b82f6' }}>Public transparency data on records requests filed with the City of Franklin</div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <ScoreCard value={formatNum(total91a)} label="Total 91-A Requests" color="#1a56a0" />
          <ScoreCard value={formatNum(totalDocsReleased)} label="Documents Requested" color="#16a34a" />
          <ScoreCard value={onTimeRate} label="Acknowledged On Time" sub="Within 5 business days" color="#d97706" />
          <ScoreCard value={formatHours(totalHours)} label="Total Staff Hours" color="#7c3aed" />
          <ScoreCard value={formatMoney(totalFees)} label="Fees Collected" color="#0891b2" />
        </div>

        <SectionCard title="📁 Requests by Topic">
          <BarChart data={topicData} labelKey="topic" valueKey="count" colorFn={i => BAR_COLORS[i % BAR_COLORS.length]} />
        </SectionCard>

        <SectionCard title="🔁 Top Repeat Requestors">
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
            Requestor identities are anonymized to protect privacy. This chart shows the volume of requests from our most frequent filers.
          </p>
          <BarChart data={repeatRequestors} labelKey="label" valueKey="count" colorFn={i => BAR_COLORS[i % BAR_COLORS.length]} />
        </SectionCard>

        <SectionCard title="📂 Public Records Library (In-Progress, TBD)">
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.5' }}>
            The following records have been released and are available for public viewing. Records are posted after fulfillment of a Right-to-Know request under RSA 91-A.
          </p>
          {releasedRecords.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No public records have been posted yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Case #', 'Date Released', 'Topic', 'Records'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {releasedRecords.map((d, i) => {
                  const c = caseMap[d.case_id]
                  return (
                    <tr key={i}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
                        <a href={d.public_records_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a56a0', fontWeight: '700', textDecoration: 'none' }}>
                          View {c?.case_number} ↗
                        </a>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                        {c?.closed_date ? new Date(c.closed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{d.request_topic || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{d.number_of_records || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </SectionCard>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', paddingBottom: '24px' }}>
          Data updated in real time.
        </div>
      </div>
    </div>
  )
}

export default PublicAnalytics
