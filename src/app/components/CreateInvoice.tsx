import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { FileText, Printer, ArrowLeft, Search, ChevronDown, Check } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { toast } from 'sonner';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dos, setDos] = useState<DeliveryOrderItem[]>([]);
  const [selectedDO, setSelectedDO] = useState<DeliveryOrderItem | null>(null);
  
  const [doSearch, setDoSearch] = useState('');
  const [isDoDropdownOpen, setIsDoDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [rate, setRate] = useState(0);
  const [rateInput, setRateInput] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountInput, setDiscountInput] = useState('');
  
  const [kinarCutAmount, setKinarCutAmount] = useState(0);
  const [kinarCutInput, setKinarCutInput] = useState('');
  
  const [packingAmount, setPackingAmount] = useState(0);
  const [packingInput, setPackingInput] = useState('');
  
  const [focusedDoIndex, setFocusedDoIndex] = useState(0);
  const rateInputRef = useRef<HTMLInputElement>(null);
  
  const [kinarCutQtyInput, setKinarCutQtyInput] = useState('');
  const [packingQtyInput, setPackingQtyInput] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateUnit, setRateUnit] = useState<'meter' | 'yard'>('meter');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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
        } else {
          setIsDoDropdownOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch DOs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDOs();
  }, []);

  const yardQuantity = selectedDO ? Number(selectedDO.total_ready_gazana || 0) : 0;
  const grayYardQuantity = selectedDO ? Number(selectedDO.total_gray_gazana || 0) : 0;
  const meterQuantity = yardQuantity * 0.9144;
  const grayMeterQuantity = grayYardQuantity * 0.9144;
  
  const effectiveQuantity = rateUnit === 'meter' ? meterQuantity : yardQuantity;
  const grossAmount = effectiveQuantity * rate;

  const discountAmount =
    discountType === 'percentage' ? (grossAmount * discountValue) / 100 : discountValue;
    
  const finalKinarCutQty = kinarCutQtyInput === '' ? effectiveQuantity : (parseFloat(kinarCutQtyInput) || 0);
  const kinarCutTotal = kinarCutAmount * finalKinarCutQty;

  const finalPackingQty = packingQtyInput === '' ? effectiveQuantity : (parseFloat(packingQtyInput) || 0);
  const packingTotal = packingAmount * finalPackingQty;
  
  const netAmount = grossAmount - discountAmount + kinarCutTotal + packingTotal;

  const filteredDOs = dos.filter(d => 
    d.order_no.toLowerCase().includes(doSearch.toLowerCase()) || 
    (d.customer?.name || '').toLowerCase().includes(doSearch.toLowerCase())
  );

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
        <div className="relative" ref={dropdownRef}>
          <div 
            className={`w-full px-4 py-3 rounded-xl border ${isDoDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} bg-white flex items-center justify-between cursor-pointer transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => setIsDoDropdownOpen(!isDoDropdownOpen)}
          >
            <div className="flex flex-col">
              {selectedDO ? (
                <>
                  <span className="font-bold text-gray-800">{selectedDO.order_no}</span>
                  <span className="text-xs text-gray-500">{selectedDO.customer?.name}</span>
                </>
              ) : (
                <span className="text-gray-500">{loading ? 'Loading DOs...' : 'Choose Delivery Order...'}</span>
              )}
            </div>
            <ChevronDown size={20} className={`text-gray-400 transition-transform ${isDoDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDoDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                    placeholder="Search by DO number or party name..."
                    value={doSearch}
                    onChange={(e) => {
                      setDoSearch(e.target.value);
                      setFocusedDoIndex(0);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setFocusedDoIndex((prev) => (prev < filteredDOs.length - 1 ? prev + 1 : prev));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setFocusedDoIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredDOs[focusedDoIndex]) {
                          setSelectedDO(filteredDOs[focusedDoIndex]);
                          setIsDoDropdownOpen(false);
                          setDoSearch('');
                          setTimeout(() => document.getElementById('btn-meter')?.focus(), 100);
                        }
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredDOs.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No delivery orders found</div>
                ) : (
                  filteredDOs.map((doItem, index) => (
                    <div 
                      key={doItem.id} 
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0 ${focusedDoIndex === index ? 'bg-blue-100' : selectedDO?.id === doItem.id ? 'bg-blue-50/50' : 'hover:bg-blue-50'}`}
                      onClick={() => {
                        setSelectedDO(doItem);
                        setIsDoDropdownOpen(false);
                        setDoSearch('');
                        setTimeout(() => document.getElementById('btn-meter')?.focus(), 100);
                      }}
                      onMouseEnter={() => setFocusedDoIndex(index)}
                    >
                      <div>
                        <div className="font-bold text-gray-800">{doItem.order_no}</div>
                        <div className="text-xs text-gray-500">{doItem.customer?.name}</div>
                      </div>
                      {selectedDO?.id === doItem.id && <Check size={18} className="text-blue-600" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
                    id="btn-meter"
                    type="button"
                    onClick={() => {
                      setRateUnit('meter');
                      rateInputRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') document.getElementById('btn-yard')?.focus();
                    }}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${rateUnit === 'meter' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                  >
                    Per Meter
                  </button>
                  <button
                    id="btn-yard"
                    type="button"
                    onClick={() => {
                      setRateUnit('yard');
                      rateInputRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') document.getElementById('btn-meter')?.focus();
                    }}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${rateUnit === 'yard' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                  >
                    Per Yard (Gaz)
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Rate (Rs)</label>
                <input
                  ref={rateInputRef}
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
                      setRateInput('');
                      setRate(0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('kinarCutInput')?.focus();
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm text-gray-600">Kinar Cut Amount (Per {rateUnit === 'meter' ? 'Mtr' : 'Gaz'})</label>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rs</span>
                    <input
                      id="kinarCutInput"
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
                          setKinarCutInput('');
                          setKinarCutAmount(0);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('kinarCutQtyInput')?.focus();
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold uppercase">{rateUnit === 'meter' ? 'Mtr' : 'Gaz'}</span>
                    <input
                      id="kinarCutQtyInput"
                      type="number"
                      min="0"
                      step="0.01"
                      value={kinarCutQtyInput}
                      onChange={(e) => setKinarCutQtyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('packingInput')?.focus();
                        }
                      }}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder=""
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm text-gray-600">Packing Amount (Per {rateUnit === 'meter' ? 'Mtr' : 'Gaz'})</label>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">Rs</span>
                    <input
                      id="packingInput"
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
                          setPackingInput('');
                          setPackingAmount(0);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('packingQtyInput')?.focus();
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold uppercase">{rateUnit === 'meter' ? 'Mtr' : 'Gaz'}</span>
                    <input
                      id="packingQtyInput"
                      type="number"
                      min="0"
                      step="0.01"
                      value={packingQtyInput}
                      onChange={(e) => setPackingQtyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('discountInput')?.focus();
                        }
                      }}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder=""
                    />
                  </div>
                </div>
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
                id="discountInput"
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
                    setDiscountInput('');
                    setDiscountValue(0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('saveInvoiceBtn')?.focus();
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
              id="saveInvoiceBtn"
              onClick={async () => {
                if (!selectedDO || isSubmitting) return;
                try {
                  setIsSubmitting(true);
                  await deliveryOrderService.generateInvoice(
                    selectedDO.id, 
                    netAmount, 
                    rate, 
                    rateUnit, 
                    kinarCutTotal, 
                    packingTotal,
                    finalKinarCutQty,
                    finalPackingQty
                  );
                  toast.success("Invoice generated and customer ledger updated!");
                  navigate('/billing');
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to generate invoice");
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
