import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Printer, FileText, Calendar, User, Package } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import React from 'react';

export default function ViewDeliveryOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<(DeliveryOrderItem & { grid_data: any }) | null>(null);
  const [loading, setLoading] = useState(true);

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

  const colors = order.grid_data?.colors || [];
  const rows = order.grid_data?.rows || [];

  // Helper to extract values from grid_data
  const getCellValue = (rowIndex: number, colorId: string, field: 'gray' | 'ready') => {
    const row = rows[rowIndex];
    return row?.values?.[colorId]?.[field];
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
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
            <p className="text-sm text-gray-500">Reviewing {order.order_no}</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-bold"
        >
          <Printer size={20} />
          Print DO
        </button>
      </div>

      {/* Main DO Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
        {/* DO Header Banner */}
        <div className="bg-gray-900 text-white p-8 print:bg-white print:text-black print:border-b-2 print:border-gray-200">
           <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Delivery Order</h1>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 text-gray-400 print:text-black">
                      <FileText size={16} />
                      <span className="text-sm font-bold font-mono">{order.order_no}</span>
                   </div>
                   <div className="flex items-center gap-2 text-gray-400 print:text-black">
                      <Calendar size={16} />
                      <span className="text-sm font-bold uppercase">{new Date(order.order_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                   </div>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 print:text-black">Status</p>
                 <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${order.status === 'billed' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'} print:border print:border-black print:text-black print:bg-white`}>
                    {order.status === 'billed' ? 'INVOICED' : 'PENDING'}
                 </span>
              </div>
           </div>
        </div>

        <div className="p-8 space-y-8">
           {/* Info Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-gray-400 print:text-black">
                    <User size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Customer Details</h4>
                 </div>
                 <div className="bg-gray-50 rounded-2xl p-6 print:bg-white print:border print:border-gray-100">
                    <p className="text-lg font-black text-gray-900">{order.customer?.name}</p>
                    <div className="mt-2 space-y-1">
                       <p className="text-sm text-gray-500">ID: {order.customer?.customer_code}</p>
                       <p className="text-sm text-gray-500">Phone: {order.customer?.phone || 'N/A'}</p>
                       <p className="text-sm text-gray-500">City: {order.customer?.city || 'N/A'}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-gray-400 print:text-black">
                    <Package size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Lot Information</h4>
                 </div>
                 <div className="bg-gray-50 rounded-2xl p-6 print:bg-white print:border print:border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-bold text-gray-400 uppercase">Lot Number</p>
                       <p className="text-sm font-black text-gray-900">{order.gray_lot?.lot_no}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-bold text-gray-400 uppercase">Quality</p>
                       <p className="text-sm font-black text-gray-900">{order.gray_lot?.quality}</p>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-bold text-gray-400 uppercase">Gray Gazana</p>
                       <p className="text-sm font-black text-gray-900">{order.total_gray_gazana} {order.gray_lot?.measurement}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-xs font-bold text-gray-400 uppercase">Ready Gazana</p>
                       <p className="text-lg font-black text-blue-600">{order.total_ready_gazana} {order.gray_lot?.measurement}</p>
                    </div>
                    {order.status === 'billed' && order.rate && (
                       <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          <div className="flex justify-between items-center">
                             <p className="text-xs font-bold text-gray-400 uppercase">Rate Applied</p>
                             <p className="text-sm font-black text-gray-900">Rs {order.rate} / {order.rate_unit === 'yard' ? 'Yard (Gaz)' : 'Meter'}</p>
                          </div>
                          <div className="flex justify-between items-center">
                             <p className="text-xs font-bold text-gray-400 uppercase">Total Amount</p>
                             <p className="text-sm font-black text-green-600">Rs {Number(order.total_amount).toLocaleString()}</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Grid Data */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-400 print:text-black">
                 <FileText size={18} />
                 <h4 className="text-xs font-black uppercase tracking-widest">Fabric Distribution Grid</h4>
              </div>
              
              <div className="border border-gray-200 rounded-2xl overflow-x-auto print:border-gray-300">
                <table className="w-full text-[11px] print:text-[10px] min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-900 text-white print:bg-gray-100 print:text-black">
                      <th className="border border-gray-700 px-2 py-3 text-center print:border-gray-300">SR</th>
                      {colors.map(color => (
                        <th key={color.id} colSpan={2} className="border border-gray-700 px-2 py-3 text-center uppercase tracking-tighter print:border-gray-300">
                          {color.name}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-gray-800 text-gray-300 print:bg-white print:text-black">
                      <th className="border border-gray-700 px-2 py-2 print:border-gray-300">#</th>
                      {colors.map(color => (
                        <React.Fragment key={color.id}>
                          <th className="border border-gray-700 px-1 py-1 text-center font-medium print:border-gray-300">GRAY</th>
                          <th className="border border-gray-700 px-1 py-1 text-center font-medium print:border-gray-300">RDY</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(rows.length, 15) }).map((_, rowIndex) => {
                       // Check if row has any data
                       const rowHasData = colors.some(c => getCellValue(rowIndex, c.id, 'gray') || getCellValue(rowIndex, c.id, 'ready'));
                       if (!rowHasData && rowIndex > 5) return null; // Hide empty rows beyond index 5
                       
                       return (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 print:bg-white'}>
                          <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-gray-400 print:border-gray-300">
                            {rowIndex + 1}
                          </td>
                          {colors.map(color => {
                            const gray = getCellValue(rowIndex, color.id, 'gray');
                            const ready = getCellValue(rowIndex, color.id, 'ready');
                            return (
                              <React.Fragment key={color.id}>
                                <td className="border border-gray-200 px-1 py-1.5 text-center print:border-gray-300">
                                  {gray !== undefined && gray !== null ? gray : '—'}
                                </td>
                                <td className="border border-gray-200 px-1 py-1.5 text-center font-bold text-blue-600 print:border-gray-300 print:text-black">
                                  {ready !== undefined && ready !== null ? ready : '—'}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Footer Signature - Only for Print */}
           <div className="hidden print:flex justify-between mt-20">
              <div className="w-48 border-t border-black text-center pt-2">
                 <p className="text-xs font-bold uppercase">Authorized Sign</p>
              </div>
              <div className="w-48 border-t border-black text-center pt-2">
                 <p className="text-xs font-bold uppercase">Receiver Sign</p>
              </div>
           </div>
        </div>
      </div>
      
      {/* Print Helper CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          main, #root > div {
            margin: 0 !important;
            padding: 0 !important;
          }
          /* This ensures only our DO card is printed */
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
