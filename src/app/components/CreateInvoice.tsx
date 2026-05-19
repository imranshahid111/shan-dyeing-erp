import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { FileText, Printer, Download, ArrowLeft } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dos, setDos] = useState<DeliveryOrderItem[]>([]);
  const [selectedDO, setSelectedDO] = useState<DeliveryOrderItem | null>(null);
  const [rate, setRate] = useState(0);
  const [rateInput, setRateInput] = useState('0');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountInput, setDiscountInput] = useState('0');
  const [kinarCutAmount, setKinarCutAmount] = useState(0);
  const [kinarCutInput, setKinarCutInput] = useState('0');
  const [packingAmount, setPackingAmount] = useState(0);
  const [packingInput, setPackingInput] = useState('0');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateUnit, setRateUnit] = useState<'meter' | 'yard'>('meter');


  useEffect(() => {
    const fetchDOs = async () => {
      try {
        setLoading(true);
        const response = await deliveryOrderService.getDeliveryOrders('completed', 1, 100);
        setDos(response.data);
        
        // Handle pre-selected DO from navigation state
        const preSelectedId = location.state?.preSelectedDoId;
        if (preSelectedId) {
          const found = response.data.find((d: DeliveryOrderItem) => d.id === preSelectedId);
          if (found) setSelectedDO(found);
        }
      } catch (error) {
        console.error("Failed to fetch DOs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDOs();
  }, []);

  const meterQuantity = selectedDO ? Number(selectedDO.total_ready_gazana || 0) : 0;
  const grayMeterQuantity = selectedDO ? Number(selectedDO.total_gray_gazana || 0) : 0;
  const yardQuantity = meterQuantity / 0.9144;
  
  const effectiveQuantity = rateUnit === 'meter' ? meterQuantity : yardQuantity;
  const grossAmount = effectiveQuantity * rate;

  const discountAmount =
    discountType === 'percentage' ? (grossAmount * discountValue) / 100 : discountValue;
  const netAmount = grossAmount - discountAmount + kinarCutAmount + packingAmount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/billing')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Create New Invoice</h2>
      </div>

      {/* DO Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Delivery Order</h3>
        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={loading}
          onChange={(e) => {
            const doItem = dos.find((d) => String(d.id) === e.target.value);
            setSelectedDO(doItem || null);
          }}
          value={selectedDO?.id || ''}
        >
          <option value="">{loading ? 'Loading DOs...' : 'Choose DO...'}</option>
          {dos.map((doItem) => (
            <option key={doItem.id} value={doItem.id}>
              {doItem.order_no} - {doItem.customer?.name}
            </option>
          ))}
        </select>

        {selectedDO && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Lot No</p>
              <p className="font-medium text-gray-800">{selectedDO.gray_lot?.lot_no}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Party</p>
              <p className="font-medium text-gray-800">{selectedDO.customer?.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Gray Mtr</p>
              <p className="font-medium text-gray-800">{grayMeterQuantity.toFixed(2)}m</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Ready Mtr</p>
              <p className="font-bold text-blue-600">{meterQuantity.toFixed(2)}m</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Ready Yds (Gaz)</p>
              <p className="font-bold text-blue-600">{yardQuantity.toFixed(2)}y</p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      {selectedDO && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h3>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Apply Rate On</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRateUnit('meter')}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all font-bold ${rateUnit === 'meter' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                  >
                    Per Meter
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateUnit('yard')}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all font-bold ${rateUnit === 'yard' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                  >
                    Per Yard (Gaz)
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Rate (Rs)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateInput}
                  onChange={(e) => {
                    setRateInput(e.target.value);
                    setRate(parseFloat(e.target.value) || 0);
                  }}
                  onBlur={() => {
                    if (rateInput === '' || isNaN(parseFloat(rateInput))) {
                      setRateInput('0');
                      setRate(0);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gross Amount</span>
                <span className="text-xl font-semibold text-gray-800">Rs {grossAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Kinar Cut Amount (Rs)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={kinarCutInput}
                  onChange={(e) => {
                    setKinarCutInput(e.target.value);
                    setKinarCutAmount(parseFloat(e.target.value) || 0);
                  }}
                  onBlur={() => {
                    if (kinarCutInput === '' || isNaN(parseFloat(kinarCutInput))) {
                      setKinarCutInput('0');
                      setKinarCutAmount(0);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Packing Amount (Rs)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={packingInput}
                  onChange={(e) => {
                    setPackingInput(e.target.value);
                    setPackingAmount(parseFloat(e.target.value) || 0);
                  }}
                  onBlur={() => {
                    if (packingInput === '' || isNaN(parseFloat(packingInput))) {
                      setPackingInput('0');
                      setPackingAmount(0);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
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
                value={discountInput}
                onChange={(e) => {
                  setDiscountInput(e.target.value);
                  setDiscountValue(parseFloat(e.target.value) || 0);
                }}
                onBlur={() => {
                  if (discountInput === '' || isNaN(parseFloat(discountInput))) {
                    setDiscountInput('0');
                    setDiscountValue(0);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                placeholder={discountType === 'percentage' ? '0%' : 'Rs 0.00'}
              />
            </div>

            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Discount Amount</span>
                <span className="text-lg font-medium text-red-600">-Rs {discountAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Net Amount</span>
                <span className="text-2xl font-bold text-green-600">Rs {netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button 
              onClick={async () => {
                if (!selectedDO || isSubmitting) return;
                try {
                  setIsSubmitting(true);
                  await deliveryOrderService.generateInvoice(selectedDO.id, netAmount, rate, rateUnit, kinarCutAmount, packingAmount);
                  alert("Invoice generated and customer ledger updated!");
                  navigate('/billing');
                } catch (err) {
                  console.error(err);
                  alert("Failed to generate invoice");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || rate <= 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FileText size={18} />
              {isSubmitting ? 'Generating...' : 'Confirm & Save Invoice'}
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              <Printer size={18} />
              Print Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
