import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { deliveryOrderService } from '../services/deliveryOrderService';
import { grayLotService, DeliveryLotOption } from '../services/grayLotService';

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
  rowNumber,
  values: {},
});

export default function CreateDeliveryOrder() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<DeliveryLotOption[]>([]);
  const [selectedLot, setSelectedLot] = useState<DeliveryLotOption | null>(null);
  const [inputUnit, setInputUnit] = useState<'meter' | 'gaz'>('meter');

  const [colors, setColors] = useState<ColorColumn[]>(
    Array.from({ length: 10 }, (_, index) => ({
      id: `${index + 1}`,
      name: '',
    }))
  );

  const [rows, setRows] = useState<GridRow[]>(
    Array.from({ length: 10 }, (_, index) => createRow(index))
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
    const loadLots = async () => {
      try {
        const response = await grayLotService.getLotsWithBalance();
        setLots(response);
      } catch (error) {
        console.error('Failed to load gray lots:', error);
      }
    };
    loadLots();
  }, []);

  const updateColorName = (colorId: string, newName: string) => {
    setColors(prev => prev.map(c => (c.id === colorId ? { ...c, name: newName } : c)));
  };

  const addRow = () => setRows(prev => [...prev, createRow(prev.length)]);

  const removeLastRow = () =>
    setRows(prev => (prev.length <= 1 ? prev : prev.slice(0, -1)));

  const addRowAndFocus = (rowIndex: number, colorIndex: number, field: CellField) => {
    pendingFocusRef.current = { rowIndex, colorIndex, field };
    setRows(prev => {
      if (rowIndex < prev.length) return prev;
      return [...prev, createRow(prev.length)];
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

  const calculateColorPercentage = (colorId: string) => {
    const gray = calculateColorTotal(colorId, 'gray');
    const ready = calculateColorTotal(colorId, 'ready');
    if (!gray) return 0;
    return Math.round((ready / gray) * 100);
  };

  const calculateTotalGray = () =>
    colors.reduce((sum, color) => sum + calculateColorTotal(color.id, 'gray'), 0);

  const calculateTotalReady = () =>
    colors.reduce((sum, color) => sum + calculateColorTotal(color.id, 'ready'), 0);

  const calculateShortage = () => calculateTotalGray() - calculateTotalReady();

  // Conversion factor: 1 Gaz (Yard) = 0.9144 Meters
  const CONVERSION_FACTOR = 0.9144;

  const convertToMeter = (val: number) => {
    if (inputUnit === 'meter') return val;
    return parseFloat((val * CONVERSION_FACTOR).toFixed(2));
  };

  const [saving, setSaving] = useState(false);

  const handleSaveDO = async () => {
    if (!selectedLot) return;

    const grayAmount = calculateTotalGray();
    if (grayAmount > selectedLot.remaining) {
      alert('Gray gazana exceeds lot remaining quantity.');
      return;
    }

    try {
      setSaving(true);
      const readyAmount = calculateTotalReady();
      const payload = {
        gray_lot_id: selectedLot.id,
        total_gray_gazana: convertToMeter(grayAmount),
        total_ready_gazana: convertToMeter(readyAmount),
        grid_data: { 
          rows: rows.filter(r => Object.keys(r.values).length > 0).map(r => ({
            ...r,
            values: Object.fromEntries(
              Object.entries(r.values).map(([colId, val]) => [
                colId,
                {
                  gray: convertToMeter(val.gray),
                  ready: convertToMeter(val.ready)
                }
              ])
            )
          })), 
          colors: colors.filter(c => c.name.trim() !== '' || rows.some(r => r.values[c.id])) 
        },
      };
      
      console.log('Saving DO Payload:', payload);
      await deliveryOrderService.createDeliveryOrder(payload);

      alert('Delivery order saved successfully!');
      navigate('/delivery-orders');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save Delivery Order.');
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
          <h2 className="text-2xl font-bold text-gray-800">Create Delivery Order</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the grid below to create a new DO</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lot Selection</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Select Lot No</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => {
                    const lot = lots.find(l => String(l.id) === e.target.value);
                    setSelectedLot(lot || null);
                  }}
                  value={selectedLot?.id || ''}
                >
                  <option value="">Choose a lot...</option>
                  {lots.map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotNo} ({lot.partyName})
                    </option>
                  ))}
                </select>
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
                {inputUnit === 'gaz' && (
                  <p className="text-[10px] text-blue-500 mt-1 font-bold italic">Note: Gaz entries will be auto-converted to Meters (x0.9144) on save.</p>
                )}
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
                    <span className="text-sm font-medium text-gray-800">{selectedLot.totalGray}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Remaining Qty</span>
                    <span className="text-sm font-semibold text-blue-600">{selectedLot.remaining}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Gray</span>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-800 leading-none">
                        {calculateTotalGray().toLocaleString()} <span className="text-[10px] uppercase">{inputUnit}</span>
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                        ≈ {inputUnit === 'gaz' ? (calculateTotalGray() * CONVERSION_FACTOR).toFixed(2) : (calculateTotalGray() / CONVERSION_FACTOR).toFixed(2)} {inputUnit === 'gaz' ? 'METERS' : 'GAZ'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-600 font-bold uppercase tracking-wider">Total Ready</span>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-700 leading-none">
                        {calculateTotalReady().toLocaleString()} <span className="text-[10px] uppercase">{inputUnit}</span>
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
                        {calculateShortage().toLocaleString()} <span className="text-[10px] uppercase">{inputUnit}</span>
                      </p>
                      <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-tighter">
                        ≈ {inputUnit === 'gaz' ? (calculateShortage() * CONVERSION_FACTOR).toFixed(2) : (calculateShortage() / CONVERSION_FACTOR).toFixed(2)} {inputUnit === 'gaz' ? 'METERS' : 'GAZ'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button in sidebar on small screens */}
              <div className="pt-2">
                <button
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={!selectedLot || calculateTotalGray() > (selectedLot?.remaining || 0) || saving}
                  onClick={handleSaveDO}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save DO'}
                </button>
                {selectedLot && calculateTotalGray() > selectedLot.remaining && (
                  <p className="text-red-500 text-xs mt-2 text-center">
                    Gray miqdar remaining ({selectedLot.remaining}) se zyada hai
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
                        <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-600 text-center">GRAY</th>
                        <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-600 text-center">READY</th>
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
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">%</td>
                    {colors.map((color, index) => (
                      <React.Fragment key={color.id}>
                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs ${index % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                          {calculateColorTotal(color.id, 'gray')}
                        </td>
                        <td className={`border border-gray-300 px-2 py-2 text-center text-xs ${index % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                          {calculateColorPercentage(color.id)}%
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
