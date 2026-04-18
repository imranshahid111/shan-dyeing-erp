import { useState } from 'react';
import { FileText, Printer, Download } from 'lucide-react';

const mockDOs = [
  { doNo: 'DO-5623', lotNo: 'GL-2045', partyName: 'ABC Textiles', readyGazana: 240 },
  { doNo: 'DO-5624', lotNo: 'GL-2046', partyName: 'XYZ Industries', readyGazana: 175 },
];

export default function Billing() {
  const [selectedDO, setSelectedDO] = useState<typeof mockDOs[0] | null>(null);
  const [rate, setRate] = useState(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  const grossAmount = selectedDO ? selectedDO.readyGazana * rate : 0;
  const discountAmount =
    discountType === 'percentage' ? (grossAmount * discountValue) / 100 : discountValue;
  const netAmount = grossAmount - discountAmount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* DO Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Delivery Order</h3>
        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => {
            const doItem = mockDOs.find((d) => d.doNo === e.target.value);
            setSelectedDO(doItem || null);
          }}
        >
          <option value="">Choose DO...</option>
          {mockDOs.map((doItem) => (
            <option key={doItem.doNo} value={doItem.doNo}>
              {doItem.doNo} - {doItem.partyName}
            </option>
          ))}
        </select>

        {selectedDO && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Lot No</p>
              <p className="font-medium text-gray-800">{selectedDO.lotNo}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Party</p>
              <p className="font-medium text-gray-800">{selectedDO.partyName}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Ready Gazana</p>
              <p className="font-medium text-gray-800">{selectedDO.readyGazana}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      {selectedDO && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Rate per Gaz/Meter</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gross Amount</span>
                <span className="text-xl font-semibold text-gray-800">₹{grossAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Discount</label>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                  <input
                    type="radio"
                    name="discountType"
                    checked={discountType === 'percentage'}
                    onChange={() => setDiscountType('percentage')}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Percentage</label>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                  <input
                    type="radio"
                    name="discountType"
                    checked={discountType === 'flat'}
                    onChange={() => setDiscountType('flat')}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Flat Amount</label>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                placeholder={discountType === 'percentage' ? '0%' : '₹0.00'}
              />
            </div>

            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discount Amount</span>
                <span className="text-lg font-medium text-red-600">-₹{discountAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Net Amount</span>
                <span className="text-2xl font-bold text-green-600">₹{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <FileText size={18} />
              Generate Invoice
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <Printer size={18} />
              Print
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
