import { useState } from 'react';
import { Printer, Save } from 'lucide-react';

const mockInvoices = [
  { invoiceNo: 'INV-4521', partyName: 'ABC Textiles', amount: 52000 },
  { invoiceNo: 'INV-4522', partyName: 'XYZ Industries', amount: 38500 },
];

export default function GatePass() {
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Gate Pass Form</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Date</label>
              <input
                type="date"
                defaultValue="2026-04-18"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Gate Pass No</label>
              <input
                type="text"
                placeholder="Auto-generated"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Invoice / DO Reference</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const invoice = mockInvoices.find((inv) => inv.invoiceNo === e.target.value);
                setSelectedInvoice(invoice || null);
              }}
            >
              <option value="">Select invoice...</option>
              {mockInvoices.map((inv) => (
                <option key={inv.invoiceNo} value={inv.invoiceNo}>
                  {inv.invoiceNo} - {inv.partyName}
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">Party Name</p>
              <p className="font-medium text-gray-800 mt-1">{selectedInvoice.partyName}</p>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-2">Vehicle Number</label>
            <input
              type="text"
              placeholder="e.g., MH-12-AB-1234"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Driver Name</label>
            <input
              type="text"
              placeholder="Enter driver name"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Driver Mobile</label>
            <input
              type="tel"
              placeholder="+91 "
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Notes</label>
            <textarea
              placeholder="Additional transport details..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Save size={18} />
              Save Gate Pass
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <Printer size={18} />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Printable Preview */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-6 print:shadow-none">
        <div className="border-2 border-gray-300 p-8">
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h2 className="text-2xl font-bold">GATE PASS</h2>
            <p className="text-sm text-gray-600 mt-2">Textile Dyeing Factory</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Gate Pass No:</p>
                <p className="font-medium">GP-2024-001</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date:</p>
                <p className="font-medium">April 18, 2026</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">Party Name:</p>
              <p className="font-medium">{selectedInvoice?.partyName || '-'}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">Vehicle & Driver Details:</p>
              <div className="mt-2 space-y-1">
                <p className="font-medium">Vehicle: __________________</p>
                <p className="font-medium">Driver: __________________</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-8">
              <div className="flex justify-between mt-12">
                <div>
                  <p className="border-t border-gray-400 pt-2">Security Signature</p>
                </div>
                <div>
                  <p className="border-t border-gray-400 pt-2">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
