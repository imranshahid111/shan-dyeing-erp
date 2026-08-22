//@ts-nocheck
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
  const [lotHistory, setLotHistory] = useState<any[]>([]);

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

  useEffect(() => {
    if (order?.gray_lot_id || (order as any)?.gray_lot?.id) {
      const lotId = order.gray_lot_id || (order as any).gray_lot?.id;
      deliveryOrderService.getDeliveryOrders("", 1, 100, undefined, undefined, undefined, undefined, lotId)
        .then(res => {
          const returns = (order.gray_lot?.return_lots || []).map((r: any) => ({
            isReturn: true,
            id: `ret-${r.id}`,
            order_date: r.return_date,
            order_no: `RETURN${r.reason ? ` - ${r.reason}` : ''}`,
            total_gray_gazana: r.returned_quantity,
            total_ready_gazana: 0,
            grid_data: null,
            than: r.than
          }));
          const combined = [...(res.data || []), ...returns];
          const sorted = combined.sort((a: any, b: any) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime() || (String(a.id).localeCompare(String(b.id))));
          setLotHistory(sorted);
        })
        .catch(err => console.error("Failed to load lot history", err));
    }
  }, [order?.gray_lot_id, (order as any)?.gray_lot?.id, order?.gray_lot?.return_lots]);

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
  let gridGrayPcsCount = 0;
  let gridReadyPcsCount = 0;

  for (let r = 0; r < rows.length; r++) {
    for (let c of colors) {
      const grayValStr = getCellValue(r, c.id, 'gray');
      const readyValStr = getCellValue(r, c.id, 'ready');
      
      const grayVal = Number(grayValStr) || 0;
      const readyVal = Number(readyValStr) || 0;
      
      gridGrayTotal += grayVal;
      gridReadyTotal += readyVal;

      if (grayVal > 0) {
        gridGrayPcsCount++;
      }
      if (readyVal > 0) {
        gridReadyPcsCount++;
      }
    }
  }

  const isLotMeter = order.gray_lot?.measurement?.toLowerCase() === 'meter';
  const grayUnitFull = isLotMeter ? 'Meter' : 'Gaz (Yard)';
  const grayUnitShort = isLotMeter ? 'Mtr' : 'Gaz';
  
  let inputUnit = order.input_unit || order.grid_data?.inputUnit || 'meter';
  const isReadyGaz = inputUnit === 'gaz';
  const readyUnitFull = isReadyGaz ? 'Gaz (Yard)' : 'Meter';
  const readyUnitShort = isReadyGaz ? 'Gaz' : 'Mtr';

  const CONVERSION_FACTOR = 0.9144;

  const getReadyInLotUnit = (readyQty: number) => {
    if (isLotMeter && isReadyGaz) return readyQty * CONVERSION_FACTOR;
    if (!isLotMeter && !isReadyGaz) return readyQty / CONVERSION_FACTOR;
    return readyQty;
  };

  // If grid is empty, use backend gazana. Backend gazana is always GAZ.
  // So if isLotMeter, convert backend Gazana back to Meter for display: gazana * 0.9144
  const primaryGrayQty = gridGrayTotal > 0 
      ? gridGrayTotal 
      : (isLotMeter ? Number(order.total_gray_gazana || 0) * CONVERSION_FACTOR : Number(order.total_gray_gazana || 0));

  const primaryReadyQty = gridReadyTotal > 0 
      ? gridReadyTotal 
      : (isReadyGaz ? Number(order.total_ready_gazana || 0) : Number(order.total_ready_gazana || 0) * CONVERSION_FACTOR);
  
  const readyInLotUnit = getReadyInLotUnit(primaryReadyQty);
  
  const shortagePercent = primaryGrayQty > 0 ? ((primaryGrayQty - readyInLotUnit) / primaryGrayQty * 100).toFixed(2) : "0.00";

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
        <div className="print-area p-3 sm:p-4 md:p-5">
          
          {/* Header: SHAN DYEING + Title */}
          <div className="text-center border-b-2 border-gray-200 pb-2 mb-2">
            <h1 className="text-2xl font-black tracking-wider uppercase text-gray-900">SHAN DYEING</h1>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Challan</p>
            <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
              <span>Print Date: {new Date().toLocaleString('en-PK', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>D.C #: {order.order_no}</span>
            </div>
          </div>

          {/* Customer & Lot Info Row */}
          <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
            <div>
              <p className="font-bold">Customer:</p>
              <p className="font-mono text-base font-black">{order.customer?.name}</p>
            </div>
            <div className="text-center">
              <p className="font-bold">Bilti No:</p>
              <p className="font-mono text-base font-black">{order.gray_lot?.bill_no || '—'}</p>
            </div>
            <div className="text-center">
              <p className="font-bold">Than Qty / Gazana:</p>
              <p className="font-mono text-base font-black">{order.gray_lot?.than || '—'} / {order.gray_lot?.gazana || order.gray_lot?.total_gazana ? Number(order.gray_lot?.gazana || order.gray_lot?.total_gazana).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Lot #:</p>
              <p className="font-mono text-base font-black">{lotNo}</p>
            </div>
            <div>
              <p className="font-bold">Date:</p>
              <p>
                {order.order_date
                  ? (() => {
                      const [y, m, d] = String(order.order_date).split('T')[0].split('-');
                      if (!y || !m || !d) return order.order_date;
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${d.padStart(2, '0')}-${months[parseInt(m, 10) - 1]}-${y}`;
                    })()
                  : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="font-bold">Process Type:</p>
              <p className="text-gray-800 font-semibold">{order.gray_lot?.process_type || 'Dyeing'}</p>
            </div>
            <div className="col-span-2 text-right">
              <p className="font-bold">Quality / Finish:</p>
              <p>{quality} / {finishType}</p>
            </div>
            {(order as any).remarks && (
              <div className="col-span-4 mt-2 pt-2 border-t border-gray-200">
                <p className="font-bold">Remarks:</p>
                <p className="text-gray-700">{(order as any).remarks}</p>
              </div>
            )}
          </div>

          {/* Main Grid Table - Exactly like the physical challan */}
          <div className="overflow-x-auto border border-gray-300 mb-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Color Header Row - Always show Gray & Finish headers (columns visible) */}
                <tr className="bg-gray-100">
                  <th rowSpan={2} className="border border-gray-300 p-0.5 align-middle w-[10%] text-xs">Sr. No</th>
                  {colors.map(color => (
                    <th key={color.id} colSpan={2} className="border border-gray-300 border-b-0 p-1 text-center">
                      {color.name}
                    </th>
                  ))}
                </tr>
                {/* Gray/Finish Header Row - Always show both headers */}
                <tr className="bg-gray-100">
                  {colors.map(color => (
                    <React.Fragment key={color.id}>
                      <th className="border border-gray-300 border-t-0 p-0.5 text-center w-[10%] text-[10px]">
                        Gray <span className="sub-unit-label text-[9px]">({grayUnitFull})</span>
                      </th>
                      <th className="border border-gray-300 border-t-0 p-0.5 text-center w-[10%] text-[10px]">
                        Finish <span className="sub-unit-label text-[9px]">({readyUnitFull})</span>
                      </th>
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
                    <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} leading-none`}>
                      <td className="border border-gray-300 p-0.5 text-center font-bold w-[10%] text-xs">{rowIndex + 1}</td>
                      {colors.map(color => {
                        const grayVal = getCellValue(rowIndex, color.id, 'gray');
                        const readyVal = getCellValue(rowIndex, color.id, 'ready');
                        return (
                          <React.Fragment key={color.id}>
                            {/* Gray column - Show blank when checkbox is unchecked, otherwise show actual value */}
                            <td className="border border-gray-300 p-0.5 text-center w-[10%] qty-cell text-xs font-semibold">
                              {shouldShowGrayValue() && grayVal !== null && grayVal !== undefined && grayVal !== '' ? grayVal : ''}
                            </td>
                            {/* Finish column - Always show with actual value */}
                            <td className="border border-gray-300 p-0.5 text-center w-[10%] qty-cell text-xs font-semibold">
                              {readyVal !== null && readyVal !== undefined && readyVal !== '' ? readyVal : ''}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
                {/* Totals Row - Always show both Gray and Finish totals */}
                <tr className="bg-gray-200 font-bold">
                  <td className="border border-gray-300 p-0.5 text-center w-[10%] text-xs">Total</td>
                  {colors.map(color => {
                    const colorGrayTotal = getColorGrayTotal(color.id);
                    const colorReadyTotal = getColorReadyTotal(color.id);
                    return (
                      <React.Fragment key={color.id}>
                        <td className="border border-gray-300 p-0.5 text-center w-[10%] text-xs">
                          {colorGrayTotal || ''}
                        </td>
                        <td className="border border-gray-300 p-0.5 text-center w-[10%] text-xs">{colorReadyTotal || ''}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Row - Show total Gray amount always, but hide details when unchecked */}
          <div className="grid grid-cols-4 gap-1 text-xs mb-2 border-t pt-1">
            <div className="font-bold">Gray PCS / {grayUnitFull} :</div>
            <div>{gridGrayPcsCount > 0 ? gridGrayPcsCount : (order.total_pcs || order.pcs || '')} / {primaryGrayQty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="font-bold text-red-600">Shortage {grayUnitFull}:</div>
            <div className="text-red-600">({shortagePercent}%)</div>
            <div className="font-bold">Ready PCS / Finish {readyUnitFull}:</div>
            <div>{gridReadyPcsCount > 0 ? gridReadyPcsCount : (order.total_pcs_finish || order.finish_pcs || '')} / {primaryReadyQty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="col-span-2"></div>
          </div>

          {/* History / Balance Table - Always show Gray columns but values depend on checkbox */}
          <div className="border border-gray-300 mb-2 text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1">Date</th>
                  <th className="border border-gray-300 p-1">DC NO</th>
                  <th className="border border-gray-300 p-1">G.Pcs</th>
                  <th className="border border-gray-300 p-1">G.{grayUnitShort}</th>
                  <th className="border border-gray-300 p-1">F.Pcs</th>
                  <th className="border border-gray-300 p-1">F.{readyUnitShort}</th>
                  <th className="border border-gray-300 p-1">Lot Complete</th>
                  <th className="border border-gray-300 p-1">Balance {grayUnitShort}</th>
                </tr>
              </thead>
              <tbody>
                {lotHistory.length > 0 ? (() => {
                  let balance = Number(order.gray_lot?.gazana || 0);
                  return lotHistory.map((doItem) => {
                    let gPcs = 0;
                    let fPcs = 0;
                    let gMtr = 0;
                    let fMtr = 0;

                    if (doItem.grid_data) {
                      let grid = doItem.grid_data;
                      if (typeof grid === 'string') {
                        try { grid = JSON.parse(grid); } catch(e) {}
                      }
                      const rows = grid.rows || [];
                      const colors = grid.colors || [];
                      rows.forEach((r: any) => {
                        colors.forEach((c: any) => {
                          const g = Number(r.values?.[c.id]?.gray || 0);
                          const f = Number(r.values?.[c.id]?.ready || 0);
                          if (g > 0) gPcs++;
                          if (f > 0) fPcs++;
                          gMtr += g;
                          fMtr += f;
                        });
                      });
                    }
                    
                    // Fallback if grid was empty
                    if (gMtr === 0) {
                      gMtr = isLotMeter ? Number(doItem.total_gray_gazana || 0) * CONVERSION_FACTOR : Number(doItem.total_gray_gazana || 0);
                    }
                    if (fMtr === 0 && !doItem.isReturn) {
                      const isReadyGaz = (doItem.input_unit || 'meter') === 'gaz';
                      fMtr = isReadyGaz ? Number(doItem.total_ready_gazana || 0) : Number(doItem.total_ready_gazana || 0) * CONVERSION_FACTOR;
                    }
                    if (doItem.isReturn) {
                      gPcs = Number(doItem.than) || 0;
                    }

                    balance -= gMtr;
                    const isComplete = balance <= 1;

                    return (
                      <tr key={doItem.id} className={`${doItem.id === order.id ? 'bg-blue-50 font-semibold' : doItem.isReturn ? 'bg-red-50 text-red-800 italic' : 'bg-white'} hover:bg-gray-50 transition-colors ${!doItem.isReturn ? 'cursor-pointer' : ''}`} onClick={() => !doItem.isReturn && window.open(`/delivery-orders/${doItem.id}`, '_blank')}>
                        <td className="border border-gray-300 p-1 text-center">
                          {doItem.order_date
                            ? (() => {
                                const [y, m, d] = String(doItem.order_date).split('T')[0].split('-');
                                if (!y || !m || !d) return doItem.order_date;
                                return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
                              })()
                            : '—'}
                        </td>
                        <td className={`border border-gray-300 p-1 text-center ${!doItem.isReturn ? 'text-blue-600' : 'font-bold'}`}>{doItem.order_no}</td>
                        <td className="border border-gray-300 p-1 text-center">{gPcs > 0 ? gPcs : ''}</td>
                        <td className="border border-gray-300 p-1 text-center">{gMtr > 0 ? gMtr.toFixed(2) : ''}</td>
                        <td className="border border-gray-300 p-1 text-center">{fPcs > 0 ? fPcs : ''}</td>
                        <td className="border border-gray-300 p-1 text-center">{!doItem.isReturn ? fMtr.toFixed(2) : ''}</td>
                        <td className={`border border-gray-300 p-1 text-center font-bold ${!isComplete ? 'text-orange-600' : 'text-green-600'}`}>
                          {!isComplete ? 'Incomplete' : 'Completed'}
                        </td>
                        <td className="border border-gray-300 p-1 text-center font-bold text-blue-600">
                          {balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  });
                })() : (
                  <tr>
                    <td className="border border-gray-300 p-1 text-center">
                      {order.order_date
                        ? (() => {
                            const [y, m, d] = String(order.order_date).split('T')[0].split('-');
                            if (!y || !m || !d) return order.order_date;
                            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
                          })()
                        : '—'}
                    </td>
                    <td className="border border-gray-300 p-1 text-center">{order.order_no}</td>
                    <td className="border border-gray-300 p-1 text-center">
                      {gridGrayPcsCount > 0 ? gridGrayPcsCount : (order.total_pcs || order.pcs || '')}
                    </td>
                    <td className="border border-gray-300 p-1 text-center">
                      {primaryGrayQty.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-1 text-center">{gridReadyPcsCount > 0 ? gridReadyPcsCount : (order.total_pcs_finish || order.finish_pcs || '')}</td>
                    <td className="border border-gray-300 p-1 text-center">{primaryReadyQty.toFixed(2)}</td>
                    <td className={`border border-gray-300 p-1 text-center font-bold ${Number(order.gray_lot?.balance || 0) > 0.5 ? 'text-orange-600' : 'text-green-600'}`}>
                      {Number(order.gray_lot?.balance || 0) > 0.5 ? 'Incomplete' : 'Completed'}
                    </td>
                    <td className="border border-gray-300 p-1 text-center font-bold text-blue-600">
                      {Number(order.gray_lot?.balance || 0).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="border border-gray-300 p-1 text-right">Total:</td>
                  <td className="border border-gray-300 p-1 text-center">
                    {lotHistory.length > 0 
                      ? lotHistory.reduce((sum, d) => sum + (() => {
                          let count = 0;
                          if (d.grid_data) {
                            let g = d.grid_data;
                            if (typeof g === 'string') try { g = JSON.parse(g) } catch(e){}
                            (g.rows || []).forEach((r:any) => (g.colors || []).forEach((c:any) => { if(Number(r.values?.[c.id]?.gray || 0) > 0) count++; }));
                          }
                          if (d.isReturn) {
                            count += Number(d.than) || 0;
                          }
                          return count;
                        })(), 0)
                      : (gridGrayPcsCount > 0 ? gridGrayPcsCount : (order.total_pcs || order.pcs || 0))}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {lotHistory.length > 0 
                      ? lotHistory.reduce((sum, d) => sum + (() => {
                          let sumMtr = 0;
                          if (d.grid_data) {
                            let g = d.grid_data;
                            if (typeof g === 'string') try { g = JSON.parse(g) } catch(e){}
                            (g.rows || []).forEach((r:any) => (g.colors || []).forEach((c:any) => { sumMtr += Number(r.values?.[c.id]?.gray || 0); }));
                          }
                          if (sumMtr === 0) sumMtr = isLotMeter ? Number(d.total_gray_gazana || 0) * CONVERSION_FACTOR : Number(d.total_gray_gazana || 0);
                          return sumMtr;
                        })(), 0).toFixed(2)
                      : primaryGrayQty.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {lotHistory.length > 0 
                      ? lotHistory.reduce((sum, d) => sum + (() => {
                          let count = 0;
                          if (d.grid_data) {
                            let g = d.grid_data;
                            if (typeof g === 'string') try { g = JSON.parse(g) } catch(e){}
                            (g.rows || []).forEach((r:any) => (g.colors || []).forEach((c:any) => { if(Number(r.values?.[c.id]?.ready || 0) > 0) count++; }));
                          }
                          return count;
                        })(), 0)
                      : (gridReadyPcsCount > 0 ? gridReadyPcsCount : (order.total_pcs_finish || order.finish_pcs || 0))}
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    {lotHistory.length > 0 
                      ? lotHistory.reduce((sum, d) => sum + (() => {
                          let sumMtr = 0;
                          if (d.grid_data) {
                            let g = d.grid_data;
                            if (typeof g === 'string') try { g = JSON.parse(g) } catch(e){}
                            (g.rows || []).forEach((r:any) => (g.colors || []).forEach((c:any) => { sumMtr += Number(r.values?.[c.id]?.ready || 0); }));
                          }
                          if (sumMtr === 0) {
                            const isReadyGaz = (d.input_unit || 'meter') === 'gaz';
                            sumMtr = isReadyGaz ? Number(d.total_ready_gazana || 0) : Number(d.total_ready_gazana || 0) * CONVERSION_FACTOR;
                          }
                          return sumMtr;
                        })(), 0).toFixed(2)
                      : primaryReadyQty.toFixed(2)}
                  </td>
                  <td colSpan={2} className="border border-gray-300 p-1"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Urdu Disclaimer */}
          <div className="text-right text-[10px] text-gray-500 border-t pt-1 mt-1 font-urdu" dir="rtl">
            <p>نوٹ: کسی بھی قسم کی غلطی کی صورت میں فوراً فیکٹری سے رابطہ کریں۔ تھان / مال کٹنے کے بعد کوئی شکایت قابل قبول نہیں ہوگی۔</p>
          </div>

          {/* Signatures for print */}
          <div className="hidden print:flex justify-between mt-4 pt-2">
            <div className="w-36 border-t border-black text-center pt-1 text-xs font-bold">
              Authorized Sign
            </div>
            <div className="w-36 border-t border-black text-center pt-1 text-xs font-bold">
              Receiver Sign
            </div>
          </div>
          
          {/* Secondary Unit Hint */}
          {shouldShowGrayValue() && (
            <div className="text-[10px] text-gray-400 text-center mt-2 print:text-gray-500">
              * Conversion: {primaryReadyQty.toFixed(2)} {readyUnitFull} ≈ {isReadyGaz ? (primaryReadyQty * 0.9144).toFixed(2) : (primaryReadyQty / 0.9144).toFixed(2)} {isReadyGaz ? 'Meters' : 'Gaz (Yard)'}
            </div>
          )}
          
        </div>
      </div>

      {/* Print CSS Override */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 4mm 4mm 4mm 4mm;
        }
        @media print {
          /* Hide all UI elements except print-area */
          body * {
            visibility: hidden !important;
          }
          
          .print-area, .print-area * {
            visibility: visible !important;
          }

          /* Detach print-area from layout flow to allow natural browser pagination */
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            float: none !important;
            overflow: visible !important;
          }

          /* Force un-hide and unlock parent containers height */
          html, body, #root, main, div {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
          }

          .print\\:hidden, button, header, nav, .sidebar, .app-sidebar {
            display: none !important;
          }

          .bg-gray-100, .bg-gray-50, .bg-gray-200 {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .border, .border-gray-300, .border-gray-200 {
            border-color: #000000 !important;
          }

          .text-blue-600, .text-gray-500, .text-gray-600, .text-gray-700, .text-gray-800, .text-gray-900, .text-red-600, .text-orange-600, .text-green-600 {
            color: #000000 !important;
          }

          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }

          th, td {
            padding: 1px 1px !important;
            font-size: 8px !important;
            word-wrap: break-word;
            color: #000000 !important;
          }

          .sub-unit-label {
            font-size: 6.5px !important;
            font-weight: normal !important;
          }

          .qty-cell {
            font-size: 11px !important;
            font-weight: 700 !important;
          }

          .lot-history-section, .signature-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        .font-urdu {
          font-family: 'Noto Nastaliq Urdu', 'Urdu Typesetting', 'Alvi Nastaleeq', serif;
        }
      `}</style>
    </div>
  );
}