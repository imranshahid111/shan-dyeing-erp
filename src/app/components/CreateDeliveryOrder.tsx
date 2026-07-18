import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft, Search, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { deliveryOrderService } from '../services/deliveryOrderService';
import { grayLotService, DeliveryLotOption } from '../services/grayLotService';
import { toast } from 'sonner';

interface ColorColumn {
  id: string;
  name: string;
}

interface GridRow {
  id: string;
  rowNumber: number;
  values: Record<string, { gray: number; ready: number }>;
}

type CellField = 'gray' | 'ready';

const createRow = (rowNumber: number): GridRow => ({
  id: `${Date.now()}-${rowNumber}-${Math.random()}`,
  rowNumber, // This will now be 1, 2, 3, etc.
  values: {},
});

export default function CreateDeliveryOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [lots, setLots] = useState<DeliveryLotOption[]>([]);
  const [selectedLot, setSelectedLot] = useState<DeliveryLotOption | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [inputUnit, setInputUnit] = useState<'meter' | 'gaz'>('meter');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLots = lots.filter(lot => 
    lot.lotNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lot.partyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [colors, setColors] = useState<ColorColumn[]>(
    Array.from({ length: 10 }, (_, index) => ({
      id: `${index + 1}`,
      name: '',
    }))
  );

 const [rows, setRows] = useState<GridRow[]>(
  Array.from({ length: 10 }, (_, index) => createRow(index + 1)) // Change index to index + 1
);
  const [headerInputs, setHeaderInputs] = useState<Record<string, { gray: string; ready: string }>>({});


  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocusRef = useRef<{
    rowIndex: number;
    colorIndex: number;
    field: CellField;
  } | null>(null);

  const getCellKey = (rowIndex: number, colorIndex: number, field: CellField) =>
    `${rowIndex}-${colorIndex}-${field}`;

  const focusCell = (rowIndex: number, colorIndex: number, field: CellField) => {
    requestAnimationFrame(() => {
      const key = getCellKey(rowIndex, colorIndex, field);
      const input = cellRefs.current[key];
      if (input) {
        input.focus();
        input.select();
      }
    });
  };

  useEffect(() => {
    if (pendingFocusRef.current) {
      const { rowIndex, colorIndex, field } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      focusCell(rowIndex, colorIndex, field);
    }
  }, [rows.length]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await grayLotService.getLotsWithBalance();
        
        if (id) {
          const doData = await deliveryOrderService.getDeliveryOrderById(id);
          
          const lot = response.find(l => l.id === doData.gray_lot_id);
          if (lot) {
            // Add back the current DO's amount to the remaining balance so we can edit it freely
            const isLotMeter = lot.measurement?.toLowerCase() === 'meter';
            const addedQty = isLotMeter ? Number(doData.total_gray_gazana) * 0.9144 : Number(doData.total_gray_gazana);
            lot.remaining += addedQty;
            setSelectedLot(lot);
          }
          
          if ((doData as any).remarks) setRemarks((doData as any).remarks);
          
          if (doData.grid_data) {
            if (doData.grid_data.colors && doData.grid_data.colors.length > 0) {
              const c = [...doData.grid_data.colors];
              while (c.length < 10) c.push({ id: `${Date.now()}-${Math.random()}`, name: '' });
              setColors(c);
            }
            if (doData.grid_data.rows && doData.grid_data.rows.length > 0) {
              const r = [...doData.grid_data.rows];
              while (r.length < 10) r.push(createRow(r.length));
              setRows(r);
              // Restore the original input unit from saved grid_data
              setInputUnit(doData.grid_data.inputUnit || 'meter');
            }
          }
        }
        
        setLots(response);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [id]);

  const updateColorName = (colorId: string, newName: string) => {
    setColors(prev => prev.map(c => (c.id === colorId ? { ...c, name: newName } : c)));
  };

const addRow = () => setRows(prev => [...prev, createRow(prev.length + 1)]); 


  const removeLastRow = () =>
    setRows(prev => (prev.length <= 1 ? prev : prev.slice(0, -1)));

 const addRowAndFocus = (rowIndex: number, colorIndex: number, field: CellField) => {
  pendingFocusRef.current = { rowIndex, colorIndex, field };
  setRows(prev => {
    if (rowIndex < prev.length) return prev;
    return [...prev, createRow(prev.length + 1)]; // +1 for next serial number
  });
};

  const updateCellValue = (rowId: string, colorId: string, field: CellField, value: string) => {
    const val = Math.max(0, parseFloat(value) || 0);
    setRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        const cur = row.values[colorId] || { gray: 0, ready: 0 };
        return {
          ...row,
          values: { ...row.values, [colorId]: { ...cur, [field]: val } },
        };
      })
    );
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colorIndex: number,
    field: CellField
  ) => {
    let nextRowIndex = rowIndex;
    let nextColorIndex = colorIndex;
    let nextField: CellField = field;

    const moveRight = () => {
      if (field === 'gray') {
        nextField = 'ready';
      } else if (colorIndex < colors.length - 1) {
        nextColorIndex = colorIndex + 1;
        nextField = 'gray';
      } else {
        nextRowIndex = rowIndex + 1;
        nextColorIndex = 0;
        nextField = 'gray';
      }
    };

    const moveLeft = () => {
      if (field === 'ready') {
        nextField = 'gray';
      } else if (colorIndex > 0) {
        nextColorIndex = colorIndex - 1;
        nextField = 'ready';
      } else if (rowIndex > 0) {
        nextRowIndex = rowIndex - 1;
        nextColorIndex = colors.length - 1;
        nextField = 'ready';
      }
    };

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      nextRowIndex = rowIndex + 1;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextRowIndex = Math.max(rowIndex - 1, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveRight();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveLeft();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) moveLeft();
      else moveRight();
    } else {
      return;
    }

    if (nextRowIndex >= rows.length) {
      addRowAndFocus(nextRowIndex, nextColorIndex, nextField);
      return;
    }
    focusCell(nextRowIndex, nextColorIndex, nextField);
  };

  const handleHeaderKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    colorId: string,
    field: CellField
  ) => {
    if (e.key === 'Enter') {
      const val = parseFloat(headerInputs[colorId]?.[field] || '') || 0;
      if (val === 0) return;

      setRows(prev => {
        const newRows = [...prev];
        // Find first row where this specific cell is 0
        let targetRowIndex = newRows.findIndex(r => !r.values[colorId]?.[field]);
        
        if (targetRowIndex === -1) {
          // No empty row, add new one
          const newRow = createRow(newRows.length);
          newRow.values[colorId] = { 
            ...(newRow.values[colorId] || { gray: 0, ready: 0 }), 
            [field]: val 
          };
          return [...newRows, newRow];
        } else {
          // Update existing row
          newRows[targetRowIndex] = {
            ...newRows[targetRowIndex],
            values: {
              ...newRows[targetRowIndex].values,
              [colorId]: {
                ...(newRows[targetRowIndex].values[colorId] || { gray: 0, ready: 0 }),
                [field]: val
              }
            }
          };
          return newRows;
        }
      });

      // Clear the header input
      setHeaderInputs(prev => ({
        ...prev,
        [colorId]: {
          ...(prev[colorId] || { gray: '', ready: '' }),
          [field]: ''
        }
      }));
    }
  };

  const updateHeaderInput = (colorId: string, field: CellField, value: string) => {
    const val = value === '' ? '' : String(Math.max(0, parseFloat(value) || 0));
    setHeaderInputs(prev => ({
      ...prev,
      [colorId]: {
        ...(prev[colorId] || { gray: '', ready: '' }),
        [field]: val
      }
    }));
  };

  const getCellValue = (row: GridRow, colorId: string, field: CellField) => {
    const val = row.values[colorId]?.[field];
    return (val === 0 || val) ? val : '';
  };

  const calculateColorTotal = (colorId: string, field: CellField) =>
    rows.reduce((sum, row) => sum + (row.values[colorId]?.[field] || 0), 0);

  const isLotMeter = selectedLot?.measurement?.toLowerCase() === 'meter';

  const getReadyInLotUnit = (readyQty: number) => {
    if (isLotMeter && inputUnit === 'gaz') return readyQty * 0.9144;
    if (!isLotMeter && inputUnit === 'meter') return readyQty / 0.9144;
    return readyQty;
  };

  const calculateColorPercentage = (colorId: string) => {
    const gray = calculateColorTotal(colorId, 'gray');
    const ready = calculateColorTotal(colorId, 'ready');
    if (!gray) return '0.00';
    
    const readyInLotUnit = getReadyInLotUnit(ready);
    return (((gray - readyInLotUnit) / gray) * 100).toFixed(2);
  };

  const calculateTotalGray = () =>
    colors.reduce((sum, color) => sum + calculateColorTotal(color.id, 'gray'), 0);

  const calculateTotalReady = () =>
    colors.reduce((sum, color) => sum + calculateColorTotal(color.id, 'ready'), 0);

  const calculateShortage = () => {
    const gray = calculateTotalGray();
    const ready = calculateTotalReady();
    return gray - getReadyInLotUnit(ready);
  };

  // Base unit in database is Gaz.
  // 1 Gaz (Yard) = 0.9144 Meters. So to convert meters to gaz, we divide by 0.9144.
  const CONVERSION_FACTOR = 0.9144;

  const [saving, setSaving] = useState(false);

  const handleSaveDO = async () => {
    if (!selectedLot) return;

    const grayAmount = calculateTotalGray();
    const readyAmount = calculateTotalReady();

    if (grayAmount > selectedLot.remaining) {
      toast.error(`Gray quantity (${grayAmount.toFixed(2)} ${isLotMeter ? 'meters' : 'yards'}) exceeds lot remaining quantity (${selectedLot.remaining.toFixed(2)} ${isLotMeter ? 'meters' : 'yards'}).`);
      return;
    }

    const readyInLotUnit = getReadyInLotUnit(readyAmount);
    if (readyInLotUnit > grayAmount) {
      toast.error('Total Ready quantity cannot be greater than Total Gray quantity.');
      return;
    }

    try {
      setSaving(true);
      
      const totalGrayGazana = isLotMeter ? parseFloat((grayAmount / CONVERSION_FACTOR).toFixed(4)) : grayAmount;
      const totalReadyGazana = inputUnit === 'gaz' ? readyAmount : parseFloat((readyAmount / CONVERSION_FACTOR).toFixed(4));

      const payload = {
        gray_lot_id: selectedLot.id,
        remarks: remarks,
        // Totals always sent in gaz to backend for lot balance tracking
        total_gray_gazana: totalGrayGazana,
        total_ready_gazana: totalReadyGazana,
        input_unit: inputUnit,
        grid_data: { 
          inputUnit: inputUnit,
          // Grid values stored as-is in the original entered unit (gaz or meter)
          rows: rows.filter(r => Object.keys(r.values).length > 0).map(r => ({
            ...r,
            values: Object.fromEntries(
              Object.entries(r.values).map(([colId, val]) => [
                colId,
                {
                  gray: val.gray,
                  ready: val.ready
                }
              ])
            )
          })), 
          colors: colors.filter(c => c.name.trim() !== '' || rows.some(r => r.values[c.id])) 
        },
      };
      
      console.log('Saving DO Payload:', payload);
      if (id) {
        await deliveryOrderService.updateDeliveryOrder(id, payload);
        toast.success('Delivery order updated successfully!');
      } else {
        await deliveryOrderService.createDeliveryOrder(payload);
        toast.success('Delivery order saved successfully!');
      }
      navigate('/delivery-orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save Delivery Order.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/delivery-orders')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to DOs
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{id ? 'Edit Delivery Order' : 'Create Delivery Order'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the grid below to {id ? 'update the' : 'create a new'} DO</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lot Selection</h3>

            <div className="space-y-4">
              <div ref={dropdownRef} className="relative z-50">
                <label className="block text-sm text-gray-600 mb-2">Select Lot No</label>
                <div 
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} bg-white cursor-pointer flex justify-between items-center transition-all`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={selectedLot ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                    {selectedLot ? `${selectedLot.lotNo} (${selectedLot.partyName})` : 'Choose a lot...'}
                  </span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-72 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
                        <input
                          type="text"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                          placeholder="Search lot no or party name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="p-1.5 overflow-y-auto">
                      {filteredLots.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                          <Search size={20} className="text-gray-300" />
                          <p>No lots found matching "{searchQuery}"</p>
                        </div>
                      ) : (
                        filteredLots.map(lot => (
                          <div
                            key={lot.id}
                            className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all ${selectedLot?.id === lot.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}
                            onClick={() => {
                              setSelectedLot(lot);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`font-semibold ${selectedLot?.id === lot.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                {lot.lotNo}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                                {lot.remaining} left
                              </span>
                            </div>
                            <div className={`text-xs mt-0.5 ${selectedLot?.id === lot.id ? 'text-blue-600/80' : 'text-gray-500'}`}>
                              {lot.partyName}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Input Unit</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInputUnit('meter')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputUnit === 'meter' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    METERS
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputUnit('gaz')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputUnit === 'gaz' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    GAZ (YARDS)
                  </button>
                </div>
                {inputUnit === 'meter' && (
                  <p className="text-[10px] text-blue-500 mt-1 font-bold italic">Note: Meter entries will be auto-converted to Gaz (/0.9144) on save.</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>

              {selectedLot && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Party Name</span>
                    <span className="text-sm font-medium text-gray-800">{selectedLot.partyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Process</span>
                    <span className="text-sm font-medium text-gray-800">{selectedLot.process}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Gray Qty</span>
                    <span className="text-sm font-medium text-gray-800">
                      {Number(selectedLot.totalGray || 0).toFixed(2)} {selectedLot.measurement?.toLowerCase() === 'meter' ? 'Meters' : 'Yards'}
                    </span>
                  </div>
                  {(selectedLot.returned || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600 font-medium">Returned / Damaged</span>
                      <span className="text-sm font-bold text-red-600">
                        {Number(selectedLot.returned || 0).toFixed(2)} {selectedLot.measurement?.toLowerCase() === 'meter' ? 'Meters' : 'Yards'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-100 pt-2 mt-2">
                    <span className="text-sm text-gray-600">Available Ready Qty</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {Number(selectedLot.remaining || 0).toFixed(2)} {selectedLot.measurement?.toLowerCase() === 'meter' ? 'Meters' : 'Yards'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Gray</span>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-800 leading-none">
                        {calculateTotalGray().toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-[10px] uppercase">{isLotMeter ? 'METERS' : 'GAZ'}</span>
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                        ≈ {isLotMeter ? (calculateTotalGray() / CONVERSION_FACTOR).toFixed(2) : (calculateTotalGray() * CONVERSION_FACTOR).toFixed(2)} {isLotMeter ? 'GAZ' : 'METERS'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-600 font-bold uppercase tracking-wider">Total Ready</span>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-700 leading-none">
                        {calculateTotalReady().toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-[10px] uppercase">{inputUnit}</span>
                      </p>
                      <p className="text-[10px] font-bold text-green-400 mt-1 uppercase tracking-tighter">
                        ≈ {inputUnit === 'gaz' ? (calculateTotalReady() * CONVERSION_FACTOR).toFixed(2) : (calculateTotalReady() / CONVERSION_FACTOR).toFixed(2)} {inputUnit === 'gaz' ? 'METERS' : 'GAZ'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Shortage</span>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-700 leading-none">
                        {calculateShortage().toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-[10px] uppercase">{isLotMeter ? 'METERS' : 'GAZ'}</span>
                      </p>
                      <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-tighter">
                        ≈ {isLotMeter ? (calculateShortage() / CONVERSION_FACTOR).toFixed(2) : (calculateShortage() * CONVERSION_FACTOR).toFixed(2)} {isLotMeter ? 'GAZ' : 'METERS'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button in sidebar on small screens */}
              <div className="pt-2">
                <button
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={!selectedLot || calculateTotalGray() > (selectedLot?.remaining || 0) || getReadyInLotUnit(calculateTotalReady()) > calculateTotalGray() || saving}
                  onClick={handleSaveDO}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : id ? 'Update DO' : 'Save DO'}
                </button>
                {selectedLot && calculateTotalGray() > selectedLot.remaining && (
                  <p className="text-red-500 text-xs mt-2 text-center">
                    Gray miqdar remaining ({selectedLot.remaining}) se zyada hai
                  </p>
                )}
                {getReadyInLotUnit(calculateTotalReady()) > calculateTotalGray() && (
                  <p className="text-red-500 text-xs mt-2 text-center">
                    Ready miqdar Gray se zyada nahi ho sakti
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Delivery Order Grid</h3>
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={addRow}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Add Row
                </button>
                <button
                  onClick={removeLastRow}
                  className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Remove Row
                </button> */}
              </div>
            </div>

            {/* Color Name Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-2 mb-3">
              {colors.map((color, index) => (
                <div key={color.id}>
                  <label className="block text-xs text-gray-600 mb-1">Color {index + 1}</label>
                  <input
                    type="text"
                    value={color.name}
                    placeholder={`C${index + 1}`}
                    onChange={e => updateColorName(color.id, e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Excel Grid */}
            <div className="overflow-x-auto border border-gray-300 rounded-xl">
              <table className="min-w-[1250px] w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-20">
                      Row No
                    </th>
                    {colors.map((color, index) => (
                      <th
                        key={color.id}
                        colSpan={2}
                        className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 text-center"
                      >
                        {color.name || `Color ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    {colors.map(color => (
                      <React.Fragment key={color.id}>
                        <th className="border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 text-center">
                          GRAY
                          <span className="block text-[9px] text-gray-400 font-medium uppercase mt-0.5 tracking-wider">
                            {selectedLot ? (selectedLot.measurement?.toLowerCase() === 'meter' ? '(Meters)' : '(Yards)') : ''}
                          </span>
                        </th>
                        <th className="border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 text-center">
                          READY
                          <span className="block text-[9px] text-gray-400 font-medium uppercase mt-0.5 tracking-wider">
                            ({inputUnit === 'meter' ? 'Meters' : 'Yards'})
                          </span>
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>

                  {/* QUICK ENTRY ROW */}
                  <tr className="bg-blue-50/50">
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs font-bold text-blue-600 bg-blue-100/50">
                      ENTRY
                    </td>
                    {colors.map((color) => (
                      <React.Fragment key={color.id}>
                        <td className="border border-gray-300 p-0">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={headerInputs[color.id]?.gray || ''}
                            onChange={(e) => updateHeaderInput(color.id, 'gray', e.target.value)}
                            onKeyDown={(e) => handleHeaderKeyDown(e, color.id, 'gray')}
                            onKeyPress={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                            placeholder="Add..."
                            className="w-full h-8 px-2 text-center text-xs font-bold text-blue-700 bg-white/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-0">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={headerInputs[color.id]?.ready || ''}
                            onChange={(e) => updateHeaderInput(color.id, 'ready', e.target.value)}
                            onKeyDown={(e) => handleHeaderKeyDown(e, color.id, 'ready')}
                            onKeyPress={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                            placeholder="Add..."
                            className="w-full h-8 px-2 text-center text-xs font-bold text-blue-700 bg-white/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={row.id}>
                      <td className="border border-gray-300 px-2 py-1 text-center text-sm font-medium bg-gray-50">
                        {row.rowNumber}
                      </td>
                      {colors.map((color, colorIndex) => (
                        <React.Fragment key={color.id}>
                          <td className={`border border-gray-300 p-0 ${colorIndex % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                            <input
                              ref={el => { cellRefs.current[getCellKey(rowIndex, colorIndex, 'gray')] = el; }}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getCellValue(row, color.id, 'gray')}
                              onChange={e => updateCellValue(row.id, color.id, 'gray', e.target.value)}
                              onKeyDown={e => handleCellKeyDown(e, rowIndex, colorIndex, 'gray')}
                              onKeyPress={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className="w-full h-8 px-2 text-center text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className={`border border-gray-300 p-0 ${colorIndex % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                            <input
                              ref={el => { cellRefs.current[getCellKey(rowIndex, colorIndex, 'ready')] = el; }}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getCellValue(row, color.id, 'ready')}
                              onChange={e => updateCellValue(row.id, color.id, 'ready', e.target.value)}
                              onKeyDown={e => handleCellKeyDown(e, rowIndex, colorIndex, 'ready')}
                              onKeyPress={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className="w-full h-8 px-2 text-center text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">Total</td>
                    {colors.map((color, index) => (
                      <React.Fragment key={color.id}>
                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs ${index % 2 === 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                          {calculateColorTotal(color.id, 'gray')}
                        </td>
                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs ${index % 2 === 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                          {calculateColorTotal(color.id, 'ready')}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                  <tr className="bg-gray-50 font-semibold text-gray-700">
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">% Shortage</td>
                    {colors.map((color, index) => (
                      <React.Fragment key={color.id}>
                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs ${index % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                          {calculateColorTotal(color.id, 'gray')}
                        </td>
                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs text-red-600 font-bold ${index % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                          {calculateColorTotal(color.id, 'gray') ? `${calculateColorPercentage(color.id)}%` : '—'}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
