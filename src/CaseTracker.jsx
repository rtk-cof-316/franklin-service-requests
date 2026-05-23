import { useState } from 'react'
import { supabase } from './supabaseClient'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '40px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    maxWidth: '620px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    padding: '28px 32px',
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '0.3px',
  },
  headerSub: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.85,
  },
  body: {
    padding: '32px',
  },
  searchRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#111827',
    outline: 'none',
  },
  searchBtn: {
    padding: '10px 20px',
    backgroundColor: '#1a56a0',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  searchBtnDisabled: {
    padding: '10px 20px',
    backgroundColor: '#93afd4',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    whiteSpace: 'nowrap',
  },
  notFound: {
    textAlign: 'center',
    padding: '24px',
    color: '#6b7280',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  resultCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  resultHeader: {
    backgroundColor: '#f9fafb',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseNumber: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a56a0',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  resultBody: {
    padding: '20px',
  },
  fieldRow: {
    marginBottom: '16px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#111827',
    lineHeight: '1.5',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e5e7eb',
    margin: '16px 0',
  },
  hint: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  tag91a: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#1a56a0',
    border: '1px solid #bfdbfe',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '4px',
  },
}

function getStatusStyle(statusName) {
  const s = (statusName || '').toLowerCase()
  if (s === 'resolved' || s === 'closed') {
    return { ...styles.statusBadge, backgroundColor: '#d1fae5', color: '#065f46' }
  }
  if (s === 'in progress' || s === 'assigned' || s === 'scheduled') {
    return { ...styles.statusBadge, backgroundColor: '#dbeafe', color: '#1e40af' }
  }
  if (s === 'lacks resources to resolve' || s === 'unfounded') {
    return { ...styles.statusBadge, backgroundColor: '#fee2e2', color: '#991b1b' }
  }
  return { ...styles.statusBadge, backgroundColor: '#f3f4f6', color: '#374151' }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function CaseTracker() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setResult(null)

    const { data, error } = await supabase
      .from('cases')
      .select(`
        case_number,
        date_submitted,
        location,
        description,
        is_91a,
        closed_date,
        statuses ( name )
      `)
      .ilike('case_number', query.trim())
      .single()

    if (error || !data) {
      setResult(null)
    } else {
      setResult(data)
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Check Request Status</h1>
          <p style={styles.headerSub}>City of Franklin, New Hampshire</p>
        </div>
        <div style={styles.body}>
          <p style={styles.hint}>
            Enter the case number from your confirmation email to check the current status of your request.
          </p>

          <div style={styles.searchRow}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 1-26"
              style={styles.input}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={loading ? styles.searchBtnDisabled : styles.searchBtn}
            >
              {loading ? 'Searching...' : 'Look Up'}
            </button>
          </div>

          {searched && !loading && !result && (
            <div style={styles.notFound}>
              No case found for <strong>{query}</strong>. Please check your case number and try again.
            </div>
          )}

          {result && (
            <div style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <div style={styles.caseNumber}>Case #{result.case_number}</div>
                <div style={getStatusStyle(result.statuses?.name)}>
                  {result.statuses?.name || 'Unknown'}
                </div>
              </div>
              <div style={styles.resultBody}>
                <div style={styles.fieldRow}>
                  <div style={styles.fieldLabel}>Date Submitted</div>
                  <div style={styles.fieldValue}>{formatDate(result.date_submitted)}</div>
                </div>
                <hr style={styles.divider} />
                <div style={styles.fieldRow}>
                  <div style={styles.fieldLabel}>
                    {result.is_91a ? 'Subject of Request' : 'Location / Address'}
                  </div>
                  <div style={styles.fieldValue}>{result.location || '—'}</div>
                </div>
                <hr style={styles.divider} />
                <div style={styles.fieldRow}>
                  <div style={styles.fieldLabel}>Description</div>
                  <div style={styles.fieldValue}>{result.description}</div>
                </div>
                {result.is_91a && (
                  <>
                    <hr style={styles.divider} />
                    <div style={styles.fieldRow}>
                      <div style={styles.fieldLabel}>Request Type</div>
                      <div style={styles.tag91a}>Right-to-Know (RSA 91-A)</div>
                    </div>
                  </>
                )}
                {result.closed_date && (
                  <>
                    <hr style={styles.divider} />
                    <div style={styles.fieldRow}>
                      <div style={styles.fieldLabel}>Date Closed</div>
                      <div style={styles.fieldValue}>{formatDate(result.closed_date)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CaseTracker
