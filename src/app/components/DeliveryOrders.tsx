import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
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

export default function DeliveryOrders() {
  const [lots, setLots] = useState<DeliveryLotOption[]>([]);
  const [selectedLot, setSelectedLot] = useState<DeliveryLotOption | null>(null);

  const [colors, setColors] = useState<ColorColumn[]>(
    Array.from({ length: 10 }, (_, index) => ({
      id: `${index + 1}`,
      name: '',
    }))
  );

  const [rows, setRows] = useState<GridRow[]>(
    Array.from({ length: 10 }, (_, index) => createRow(index))
  );

  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocusRef = useRef<{
    rowIndex: number;
    colorIndex: number;
    field: CellField;
  } | null>(null);

  const getCellKey = (rowIndex: number, colorIndex: number, field: CellField) => {
    return `${rowIndex}-${colorIndex}-${field}`;
  };

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
    const loadOriginalLots = async () => {
      try {
        const response = await grayLotService.getLotsWithBalance();
        setLots(response);
      } catch (error) {
        console.error('Failed to load gray lots with balances:', error);
      }
    };
    loadOriginalLots();
  }, []);

  const updateColorName = (colorId: string, newName: string) => {
    setColors((prev) =>
      prev.map((color) => (color.id === colorId ? { ...color, name: newName } : color))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow(prev.length)]);
  };

  const removeLastRow = () => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  const addRowAndFocus = (rowIndex: number, colorIndex: number, field: CellField) => {
    pendingFocusRef.current = { rowIndex, colorIndex, field };

    setRows((prev) => {
      if (rowIndex < prev.length) return prev;
      return [...prev, createRow(prev.length)];
    });
  };

  const updateCellValue = (
    rowId: string,
    colorId: string,
    field: CellField,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const currentColorValue = row.values[colorId] || { gray: 0, ready: 0 };

        return {
          ...row,
          values: {
            ...row.values,
            [colorId]: {
              ...currentColorValue,
              [field]: parseFloat(value) || 0,
            },
          },
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

      if (e.shiftKey) {
        moveLeft();
      } else {
        moveRight();
      }
    } else {
      return;
    }

    if (nextRowIndex >= rows.length) {
      addRowAndFocus(nextRowIndex, nextColorIndex, nextField);
      return;
    }

    focusCell(nextRowIndex, nextColorIndex, nextField);
  };

  const getCellValue = (row: GridRow, colorId: string, field: CellField) => {
    return row.values[colorId]?.[field] || '';
  };

  const calculateColorTotal = (colorId: string, field: CellField) => {
    return rows.reduce((sum, row) => sum + (row.values[colorId]?.[field] || 0), 0);
  };

  const calculateColorPercentage = (colorId: string) => {
    const gray = calculateColorTotal(colorId, 'gray');
    const ready = calculateColorTotal(colorId, 'ready');

    if (!gray) return 0;
    return Math.round((ready / gray) * 100);
  };

  const calculateTotalGray = () => {
    return colors.reduce((sum, color) => sum + calculateColorTotal(color.id, 'gray'), 0);
  };

  const calculateTotalReady = () => {
    return colors.reduce((sum, color) => sum + calculateColorTotal(color.id, 'ready'), 0);
  };

  const calculateShortage = () => {
    return calculateTotalGray() - calculateTotalReady();
  };

  const [saving, setSaving] = useState(false);

  const handleSaveDO = async () => {
    if (!selectedLot) return;
    
    const grayAmount = calculateTotalGray();
    if (grayAmount > selectedLot.remaining) {
      alert("Gray gazana exceeds lot remaining quantity.");
      return;
    }

    try {
      setSaving(true);
      await deliveryOrderService.createDeliveryOrder({
        gray_lot_id: selectedLot.id,
        total_gray_gazana: grayAmount,
        grid_data: { rows, colors }
      });
      
      alert("Delivery order saved successfully!");
      const response = await grayLotService.getLotsWithBalance();
      setLots(response);
      setSelectedLot(null);
      setRows(Array.from({ length: 10 }, (_, index) => createRow(index)));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save Delivery Order.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL - same old */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lot Selection</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Select Lot No</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const lot = lots.find((l) => String(l.id) === e.target.value);
                    setSelectedLot(lot || null);
                  }}
                  value={selectedLot?.id || ''}
                >
                  <option value="">Choose a lot...</option>
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotNo} ({lot.partyName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedLot && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Party Name</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedLot.partyName}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Process</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedLot.process}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Gray Qty</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedLot.totalGray}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Remaining Qty</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {selectedLot.remaining}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Gray</span>
                    <span className="text-lg font-semibold text-gray-800">
                      {calculateTotalGray()}
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Ready</span>
                    <span className="text-lg font-semibold text-green-600">
                      {calculateTotalReady()}
                    </span>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shortage</span>
                    <span className="text-lg font-semibold text-red-600">
                      {calculateShortage()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Delivery Order Information Excel style */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Delivery Order Information
              </h3>

              <div className="flex items-center gap-2">
                <button
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
                </button>
              </div>
            </div>

            {/* Color Name Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-10 gap-2 mb-3">
              {colors.map((color, index) => (
                <div key={color.id}>
                  <label className="block text-xs text-gray-600 mb-1">
                    Color {index + 1}
                  </label>

                  <input
                    type="text"
                    value={color.name}
                    placeholder={`Color ${index + 1}`}
                    onChange={(e) => updateColorName(color.id, e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Excel style grid */}
            <div className="overflow-x-auto border border-gray-300 rounded-xl">
              <table className="min-w-[1250px] w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      rowSpan={2}
                      className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-20"
                    >
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
                    {colors.map((color) => (
                      <React.Fragment key={color.id}>
                        <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-600 text-center">
                          GRAY
                        </th>
                        <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-600 text-center">
                          READY
                        </th>
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
                          <td
                            className={`border border-gray-300 p-0 ${
                              colorIndex % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'
                            }`}
                          >
                            <input
                              ref={(el) => {
                                cellRefs.current[getCellKey(rowIndex, colorIndex, 'gray')] = el;
                              }}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getCellValue(row, color.id, 'gray')}
                              onChange={(e) =>
                                updateCellValue(row.id, color.id, 'gray', e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleCellKeyDown(e, rowIndex, colorIndex, 'gray')
                              }
                              placeholder="0"
                              className="w-full h-8 px-2 text-center text-xs bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>

                          <td
                            className={`border border-gray-300 p-0 ${
                              colorIndex % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'
                            }`}
                          >
                            <input
                              ref={(el) => {
                                cellRefs.current[getCellKey(rowIndex, colorIndex, 'ready')] = el;
                              }}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getCellValue(row, color.id, 'ready')}
                              onChange={(e) =>
                                updateCellValue(row.id, color.id, 'ready', e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleCellKeyDown(e, rowIndex, colorIndex, 'ready')
                              }
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
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                      Total
                    </td>

                    {colors.map((color, index) => (
                      <React.Fragment key={color.id}>
                        <td
                          className={`border border-gray-300 px-2 py-2 text-center text-xs ${
                            index % 2 === 0 ? 'bg-yellow-100' : 'bg-green-100'
                          }`}
                        >
                          {calculateColorTotal(color.id, 'gray')}
                        </td>

                        <td
                          className={`border border-gray-300 px-2 py-2 text-center text-xs ${
                            index % 2 === 0 ? 'bg-yellow-100' : 'bg-green-100'
                          }`}
                        >
                          {calculateColorTotal(color.id, 'ready')}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>

                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                      %
                    </td>

                    {colors.map((color, index) => (
                      <React.Fragment key={color.id}>
                        <td
                          className={`border border-gray-300 px-2 py-2 text-center text-xs ${
                            index % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'
                          }`}
                        >
                          {calculateColorTotal(color.id, 'gray')}
                        </td>

                        <td
                          className={`border border-gray-300 px-2 py-2 text-center text-xs ${
                            index % 2 === 0 ? 'bg-yellow-50' : 'bg-green-50'
                          }`}
                        >
                          {calculateColorPercentage(color.id)}%
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button 
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedLot || calculateTotalGray() > (selectedLot.remaining || 0) || saving}
                onClick={handleSaveDO}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save DO'}
              </button>
              {selectedLot && calculateTotalGray() > selectedLot.remaining && (
                <span className="text-red-500 font-medium text-sm">
                  Total Gray cannot exceed remaining Gray Lot Gazana ({selectedLot.remaining})
                </span>
              )}

              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors ml-auto">
                Print DO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}