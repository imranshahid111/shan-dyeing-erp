import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Printer, Eye, EyeOff } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import React from 'react';

export default function ViewDeliveryOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<(DeliveryOrderItem & { grid_data: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrayInPrint, setShowGrayInPrint] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        let data = await deliveryOrderService.getDeliveryOrderById(id);
        if (typeof data.grid_data === 'string') {
          try {
            data.grid_data = JSON.parse(data.grid_data);
          } catch (e) {
            console.error("Failed to parse grid_data", e);
            data.grid_data = { rows: [], colors: [] };
          }
        }
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch DO", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="p-20 text-center">Loading DO details...</div>;
  if (!order) return <div className="p-20 text-center">Delivery Order not found.</div>;

  // --- Data Extraction & Calculations ---
  const colors = order.grid_data?.colors || [];
  const rows = order.grid_data?.rows || [];
  
  const getCellValue = (rowIndex: number, colorId: string, field: 'gray' | 'ready') => {
    const row = rows[rowIndex];
    if (!row?.values) return null;
    return row.values[colorId]?.[field] ?? null;
  };

  // Calculate totals from grid
  let gridGrayTotal = 0;
  let gridReadyTotal = 0;
  for (let r = 0; r < rows.length; r++) {
    for (let c of colors) {
      const grayVal = Number(getCellValue(r, c.id, 'gray')) || 0;
      const readyVal = Number(getCellValue(r, c.id, 'ready')) || 0;
      gridGrayTotal += grayVal;
      gridReadyTotal += readyVal;
    }
  }

  // Determine primary unit (Mtr or Gaz) based on order input_unit or grid vs DB comparison
  let inputUnit = order.input_unit || order.grid_data?.inputUnit;
  if (!inputUnit && gridGrayTotal > 0) {
    const dbGray = Number(order.total_gray_gazana);
    if (dbGray > 0 && Math.abs(gridGrayTotal - dbGray) > 1) {
      inputUnit = 'gaz';  // grid shows Gaz, db also has Gaz-like values
    } else {
      inputUnit = 'meter';
    }
  }
  if (!inputUnit) inputUnit = 'meter';
  const isGaz = inputUnit === 'gaz';
  const primaryUnit = isGaz ? 'Gaz' : 'Mtr';
  const primaryUnitFull = isGaz ? 'Gaz (Yard)' : 'Meter';
  const secondaryUnit = isGaz ? 'Meters' : 'Gaz (Yards)';

  // Quantities for display
  let primaryGrayQty = gridGrayTotal > 0 ? gridGrayTotal : (isGaz ? (Number(order.total_gray_gazana) / 0.9144) : Number(order.total_gray_gazana));
  let primaryReadyQty = gridReadyTotal > 0 ? gridReadyTotal : (isGaz ? (Number(order.total_ready_gazana) / 0.9144) : Number(order.total_ready_gazana));
  
  // If grid has values but we need to show numbers properly
  if (gridGrayTotal === 0) {
    if (isGaz) {
      primaryGrayQty = Number(order.total_gray_gazana);
      primaryReadyQty = Number(order.total_ready_gazana);
    } else {
      primaryGrayQty = Number(order.total_gray_gazana);
      primaryReadyQty = Number(order.total_ready_gazana);
    }
  }
  
  const secondaryGrayQty = isGaz ? (Number(order.total_gray_gazana) / 0.9144).toFixed(2) : (Number(order.total_gray_gazana) * 1.09361).toFixed(2);
  const secondaryReadyQty = isGaz ? (Number(order.total_ready_gazana) / 0.9144).toFixed(2) : (Number(order.total_ready_gazana) * 1.09361).toFixed(2);
  
  const shortagePercent = ((primaryGrayQty - primaryReadyQty) / primaryGrayQty * 100).toFixed(2);
  const shortageMeters = (primaryGrayQty - primaryReadyQty).toFixed(2);

  // Get lot info from gray_lot or fallback
  const lotNo = order.gray_lot?.lot_no || order.lot_no || '—';
  const quality = order.gray_lot?.quality || order.quality || 'Twill';
  const finishType = order.finish || order.finish_type || 'Finish';

  const handlePrint = () => {
    window.print();
  };

  // Helper function to decide if Gray value should be shown or blank
  const shouldShowGrayValue = () => {
    return showGrayInPrint; // If true, show actual value, if false, show blank
  };

  // Calculate color-wise totals for display
  const getColorGrayTotal = (colorId: string) => {
    let total = 0;
    for (let r = 0; r < rows.length; r++) {
      total += Number(getCellValue(r, colorId, 'gray')) || 0;
    }
    return total;
  };

  const getColorReadyTotal = (colorId: string) => {
    let total = 0;
    for (let r = 0; r < rows.length; r++) {
      total += Number(getCellValue(r, colorId, 'ready')) || 0;
    }
    return total;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/delivery-orders')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Delivery Order Details</h2>
            <p className="text-sm text-gray-500">DO #{order.order_no}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Checkbox for Gray Column */}
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={showGrayInPrint}
              onChange={(e) => setShowGrayInPrint(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {showGrayInPrint ? <Eye size={16} className="inline mr-1" /> : <EyeOff size={16} className="inline mr-1" />}
              {showGrayInPrint ? "Show" : "Hide"} Gray Details (Show Total Only)
            </span>
          </label>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-bold"
          >
            <Printer size={20} />
            Print DO / Challan
          </button>
        </div>
      </div>

      {/* Main DO Content - Exact match to physical Challan style */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
        {/* Print wrapper */}
        <div className="print-area p-4 sm:p-6 md:p-8">
          
          {/* Header: SHAN DYEING + Title */}
          <div className="text-center border-b-2 border-gray-200 pb-4 mb-4">
            <h1 className="text-3xl font-black tracking-wider uppercase text-gray-900">SHAN DYEING</h1>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Delivery Challan</p>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
              <span>Print Date: {new Date().toLocaleString('en-PK', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>D.C #: {order.order_no}</span>
            </div>
          </div>

          {/* Customer & Lot Info Row */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="font-bold">Customer:</p>
              <p className="font-mono text-lg font-black">{order.customer?.name} / {order.customer?.customer_code}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Lot #:</p>
              <p className="font-mono text-lg font-black">{lotNo}</p>
            </div>
            <div>
              <p className="font-bold">Date:</p>
              <p>{new Date(order.order_date).toLocaleDateString('en-PK')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Quality / Finish:</p>
              <p>{quality} / {finishType}</p>
            </div>
          </div>

          {/* Main Grid Table - Exactly like the physical challan */}
          <div className="overflow-x-auto border border-gray-300 mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Color Header Row - Always show Gray & Finish headers (columns visible) */}
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="border border-gray-300 p-1 align-middle">Sr. No</th>
                  {colors.map(color => (
                    <th key={color.id} colSpan={2} className="border border-gray-300 p-1 text-center">
                      {color.name}
                    </th>
                  ))}
                </tr>
                {/* Gray/Finish Header Row - Always show both headers */}
                <tr className="bg-gray-50">
                  {colors.map(color => (
                    <React.Fragment key={color.id}>
                      <th className="border border-gray-300 p-1 text-center w-16">Gray</th>
                      <th className="border border-gray-300 p-1 text-center w-16">Finish</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Data Rows - Show all rows that have any data */}
                {Array.from({ length: Math.max(rows.length, 10) }).map((_, rowIndex) => {
                  const rowHasData = colors.some(c => {
                    const g = getCellValue(rowIndex, c.id, 'gray');
                    const r = getCellValue(rowIndex, c.id, 'ready');
                    return (g !== null && g !== undefined && g !== '') || (r !== null && r !== undefined && r !== '');
                  });
                  if (!rowHasData && rowIndex > 12) return null;
                  
                  return (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-1 text-center font-bold">{rowIndex + 1}</td>
                      {colors.map(color => {
                        const grayVal = getCellValue(rowIndex, color.id, 'gray');
                        const readyVal = getCellValue(rowIndex, color.id, 'ready');
                        return (
                          <React.Fragment key={color.id}>
                            {/* Gray column - Show blank/dash when checkbox is unchecked, otherwise show actual value */}
                            <td className="border border-gray-300 p-1 text-center">
                              {shouldShowGrayValue() && grayVal !== null && grayVal !== undefined && grayVal !== '' ? grayVal : '—'}
                            </td>
                            {/* Finish column - Always show with actual value */}
                            <td className="border border-gray-300 p-1 text-center">
                              {readyVal !== null && readyVal !== undefined && readyVal !== '' ? readyVal : '—'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Totals Row - Always show both Gray and Finish totals */}
                <tr className="bg-gray-200 font-bold">
                  <td className="border border-gray-300 p-1 text-center">Total</td>
                  {colors.map(color => {
                    const colorGrayTotal = getColorGrayTotal(color.id);
                    const colorReadyTotal = getColorReadyTotal(color.id);
                    return (
                      <React.Fragment key={color.id}>
                        <td className="border border-gray-300 p-1 text-center">
                          {colorGrayTotal || '—'}
                        </td>
                        <td className="border border-gray-300 p-1 text-center">{colorReadyTotal || '—'}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Row - Show total Gray amount always, but hide details when unchecked */}
          <div className="grid grid-cols-4 gap-2 text-sm mb-4 border-t pt-3">
            <div className="font-bold">Total Lot PCS / {primaryUnitFull} :</div>
            <div>{order.total_pcs || order.pcs || '—'} / {primaryGrayQty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="font-bold text-red-600">Shortage {primaryUnitFull}:</div>
            <div className="text-red-600">{shortageMeters} ({shortagePercent}%)</div>
            <div className="font-bold">Finish {primaryUnitFull}:</div>
            <div>{primaryReadyQty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="col-span-2"></div>
          </div>

          {/* History / Balance Table - Always show Gray columns but values depend on checkbox */}
          <div className="border border-gray-300 mb-4 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1">Date</th>
                  <th className="border border-gray-300 p-1">DC NO</th>
                  <th className="border border-gray-300 p-1">G.Pcs</th>
                  <th className="border border-gray-300 p-1">G.{primaryUnit}</th>
                  <th className="border border-gray-300 p-1">F.Pcs</th>
                  <th className="border border-gray-300 p-1">F.{primaryUnit}</th>
                  <th className="border border-gray-300 p-1">Lot Complete</th>
                  <th className="border border-gray-300 p-1">Balance {primaryUnit}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-1 text-center">{new Date(order.order_date).toLocaleDateString('en-PK')}</td>
                  <td className="border border-gray-300 p-1 text-center">{order.order_no}</td>
                  <td className="border border-gray-300 p-1 text-center">
                    {order.total_pcs || order.pcs || '—'}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {primaryGrayQty.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">{order.total_pcs_finish || order.finish_pcs || '—'}</td>
                  <td className="border border-gray-300 p-1 text-center">{primaryReadyQty.toFixed(2)}</td>
                  <td className={`border border-gray-300 p-1 text-center font-bold ${Number(order.gray_lot?.balance || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {Number(order.gray_lot?.balance || 0) > 0 ? 'Incomplete' : 'Completed'}
                  </td>
                  <td className="border border-gray-300 p-1 text-center font-bold text-blue-600">
                    {Number(order.gray_lot?.balance || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="border border-gray-300 p-1 text-right">Total:</td>
                  <td className="border border-gray-300 p-1 text-center">
                    {order.total_pcs || order.pcs || '—'}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {primaryGrayQty.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">{order.total_pcs_finish || order.finish_pcs || '—'}</td>
                  <td className="border border-gray-300 p-1 text-center">{primaryReadyQty.toFixed(2)}</td>
                  <td colSpan={2} className="border border-gray-300 p-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Urdu Disclaimer */}
          <div className="text-right text-[11px] text-gray-500 border-t pt-3 mt-2 font-urdu" dir="rtl">
            <p>نوٹ: کسی بھی قسم کی غلطی کی صورت میں فوراً فیکٹری سے رابطہ کریں۔ تھان / مال کٹنے کے بعد کوئی شکایت قابل قبول نہیں ہوگی۔</p>
          </div>

          {/* Signatures for print */}
          <div className="hidden print:flex justify-between mt-8 pt-4">
            <div className="w-40 border-t border-black text-center pt-2 text-xs font-bold">
              Authorized Sign
            </div>
            <div className="w-40 border-t border-black text-center pt-2 text-xs font-bold">
              Receiver Sign
            </div>
          </div>
          
          {/* Secondary Unit Hint */}
          {!isGaz && shouldShowGrayValue() && (
            <div className="text-[10px] text-gray-400 text-center mt-2 print:text-gray-500">
              * Conversion: {primaryReadyQty.toFixed(2)} {primaryUnitFull} ≈ {secondaryReadyQty} {secondaryUnit}
            </div>
          )}
        </div>
      </div>
      
      {/* Print CSS Override */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          .app-sidebar, header {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          .max-w-5xl {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          button, .print\\:hidden {
            display: none;
          }
          .bg-gray-100, .bg-gray-50, .bg-gray-200 {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .border, .border-gray-300 {
            border-color: #000 !important;
          }
          .text-blue-600 {
            color: black !important;
          }
        }
        .font-urdu {
          font-family: 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Alvi Nastaleeq', serif;
        }
      `}</style>
    </div>
  );
}