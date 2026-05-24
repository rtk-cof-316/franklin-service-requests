import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function PrintMultipleWorkOrders({ caseIds, onClose }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCases()
  }, [caseIds])

  async function loadCases() {
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
      .in('id', caseIds)
    if (data) {
      const sorted = caseIds.map(id => data.find(c => c.id === id)).filter(Boolean)
      setCases(sorted)
    }
    setLoading(false)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  const pairs = []
  for (let i = 0; i < cases.length; i += 2) {
    pairs.push([cases[i], cases[i + 1] || null])
  }

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; font-size: 11px; }
          .print-sheet { padding: 16px 24px; font-family: Arial, sans-serif; page-break-after: always; }
          .print-sheet:last-child { page-break-after: avoid; }
          .work-order { width: 100%; }
          .cut-line { border: none; border-top: 1px dashed #9ca3af; margin: 12px 0; }
          * { box-sizing: border-box; }
        }
        @media screen {
          body { background: #f0f4f8; }
          .print-sheet { max-width: 680px; margin: 0 auto 24px auto; padding: 20px 28px; font-family: Arial, sans-serif; background: white; font-size: 13px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .cut-line { border: none; border-top: 2px dashed #9ca3af; margin: 16px 0; position: relative; }
        }
      `}</style>

      <div className="no-print" style={{ backgroundColor: '#0f3d7a', padding: '12px 24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #93afd4', color: '#93afd4', cursor: 'pointer', fontSize: '13px', padding: '4px 12px', borderRadius: '4px' }}>
          ← Back
        </button>
        <span style={{ color: '#93afd4', fontSize: '13px' }}>{cases.length} work order{cases.length !== 1 ? 's' : ''} selected</span>
        <button onClick={() => window.print()} style={{ backgroundColor: '#1a56a0', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '13px', padding: '6px 16px', borderRadius: '4px', fontWeight: '600' }}>
          Print / Save as PDF
        </button>
      </div>

      {pairs.map((pair, pairIndex) => (
        <div key={pairIndex} className="print-sheet">
          <WorkOrderBlock caseData={pair[0]} formatDate={formatDate} />
          {pair[1] && (
            <>
              <div className="cut-line" />
              <WorkOrderBlock caseData={pair[1]} formatDate={formatDate} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function WorkOrderBlock({ caseData, formatDate }) {
  if (!caseData) return null
  return (
    <div className="work-order">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1a56a0', paddingBottom: '8px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a56a0', lineHeight: 1 }}>City of Franklin, NH</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Department Work Order</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a56a0', lineHeight: 1 }}>Case #{caseData.case_number}</div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>Printed: {formatDate(new Date().toISOString())}</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px 8px', fontWeight: '700', color: '#6b7280', width: '120px', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Date</td>
            <td style={{ padding: '4px 8px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{formatDate(caseData.date_submitted)}</td>
            <td style={{ padding: '4px 8px', fontWeight: '700', color: '#6b7280', width: '120px', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Issue Type</td>
            <td style={{ padding: '4px 8px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.issue_types?.name || '—'}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <td style={{ padding: '4px 8px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Status</td>
            <td style={{ padding: '4px 8px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.statuses?.name || '—'}</td>
            <td style={{ padding: '4px 8px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Assigned To</td>
            <td style={{ padding: '4px 8px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.case_departments?.map(cd => cd.departments?.name).join(', ') || '—'}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 8px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Location</td>
            <td colSpan={3} style={{ padding: '4px 8px', borderLeft: '1px solid #e5e7eb', color: '#111827' }}>{caseData.location || '—'}</td>
          </tr>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <td style={{ padding: '4px 8px', fontWeight: '700', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', verticalAlign: 'top' }}>Description</td>
            <td colSpan={3} style={{ padding: '4px 8px', borderLeft: '1px solid #e5e7eb', color: '#111827', lineHeight: '1.5' }}>{caseData.description}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ border: '1.5px solid #1a56a0', borderRadius: '4px', padding: '10px 12px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#1a56a0', marginBottom: '8px' }}>Staff Resolution</div>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>Assigned Staff:</div>
            <div style={{ borderBottom: '1px solid #9ca3af', height: '18px' }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>Date Completed:</div>
            <div style={{ borderBottom: '1px solid #9ca3af', height: '18px' }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>Outcome:</div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', paddingTop: '1px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><input type="checkbox" /> Resolved</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><input type="checkbox" /> Partial</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><input type="checkbox" /> Unable</label>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Notes:</div>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ borderBottom: '1px solid #d1d5db', height: '20px', marginBottom: '3px' }}></div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', paddingTop: '6px', fontSize: '10px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
        <span>City of Franklin, NH — Service Request System</span>
        <span>Case #{caseData.case_number}</span>
      </div>
    </div>
  )
}

export default PrintMultipleWorkOrders
