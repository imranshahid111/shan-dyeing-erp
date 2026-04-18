import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

interface ColorColumn {
  id: string;
  name: string;
}

interface GridRow {
  id: string;
  rowNumber: number;
  type: 'Gray' | 'Ready';
  values: Record<string, number>;
}

const mockLots = [
  { lotNo: 'GL-2045', partyName: 'ABC Textiles', process: 'Dyeing', totalGray: 250, remaining: 250 },
  { lotNo: 'GL-2046', partyName: 'XYZ Industries', process: 'Redyeing', totalGray: 180, remaining: 180 },
  { lotNo: 'GL-2047', partyName: 'Global Fabrics', process: 'Dyeing', totalGray: 320, remaining: 320 },
];

export default function DeliveryOrders() {
  const [selectedLot, setSelectedLot] = useState<typeof mockLots[0] | null>(null);
  const [colors, setColors] = useState<ColorColumn[]>([
    { id: '1', name: 'Red' },
    { id: '2', name: 'Blue' },
  ]);
  const [rows, setRows] = useState<GridRow[]>([
    { id: '1', rowNumber: 1, type: 'Gray', values: {} },
    { id: '2', rowNumber: 1, type: 'Ready', values: {} },
  ]);

  const addColor = () => {
    if (colors.length < 10) {
      const newColor = { id: Date.now().toString(), name: `Color ${colors.length + 1}` };
      setColors([...colors, newColor]);
    }
  };

  const removeColor = (colorId: string) => {
    setColors(colors.filter((c) => c.id !== colorId));
    setRows(rows.map((row) => {
      const newValues = { ...row.values };
      delete newValues[colorId];
      return { ...row, values: newValues };
    }));
  };

  const addRowPair = () => {
    const maxRowNumber = Math.max(...rows.map((r) => r.rowNumber), 0);
    setRows([
      ...rows,
      { id: Date.now().toString(), rowNumber: maxRowNumber + 1, type: 'Gray', values: {} },
      { id: (Date.now() + 1).toString(), rowNumber: maxRowNumber + 1, type: 'Ready', values: {} },
    ]);
  };

  const updateCellValue = (rowId: string, colorId: string, value: string) => {
    setRows(rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          values: { ...row.values, [colorId]: parseFloat(value) || 0 },
        };
      }
      return row;
    }));
  };

  const updateColorName = (colorId: string, newName: string) => {
    setColors(colors.map((c) => (c.id === colorId ? { ...c, name: newName } : c)));
  };

  const calculateRowTotal = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return 0;
    return Object.values(row.values).reduce((sum, val) => sum + (val || 0), 0);
  };

  const calculateColumnTotal = (colorId: string) => {
    return rows.reduce((sum, row) => sum + (row.values[colorId] || 0), 0);
  };

  const calculateTotalGray = () => {
    return rows
      .filter((r) => r.type === 'Gray')
      .reduce((sum, row) => sum + Object.values(row.values).reduce((s, v) => s + (v || 0), 0), 0);
  };

  const calculateTotalReady = () => {
    return rows
      .filter((r) => r.type === 'Ready')
      .reduce((sum, row) => sum + Object.values(row.values).reduce((s, v) => s + (v || 0), 0), 0);
  };

  const calculateShortage = () => {
    return calculateTotalGray() - calculateTotalReady();
  };

  const rowPairs = rows.reduce((acc, row) => {
    if (!acc[row.rowNumber]) {
      acc[row.rowNumber] = [];
    }
    acc[row.rowNumber].push(row);
    return acc;
  }, {} as Record<number, GridRow[]>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL - Lot Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lot Selection</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Select Lot No</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const lot = mockLots.find((l) => l.lotNo === e.target.value);
                    setSelectedLot(lot || null);
                  }}
                >
                  <option value="">Choose a lot...</option>
                  {mockLots.map((lot) => (
                    <option key={lot.lotNo} value={lot.lotNo}>
                      {lot.lotNo}
                    </option>
                  ))}
                </select>
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
                    <span className="text-sm text-gray-600">Total Gray</span>
                    <span className="text-lg font-semibold text-gray-800">{calculateTotalGray()}</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Ready</span>
                    <span className="text-lg font-semibold text-green-600">{calculateTotalReady()}</span>
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shortage</span>
                    <span className="text-lg font-semibold text-red-600">{calculateShortage()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Color Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Color Entry Grid</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={addColor}
                  disabled={colors.length >= 10}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-300"
                >
                  + Add Color
                </button>
                <button
                  onClick={addRowPair}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Row
                </button>
              </div>
            </div>

            {/* Excel-like Grid */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 w-20">Row #</th>
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 w-24">Type</th>
                    {colors.map((color) => (
                      <th key={color.id} className="border border-gray-200 px-3 py-2 w-32">
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) => updateColorName(color.id, e.target.value)}
                            className="text-xs font-medium text-center bg-transparent focus:outline-none focus:bg-white px-1 py-1 rounded"
                          />
                          <button
                            onClick={() => removeColor(color.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rowPairs).map(([rowNumber, pairRows]) => (
                    pairRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={row.type === 'Gray' ? 'bg-blue-50' : 'bg-green-50'}
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={2}
                            className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700"
                          >
                            {rowNumber}
                          </td>
                        )}
                        <td className="border border-gray-200 px-3 py-2 text-center text-sm font-medium">
                          {row.type}
                        </td>
                        {colors.map((color) => (
                          <td key={color.id} className="border border-gray-200 p-0">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.values[color.id] || ''}
                              onChange={(e) => updateCellValue(row.id, color.id, e.target.value)}
                              className="w-full px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="border border-gray-200 px-3 py-2 text-center font-semibold text-sm">
                          {calculateRowTotal(row.id)}
                        </td>
                      </tr>
                    ))
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={2} className="border border-gray-200 px-3 py-2 text-center text-sm">
                      Total
                    </td>
                    {colors.map((color) => (
                      <td key={color.id} className="border border-gray-200 px-3 py-2 text-center text-sm">
                        {calculateColumnTotal(color.id)}
                      </td>
                    ))}
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      {calculateTotalGray() + calculateTotalReady()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6">
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Save size={18} />
                Save DO
              </button>
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                Print DO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
