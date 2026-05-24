import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function PrintWorkOrder({ caseId, onClose }) {
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCase()
  }, [caseId])

  async function loadCase() {
    setLoading(true)
    const { data } = await supabase
      .from('cases')
      .select(`
        *,
        statuses ( name ),
        issue_types ( name ),
        case_departments (
          departments ( name ),
          statuses ( name )
        )
      `)
      .eq('id', caseId)
      .single()
    if (data) setCaseData(data)
    setLoading(false)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  if (!caseData) return <div style={{ padding: '40px', textAlign: 'center' }}>Case not found.</div>

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; font-size: 11px; }
          .print-page { padding: 20px 28px; font-family: Arial, sans-serif; }
          * { box-sizing: border-box; }
        }
        @media screen {
          .print-page { max-width: 680px; margin: 0 auto; padding: 28px; font-family: Arial, sans-serif; background: white; font-size: 13px; }
          body { background: #f0f4f8; }
        }
      `}</style>

      <div className="no-print" style={{ backgroundColor: '#0f3d7a', padding: '12px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
          ← Back
        </button>
        <button onClick={() => window.print()} style={{ backgroundColor: '#1a56a0', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '13px', padding: '6px 16px', borderRadius: '4px', fontWeight: '600' }}>
          Print / Save as PDF
        </button>
      </div>

      <div className="print-page">

        {/* Header — compact two-column */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1a56a0', paddingBottom: '10px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a56a0', lineHeight: 1 }}>City of Franklin, NH</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Department Work Order</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a56a0', lineHeight: 1 }}>Case #{caseData.case_number}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Printed: {formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Case info — compact table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 10px', fontWeight: '700', color: '#6b7280', width: '140px', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Date Submitted</td>
              <td style={{ padding: '5px 10px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{formatDate(caseData.date_submitted)}</td>
              <td style={{ padding: '5px 10px', fontWeight: '700', color: '#6b7280', width: '140px', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Issue Type</td>
              <td style={{ padding: '5px 10px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.issue_types?.name || '—'}</td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '5px 10px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Status</td>
              <td style={{ padding: '5px 10px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.statuses?.name || '—'}</td>
              <td style={{ padding: '5px 10px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Assigned To</td>
              <td style={{ padding: '5px 10px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.case_departments?.map(cd => cd.departments?.name).join(', ') || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 10px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Location</td>
              <td colSpan={3} style={{ padding: '5px 10px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.location || '—'}</td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '5px 10px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Description</td>
              <td colSpan={3} style={{ padding: '5px 10px', borderLeft: '1px solid #e5e7eb', color: '#111827', lineHeight: '1.5' }}>{caseData.description}</td>
            </tr>
          </tbody>
        </table>

        {/* Staff resolution section */}
        <div style={{ border: '1.5px solid #1a56a0', borderRadius: '5px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1a56a0', marginBottom: '4px' }}>
            Staff Resolution
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '12px' }}>
            Complete and return to your department administrator when the issue has been addressed.
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Assigned Staff:</div>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '20px' }}></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Date Completed:</div>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '20px' }}></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Outcome:</div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', paddingTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" /> Resolved</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" /> Partial</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" /> Unable</label>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Notes:</div>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ borderBottom: '1px solid #d1d5db', height: '24px', marginBottom: '3px' }}></div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '8px', fontSize: '10px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
          <span>City of Franklin, NH — Service Request System</span>
          <span>Case #{caseData.case_number}</span>
        </div>

      </div>
    </div>
  )
}

export default PrintWorkOrder
