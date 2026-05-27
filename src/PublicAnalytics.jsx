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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  if (!data || data.length === 0) return <div style={{ fontSize: '15px', color: '#6b7280', fontStyle: 'italic' }}>No data available.</div>
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', color: '#374151', width: '220px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d[labelKey]}
          </div>
          <div style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: '4px', height: '24px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: colorFn ? colorFn(i) : '#1a56a0', borderRadius: '4px', width: `${(d[valueKey] / max) * 100}%`, minWidth: d[valueKey] > 0 ? '4px' : '0' }} />
          </div>
          <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600', width: '40px', textAlign: 'right', flexShrink: 0 }}>
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
      <div style={{ fontSize: '32px', fontWeight: '700', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#374151', marginTop: '8px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ title, description, children }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: description ? '6px' : '0' }}>{title}</div>
        {description && <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>{description}</div>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function getStatusStyle(name) {
  const s = (name || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46', display: 'inline-block', whiteSpace: 'nowrap' }
  if (['in progress','assigned','scheduled','gathering records','reviewing records'].includes(s)) return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1e40af', display: 'inline-block', whiteSpace: 'nowrap' }
  if (['clarification needed','records ready - please schedule pick up'].includes(s)) return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e', display: 'inline-block', whiteSpace: 'nowrap' }
  if (['lacks resources to resolve','unfounded','request abandoned'].includes(s)) return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b', display: 'inline-block', whiteSpace: 'nowrap' }
  return { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151', display: 'inline-block', whiteSpace: 'nowrap' }
}

const closedStatuses = ['resolved', 'closed', 'unfounded', 'referred to another department', 'lacks resources to resolve', 'request abandoned']

function PublicAnalytics() {
  const [cases, setCases] = useState([])
  const [deptCases, setDeptCases] = useState([])
  const [rtkDetails, setRtkDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [rtkSearch, setRtkSearch] = useState('')
  const [rtkStatusFilter, setRtkStatusFilter] = useState('all')
  const totalTaxDollars = rtkDetails.reduce((sum, d) => sum + (parseFloat(d.tax_dollar_spent) || 0), 0)

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
      .select('id, case_number, date_submitted, closed_date, is_91a, submitter_name, requestor_id, location, description, statuses ( name ), issue_types ( name )')
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
      <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading analytics...</div>
    </div>
  )

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

  const deptCounts = {}
  deptCases.forEach(dc => {
    const name = dc.departments?.name
    if (name) deptCounts[name] = (deptCounts[name] || 0) + 1
  })
  const deptData = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count)

  const typeCounts = {}
  cases.forEach(c => {
    const name = c.issue_types?.name
    if (name) typeCounts[name] = (typeCounts[name] || 0) + 1
  })
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)

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

  const rtkCases = cases.filter(c => c.is_91a)
  const total91a = rtkCases.length
  const totalDocsReleased = rtkDetails.reduce((sum, d) => sum + (parseInt(d.number_of_records) || 0), 0)
  const totalHours = rtkDetails.reduce((sum, d) => sum + (parseFloat(d.hours_worked) || 0), 0)
  const totalFees = rtkDetails.reduce((sum, d) => sum + (parseFloat(d.fees_collected) || 0), 0)

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

  const topicCounts = {}
  rtkDetails.forEach(d => {
    if (d.request_topic) topicCounts[d.request_topic] = (topicCounts[d.request_topic] || 0) + 1
  })
  const topicData = Object.entries(topicCounts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count)

  const requestorCounts = {}
  rtkCases.forEach(c => {
    const rid = c.requestor_id || 'Unknown'
    requestorCounts[rid] = (requestorCounts[rid] || 0) + 1
  })
  const repeatRequestors = Object.entries(requestorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([rid, count]) => ({ label: rid, count }))

  const rtkTableCases = rtkCases.map(c => {
    const detail = rtkDetails.find(d => d.case_id === c.id)
    return { ...c, detail }
  }).filter(c => {
    if (rtkStatusFilter === 'open' && closedStatuses.includes((c.statuses?.name || '').toLowerCase())) return false
    if (rtkStatusFilter === 'closed' && !closedStatuses.includes((c.statuses?.name || '').toLowerCase())) return false
    if (rtkSearch.trim()) {
      const s = rtkSearch.toLowerCase()
      return (
        c.case_number?.toLowerCase().includes(s) ||
        (c.requestor_id || '').toLowerCase().includes(s) ||
        (c.detail?.request_topic || '').toLowerCase().includes(s) ||
        (c.description || '').toLowerCase().includes(s)
      )
    }
    return true
  }).sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted))

  // Outcome breakdown
  const resolved = cases.filter(c => ['resolved','closed'].includes((c.statuses?.name||'').toLowerCase())).length
  const lacksResources = cases.filter(c => (c.statuses?.name||'').toLowerCase() === 'lacks resources to resolve').length
  const unfounded = cases.filter(c => (c.statuses?.name||'').toLowerCase() === 'unfounded').length
  const inProgress = cases.length - resolved - lacksResources - unfounded
  const total = cases.length || 1
  const outcomeSegments = [
    { label: 'Closed', count: resolved, color: '#16a34a', pct: Math.round((resolved/total)*100) },
    { label: 'In Progress', count: inProgress, color: '#1a56a0', pct: Math.round((inProgress/total)*100) },
    { label: 'Lacks Resources to Resolve', count: lacksResources, color: '#dc2626', pct: Math.round((lacksResources/total)*100) },
    { label: 'Unfounded', count: unfounded, color: '#d97706', pct: Math.round((unfounded/total)*100) },
  ].filter(s => s.count > 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      <div style={{ backgroundColor: '#1a56a0', padding: '32px 32px 28px 32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#e8eef6', margin: '0 0 6px 0' }}>📊 City of Franklin — Service Request Analytics</h1>
        <p style={{ fontSize: '16px', color: '#93afd4', margin: 0 }}>Public transparency dashboard — Franklin, New Hampshire</p>
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <ScoreCard value={formatNum(totalCases)} label="Total Cases Received" color="#1a56a0" />
          <ScoreCard value={formatNum(resolvedCases.length)} label="Cases Resolved" color="#16a34a" />
          <ScoreCard value={formatNum(openCases.length)} label="Currently Open" color="#d97706" />
          <ScoreCard value={avgDaysToResolve} label="Avg Days to Resolve" color="#7c3aed" />
          <ScoreCard value={resolutionRate} label="Resolution Rate" color="#0891b2" />
        </div>

        {/* Case Outcome Breakdown */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>📊 Case Outcomes — What Happened to Every Request</div>
          <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '16px' }}>
            This chart shows the outcome of every service request submitted to the City.
          </div>
          <div style={{ display: 'flex', height: '34px', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
            {outcomeSegments.map(s => (
              <div key={s.label} style={{ width: `${s.pct}%`, backgroundColor: s.color, minWidth: s.count > 0 ? '2px' : '0' }} title={`${s.label}: ${s.count}`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {outcomeSegments.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#374151' }}>{s.label}</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: s.color }}>{s.pct}%</span>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>({s.count})</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
            "Lacks Resources to Resolve" and "Unfounded" cases represent situations where the City either did not have the capacity to address the issue or the reported issue could not be verified.
          </div>
        </div>

        <SectionCard
          title="📋 Cases by Department"
          description="This chart shows how service requests are distributed across City departments. Each department is responsible for addressing the issues assigned to them. A higher volume reflects the demand placed on that department by our community."
        >
          <BarChart data={deptData} labelKey="dept" valueKey="count" colorFn={i => BAR_COLORS[i % BAR_COLORS.length]} />
        </SectionCard>

        <SectionCard
          title="🔧 Cases by Issue Type"
          description="What are Franklin residents reporting most? This breakdown shows the types of issues submitted by the community, helping the City identify patterns, prioritize resources, and address the most common concerns."
        >
          <BarChart data={typeData} labelKey="type" valueKey="count" />
        </SectionCard>

        <SectionCard
          title="📅 Monthly Case Volume"
          description="Tracking how many requests come in each month helps us understand seasonal trends and measure our responsiveness over time."
        >
          <BarChart data={monthlyData} labelKey="label" valueKey="count" />
        </SectionCard>

        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a56a0', marginBottom: '4px' }}>⚖️ Right-to-Know Requests (RSA 91-A)</div>
          <div style={{ fontSize: '15px', color: '#1e40af', lineHeight: '1.6' }}>Public transparency data on records requests filed with the City of Franklin. Under New Hampshire's Right-to-Know Law, residents have the right to request access to public records. The data below reflects how we are fulfilling that responsibility.</div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
  <ScoreCard value={formatNum(total91a)} label="Total 91-A Requests" color="#1a56a0" />
  <ScoreCard value={onTimeRate} label="Acknowledged On Time" sub="Within 5 business days" color="#d97706" />
  <ScoreCard value={formatHours(totalHours)} label="Total Staff Hours" color="#7c3aed" />
  <ScoreCard value={formatMoney(totalTaxDollars)} label="Tax Dollars Spent" sub="Staff time & resources" color="#dc2626" />
  <ScoreCard value={formatMoney(totalFees)} label="Fees Collected" color="#16a34a" />
  <ScoreCard value={formatNum(totalDocsReleased)} label="Documents Requested" color="#16a34a" />
</div>

        <SectionCard
          title="📁 Requests by Topic"
          description="Right-to-Know requests cover a wide range of public records. This chart shows which categories of records are most frequently requested, reflecting the areas of City government that residents are most interested in."
        >
          <BarChart data={topicData} labelKey="topic" valueKey="count" colorFn={i => BAR_COLORS[i % BAR_COLORS.length]} />
        </SectionCard>

        <SectionCard
          title="🔁 Top Repeat Requestors"
          description="Some individuals file multiple Right-to-Know requests over time. Requestors are identified by assigned ID numbers only, no names are displayed publicly. This chart reflects the volume of requests from our most active filers."
        >
          <BarChart data={repeatRequestors} labelKey="label" valueKey="count" colorFn={i => BAR_COLORS[i % BAR_COLORS.length]} />
        </SectionCard>

        {/* 91-A Status Key */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>🔑 Status Guide</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { status: 'Closed', color: '#065f46', bg: '#d1fae5', desc: 'The request has been fulfilled and records have been released.' },
              { status: 'Gathering Records', color: '#1e40af', bg: '#dbeafe', desc: 'The City is actively searching for and collecting the requested records.' },
              { status: 'Reviewing Records', color: '#1e40af', bg: '#dbeafe', desc: 'Records have been collected and are currently under legal review before release.' },
              { status: 'Request Abandoned', color: '#991b1b', bg: '#fee2e2', desc: 'The requestor has not scheduled a pick up of their records and the request has been closed.' },
              { status: 'Clarification Needed', color: '#92400e', bg: '#fef3c7', desc: 'The City needs additional information from the requestor to proceed.' },
              { status: 'Records Ready - Please Schedule Pick Up', color: '#92400e', bg: '#fef3c7', desc: 'Records are ready and the requestor needs to schedule an appointment.' },
            ].map(({ status, color, bg, desc }) => (
              <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: bg, color, marginBottom: '10px', display: 'inline-block' }}>{status}</span>
                <span style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 91-A Public Log */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>📜 Public Right-to-Know Request Log</div>
            <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '12px' }}>A complete public record of all Right-to-Know requests filed with the City of Franklin. Requestor names are not shown — each person is assigned a unique Requestor ID for privacy.</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by case #, RID, topic..."
                value={rtkSearch}
                onChange={e => setRtkSearch(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', width: '240px' }}
              />
              <select
                value={rtkStatusFilter}
                onChange={e => setRtkStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', backgroundColor: '#ffffff' }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open Only</option>
                <option value="closed">Closed Only</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Case #', width: '80px' },
                    { label: 'Date', width: '100px' },
                    { label: 'Requestor ID', width: '110px' },
                    { label: 'Topic', width: '160px' },
                    { label: 'Request', width: 'auto' },
                    { label: 'Status', width: '140px' },
                    { label: 'Hours', width: '70px' },
                    { label: 'Fees', width: '80px' },
                  ].map(h => (
                    <th key={h.label} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap', width: h.width }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '160px' }} />
                  <col />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <tbody>
                  {rtkTableCases.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontSize: '14px' }}>No records found.</td>
                    </tr>
                  ) : rtkTableCases.map(c => (
                    <tr key={c.id}>
                      <td style={{ padding: '10px 12px', fontSize: '14px', borderBottom: '1px solid #f3f4f6', fontWeight: '700', color: '#1a56a0' }}>{c.case_number}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', whiteSpace: 'nowrap' }}>{formatDate(c.date_submitted)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '14px', borderBottom: '1px solid #f3f4f6', color: '#374151', fontWeight: '600' }}>{c.requestor_id || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.detail?.request_topic || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                        <div style={{ maxHeight: '60px', overflowY: 'auto', lineHeight: '1.5' }}>{c.description || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={getStatusStyle(c.statuses?.name)}>{c.statuses?.name || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', textAlign: 'right' }}>
                        {c.detail?.hours_worked ? parseFloat(c.detail.hours_worked).toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f3f4f6', color: '#374151', textAlign: 'right' }}>
                        {c.detail?.fees_collected ? `$${parseFloat(c.detail.fees_collected).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ padding: '10px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
            Showing {rtkTableCases.length} of {rtkCases.length} requests. Requestor names are not displayed publicly — Requestor IDs are assigned for tracking purposes only.
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', paddingBottom: '24px' }}>
          Data updated in real time.
        </div>
      </div>
    </div>
  )
}

export default PublicAnalytics
