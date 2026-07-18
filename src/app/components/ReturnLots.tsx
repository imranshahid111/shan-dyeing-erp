//@ts-nocheck
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, Plus, Search, Trash2, X, ChevronDown, Check, Edit, Printer } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function ReturnLots() {
  const [returnLots, setReturnLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grayLots, setGrayLots] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLot, setPreviewLot] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [unit, setUnit] = useState<'meter' | 'yard'>('meter');
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const unitInputRef = useRef<HTMLSelectElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState({
    gray_lot_id: '',
    returned_quantity: '',
    return_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    if (isModalOpen) {
      setIsDropdownOpen(true);
      setActiveOptionIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setIsDropdownOpen(false);
    }
  }, [isModalOpen]);

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setUnit('meter');
    setFormData({
      gray_lot_id: '',
      returned_quantity: '',
      return_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
  };

  const handleEdit = (rl: any) => {
    setEditingId(rl.id);
    const isMeter = rl.gray_lot?.measurement?.toLowerCase() === 'meter';
    const displayedQty = isMeter 
      ? Number((rl.returned_quantity * 0.9144).toFixed(2)) 
      : rl.returned_quantity;

    setFormData({
      gray_lot_id: rl.gray_lot_id.toString(),
      returned_quantity: displayedQty.toString(),
      return_date: new Date(rl.return_date).toISOString().split('T')[0],
      reason: rl.reason || ''
    });
    setUnit(isMeter ? 'meter' : 'yard');
    setIsModalOpen(true);
  };

  const fetchReturnLots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/return-lots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
        }
      });
      const data = await res.json();
      setReturnLots(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load return lots');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrayLots = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/gray-lots/balances`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
        }
      });
      const data = await res.json();
      setGrayLots(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load gray lots');
    }
  };

  useEffect(() => {
    fetchReturnLots();
    fetchGrayLots();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const qty = parseFloat(formData.returned_quantity) || 0;
      // Convert meter to yard (gaz) because the system's base unit is gaz.
      // 1 yard = 0.9144 meters, so to convert meters to yards we divide by 0.9144.
      const finalQty = unit === 'meter' ? Number((qty / 0.9144).toFixed(4)) : qty;

      const payload = {
        ...formData,
        returned_quantity: finalQty
      };

      const url = editingId 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/return-lots/${editingId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/return-lots`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save return lot');
      
      toast.success(`Return lot ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchReturnLots();
      fetchGrayLots();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save return lot');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this return lot?')) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/return-lots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete return lot');
      
      toast.success('Return lot deleted successfully');
      fetchReturnLots();
      fetchGrayLots();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete return lot');
    }
  };

  const filteredLots = grayLots.filter(lot => 
    lot.lotNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lot.partyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Lots</h1>
          <p className="text-sm text-gray-500">Manage damaged and returned quantities from Gray Lots</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Return Lot
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Return Date</th>
                <th className="px-6 py-4">Lot No</th>
                <th className="px-6 py-4">Party Name</th>
                <th className="px-6 py-4">Returned Qty</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : returnLots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No return lots found.</td>
                </tr>
              ) : (
                returnLots.map((rl) => (
                  <tr key={rl.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(rl.return_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rl.gray_lot?.lot_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rl.gray_lot?.party_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {rl.gray_lot?.measurement?.toLowerCase() === 'meter' 
                        ? `${(Number(rl.returned_quantity) * 0.9144).toFixed(2)} Meters` 
                        : `${rl.returned_quantity} Yards`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]" title={rl.reason}>
                      {rl.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEdit(rl)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors mr-2"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setPreviewLot(rl)}
                        className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors mr-2"
                        title="Print Preview"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(rl.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Return Lot' : 'Add Return Lot'}</h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div ref={dropdownRef} className="relative z-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Gray Lot</label>
                <div 
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} bg-white cursor-pointer flex justify-between items-center transition-all`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={formData.gray_lot_id ? 'text-gray-800' : 'text-gray-400'}>
                    {formData.gray_lot_id 
                      ? (() => {
                          const lot = grayLots.find(l => l.id.toString() === formData.gray_lot_id);
                          return lot ? `${lot.lotNo} - ${lot.partyName} (Avail: ${lot.remaining})` : 'Select a lot...';
                        })()
                      : 'Select a lot...'
                    }
                  </span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-60 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                          placeholder="Search lot no or party name..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setActiveOptionIndex(0);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setActiveOptionIndex(prev => (prev + 1) % Math.max(1, filteredLots.length));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setActiveOptionIndex(prev => (prev - 1 + filteredLots.length) % Math.max(1, filteredLots.length));
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              const activeLot = filteredLots[activeOptionIndex];
                              if (activeLot) {
                                setFormData({ ...formData, gray_lot_id: activeLot.id.toString() });
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                                setTimeout(() => quantityInputRef.current?.focus(), 50);
                              }
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="p-1.5 overflow-y-auto">
                      {filteredLots.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                          <Search size={20} className="text-gray-300" />
                          <p>No lots found</p>
                        </div>
                      ) : (
                        filteredLots.map((lot, index) => (
                          <div
                            key={lot.id}
                            className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all ${
                              index === activeOptionIndex 
                                ? 'bg-blue-100 border border-blue-200 text-blue-900' 
                                : formData.gray_lot_id === lot.id.toString() 
                                ? 'bg-blue-50 border border-blue-100' 
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => {
                              setFormData({ ...formData, gray_lot_id: lot.id.toString() });
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                              setTimeout(() => quantityInputRef.current?.focus(), 50);
                            }}
                            onMouseEnter={() => setActiveOptionIndex(index)}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`font-semibold ${index === activeOptionIndex || formData.gray_lot_id === lot.id.toString() ? 'text-blue-700' : 'text-gray-800'}`}>
                                {lot.lotNo}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                                {lot.remaining} left
                              </span>
                            </div>
                            <div className={`text-xs mt-0.5 ${index === activeOptionIndex || formData.gray_lot_id === lot.id.toString() ? 'text-blue-600/85' : 'text-gray-500'}`}>
                              {lot.partyName}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Returned / Damaged Quantity</label>
                  <input
                    ref={quantityInputRef}
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.returned_quantity}
                    onChange={(e) => setFormData({ ...formData, returned_quantity: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        unitInputRef.current?.focus();
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    ref={unitInputRef}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as 'meter' | 'yard')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        dateInputRef.current?.focus();
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="meter">Meter</option>
                    <option value="yard">Yard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      reasonInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea
                  ref={reasonInputRef}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveButtonRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="e.g. Damaged during dyeing process"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  ref={saveButtonRef}
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Save Return
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Print Preview Modal */}
      {previewLot && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden print:shadow-none print:max-w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 print:hidden">
              <h2 className="text-xl font-bold text-gray-900">Return Lot Preview</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => setPreviewLot(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-8 print:p-4 print-area">
              <div className="text-center border-b-2 border-gray-200 pb-4 mb-6">
                <h1 className="text-3xl font-black tracking-wider uppercase text-gray-900">SHAN DYEING</h1>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Return Lot Challan</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                  <span>Print Date: {new Date().toLocaleString('en-PK', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
                <div>
                  <p className="font-bold text-gray-500">Party Name:</p>
                  <p className="font-bold text-lg">{previewLot.gray_lot?.party_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-500">Lot #:</p>
                  <p className="font-mono text-lg font-black">{previewLot.gray_lot?.lot_no}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-500">Return Date:</p>
                  <p className="font-medium">{new Date(previewLot.return_date).toLocaleDateString('en-PK')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-500">Process Type:</p>
                  <p className="font-medium">{previewLot.gray_lot?.process_type || 'N/A'}</p>
                </div>
              </div>

              <div className="border border-gray-300 rounded-xl overflow-hidden mb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-3 font-bold text-gray-800">Description</th>
                      <th className="p-3 font-bold text-gray-800 text-right">Returned Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-3 font-medium text-gray-800">Returned / Damaged Material</td>
                      <td className="p-3 font-bold text-right text-red-600">
                        {previewLot.gray_lot?.measurement?.toLowerCase() === 'meter' 
                          ? `${(Number(previewLot.returned_quantity) * 0.9144).toFixed(2)} Meters` 
                          : `${previewLot.returned_quantity} Yards`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {previewLot.reason && (
                <div className="mb-12 border p-4 rounded-xl border-gray-200 bg-gray-50">
                  <p className="font-bold text-gray-700 mb-1">Reason / Notes:</p>
                  <p className="text-gray-800 text-sm">{previewLot.reason}</p>
                </div>
              )}

              <div className="flex justify-between mt-16 pt-8">
                <div className="w-48 border-t-2 border-gray-800 text-center pt-2 font-bold text-gray-800">
                  Authorized Signature
                </div>
                <div className="w-48 border-t-2 border-gray-800 text-center pt-2 font-bold text-gray-800">
                  Receiver Signature
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Print CSS Override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
