import { useState } from 'react';
import { Printer, Save, ClipboardCheck } from 'lucide-react';

const mockInvoices = [
  { invoiceNo: 'INV-4521', partyName: 'ABC Textiles', amount: 52000 },
  { invoiceNo: 'INV-4522', partyName: 'XYZ Industries', amount: 38500 },
];

export default function GatePass() {
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const formField = (label: string, input: React.ReactNode) => (
    <div>
      <label className="form-label">{label}</label>
      {input}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ClipboardCheck size={22} style={{ color: 'var(--brand-500)' }} />
            Gate Pass
          </h2>
          <p>Issue and print gate passes for outgoing shipments</p>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem', alignItems: 'start',
      }}>
        {/* Form Panel */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
              Gate Pass Details
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {formField('Date',
                <input
                  type="date"
                  className="input-field"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              )}
              {formField('Gate Pass No',
                <input
                  type="text"
                  className="input-field"
                  placeholder="Auto-generated"
                  disabled
                />
              )}
            </div>

            {formField('Invoice / DO Reference',
              <select
                className="input-field"
                onChange={e => {
                  const inv = mockInvoices.find(i => i.invoiceNo === e.target.value);
                  setSelectedInvoice(inv || null);
                }}
              >
                <option value="">Select invoice...</option>
                {mockInvoices.map(inv => (
                  <option key={inv.invoiceNo} value={inv.invoiceNo}>
                    {inv.invoiceNo} — {inv.partyName}
                  </option>
                ))}
              </select>
            )}

            {selectedInvoice && (
              <div style={{
                padding: '0.875rem 1rem',
                background: 'var(--brand-50)',
                border: '1.5px solid var(--brand-100)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Party Name</p>
                <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{selectedInvoice.partyName}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--brand-600)', fontWeight: 600, marginTop: '0.25rem' }}>
                  Amount: Rs {selectedInvoice.amount.toLocaleString()}
                </p>
              </div>
            )}

            {formField('Vehicle Number',
              <input
                type="text"
                className="input-field"
                placeholder="e.g. LHR-123-ABC"
              />
            )}

            {formField('Driver Name',
              <input
                type="text"
                className="input-field"
                placeholder="Enter driver name"
              />
            )}

            {formField('Driver Mobile',
              <input
                type="tel"
                className="input-field"
                placeholder="+92 300 0000000"
              />
            )}

            {formField('Notes',
              <textarea
                className="input-field"
                placeholder="Additional transport details..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                <Save size={16} />
                Save Gate Pass
              </button>
              <button className="btn btn-secondary">
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Print Preview */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
              Print Preview
            </h3>
            <span className="badge badge-blue">Preview</span>
          </div>
          <div className="card-body">
            <div style={{
              border: '2px solid var(--gray-200)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              background: 'white',
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--gray-200)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', margin: 0, color: 'var(--gray-900)' }}>
                  GATE PASS
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
                  Shan Dyeing — Textile Factory
                </p>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Gate Pass No:</p>
                  <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>GP-2026-001</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Date:</p>
                  <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                    {new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--gray-150)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Party Name:</p>
                <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{selectedInvoice?.partyName || '—'}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--gray-150)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Vehicle & Driver Details:</p>
                <p style={{ color: 'var(--gray-700)', marginBottom: '0.375rem' }}>Vehicle: _______________________</p>
                <p style={{ color: 'var(--gray-700)' }}>Driver: _________________________</p>
              </div>

              {/* Signatures */}
              <div style={{
                borderTop: '1px solid var(--gray-150)',
                paddingTop: '3.5rem', marginTop: '2rem',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <div style={{ borderTop: '1px solid var(--gray-400)', paddingTop: '0.5rem', width: '40%', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Security Signature</p>
                </div>
                <div style={{ borderTop: '1px solid var(--gray-400)', paddingTop: '0.5rem', width: '40%', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
