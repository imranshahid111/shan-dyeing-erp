import { useEffect, useState } from 'react';
import { Download, Eye, EyeOff, Loader2, Printer } from 'lucide-react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { PDFDeliveryChallan } from './PDFDeliveryChallan';
import {
  computeDeliveryChallan,
  DeliveryOrderWithGrid,
  displayCell,
  formatQty,
} from '../utils/deliveryChallanCalculations';
import { toast } from 'sonner';
import React from 'react';

interface DeliveryChallanReportProps {
  fromDate: string;
  toDate: string;
}

export default function DeliveryChallanReport({ fromDate, toDate }: DeliveryChallanReportProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [order, setOrder] = useState<DeliveryOrderWithGrid | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [showGrayDetails, setShowGrayDetails] = useState(true);

  useEffect(() => {
    customerService.getCustomers('', 1, 1000).then((res) => setCustomers(res.data)).catch(console.error);
    organizationService.getOrganization().then(setOrganization).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingList(true);
      try {
        const res = await deliveryOrderService.getDeliveryOrders(
          '',
          1,
          500,
          selectedCustomerId || undefined,
          fromDate,
          toDate
        );
        const orders = res.data || [];
        setDeliveryOrders(orders);
        if (orders.length > 0) {
          setSelectedOrderId((prev) => (prev && orders.some((o) => o.id === prev) ? prev : orders[0].id));
        } else {
          setSelectedOrderId(null);
          setOrder(null);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load delivery orders');
      } finally {
        setLoadingList(false);
      }
    };
    fetchOrders();
  }, [fromDate, toDate, selectedCustomerId]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!selectedOrderId) {
        setOrder(null);
        return;
      }
      setLoadingOrder(true);
      try {
        let data = await deliveryOrderService.getDeliveryOrderById(selectedOrderId);
        if (typeof data.grid_data === 'string') {
          try {
            data.grid_data = JSON.parse(data.grid_data);
          } catch {
            data.grid_data = { rows: [], colors: [] };
          }
        }
        setOrder(data as DeliveryOrderWithGrid);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load delivery challan data');
        setOrder(null);
      } finally {
        setLoadingOrder(false);
      }
    };
    fetchOrder();
  }, [selectedOrderId]);

  const handlePdfPrint = async () => {
    if (!order || !organization) return;
    try {
      const blob = await pdf(
        <PDFDeliveryChallan order={order} org={organization} showGrayDetails={showGrayDetails} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank', 'width=900,height=1100');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }
      printWindow.onload = () => setTimeout(() => printWindow.print(), 800);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const calc = order ? computeDeliveryChallan(order) : null;
  const companyName = organization?.name || 'SHAN DYEING';
  const printDateTime = new Date().toLocaleString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const customerName = order?.customer
    ? `${order.customer.name}${order.customer.customer_code ? ` / ${order.customer.customer_code}` : ''}`
    : '—';

  const balanceMeters = calc
    ? Math.max(0, calc.totalGrayMeters - calc.totalFinishMeters)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Filters & Actions */}
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between print:hidden">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="min-w-[200px] relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Customer
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[220px] relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Delivery Challan (DC)
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedOrderId || ''}
              onChange={(e) => setSelectedOrderId(Number(e.target.value))}
              disabled={deliveryOrders.length === 0}
            >
              {deliveryOrders.length === 0 && <option value="">No delivery orders found</option>}
              {deliveryOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_no} — {o.customer?.name} ({new Date(o.order_date).toLocaleDateString('en-PK')})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={showGrayDetails}
              onChange={(e) => setShowGrayDetails(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              {showGrayDetails ? <Eye size={14} /> : <EyeOff size={14} />}
              Show Gray Details
            </span>
          </label>
          <button
            onClick={handlePdfPrint}
            disabled={!order || !organization}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm disabled:opacity-50"
          >
            <Printer size={16} />
            Print PDF
          </button>
          {organization && order && (
            <PDFDownloadLink
              document={
                <PDFDeliveryChallan order={order} org={organization} showGrayDetails={showGrayDetails} />
              }
              fileName={`Delivery-Challan-${order.order_no}.pdf`}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm no-underline"
            >
              {({ loading }) => (
                <>
                  <Download size={16} />
                  {loading ? 'Generating...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Report Preview */}
      <div className="relative flex-1 p-6">
        {(loadingList || loadingOrder) && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {!order && !loadingList && (
          <div className="text-center py-20 text-gray-400 font-semibold">
            No delivery challan found for the selected period.
          </div>
        )}

        {order && calc && (
          <div className="challan-report max-w-4xl mx-auto border border-gray-300 bg-white text-xs text-black print:text-black">
            {/* Branding Header */}
            <div className="bg-gray-300 border-b border-black p-4 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black uppercase tracking-wider">{companyName}</h1>
                {organization?.address && <p className="text-[10px] mt-1">{organization.address}</p>}
                {organization?.phone && <p className="text-[10px]">Tel: {organization.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase tracking-wide">Delivery Challan</p>
                <p className="text-[10px] text-gray-600 mt-1">Print Date & Time</p>
                <p className="text-[10px]">{printDateTime}</p>
              </div>
            </div>

            {/* Header Info */}
            <div className="border-b border-black">
              <div className="grid grid-cols-2 border-b border-black">
                <div className="p-2 border-r border-black flex">
                  <span className="font-bold w-28 shrink-0">Customer Name:</span>
                  <span className="font-bold">{customerName}</span>
                </div>
                <div className="p-2 flex">
                  <span className="font-bold w-24 shrink-0">Lot Number:</span>
                  <span className="font-bold">{calc.lotNo}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 border-b border-black">
                <div className="p-2 border-r border-black flex">
                  <span className="font-bold w-28 shrink-0">DC Number:</span>
                  <span className="font-bold">{order.order_no}</span>
                </div>
                <div className="p-2 flex">
                  <span className="font-bold w-24 shrink-0">Report Date:</span>
                  <span className="font-bold">
                    {new Date(order.order_date).toLocaleDateString('en-PK')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div className="p-2 border-r border-black flex">
                  <span className="font-bold w-28 shrink-0">Fabric Type:</span>
                  <span className="font-bold">{calc.fabricType}</span>
                </div>
                <div className="p-2 flex">
                  <span className="font-bold w-24 shrink-0">Width / GSM:</span>
                  <span className="font-bold">{calc.widthGsm}</span>
                </div>
              </div>
            </div>

            {/* Color Information */}
            <div className="bg-gray-300 border-b border-black px-3 py-1.5 font-black uppercase text-[10px] tracking-wide">
              Color Information
            </div>
            <div className="p-3 border-b border-black flex flex-wrap gap-2">
              {calc.colors.length > 0 ? (
                calc.colors.map((color, idx) => (
                  <span key={color.id} className="border border-black px-2 py-1 text-[10px] font-semibold">
                    {idx + 1}. {color.name}
                  </span>
                ))
              ) : (
                <span>—</span>
              )}
            </div>

            {/* Production Details */}
            <div className="bg-gray-300 border-b border-black px-3 py-1.5 font-black uppercase text-[10px] tracking-wide">
              Production Details ({calc.primaryUnitFull})
            </div>
            <div className="overflow-x-auto border-b border-black">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-300">
                    <th className="border border-black p-1 w-10">Sr No</th>
                    {calc.colors.map((color, idx) => (
                      <th key={color.id} className="border border-black p-1 text-center">
                        Color {idx + 1}
                        <br />
                        Meters
                      </th>
                    ))}
                    <th className="border border-black p-1 w-16">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.productionRows.map((row) => {
                    const hasData = row.colorMeters.some((v) => v !== null && v > 0);
                    if (!hasData && row.srNo > (order.grid_data as any)?.rows?.length) return null;
                    return (
                      <tr key={row.srNo}>
                        <td className="border border-black p-1 text-center font-bold">{row.srNo}</td>
                        {calc.colors.map((color, cIdx) => (
                          <td key={color.id} className="border border-black p-1 text-center">
                            {displayCell(row.colorMeters[cIdx])}
                          </td>
                        ))}
                        <td className="border border-black p-1 text-center font-bold">
                          {hasData ? row.total || '—' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-200 font-bold">
                    <td className="border border-black p-1 text-center">Total</td>
                    {calc.colors.map((color, idx) => (
                      <td key={color.id} className="border border-black p-1 text-center">
                        {calc.colorFinishTotals[idx] || '—'}
                      </td>
                    ))}
                    <td className="border border-black p-1 text-center">
                      {calc.productionGrandTotal || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-gray-300 border-b border-black px-3 py-1.5 font-black uppercase text-[10px] tracking-wide">
              Summary
            </div>
            <div className="grid grid-cols-3 border-b border-black text-[10px]">
              <div className="p-2 border-r border-b border-black flex justify-between">
                <span className="font-bold">Total Gray Meters:</span>
                <span className="font-bold">
                  {showGrayDetails ? formatQty(calc.totalGrayMeters) : '—'}
                </span>
              </div>
              <div className="p-2 border-r border-b border-black flex justify-between">
                <span className="font-bold">Total Finish Meters:</span>
                <span className="font-bold">{formatQty(calc.totalFinishMeters)}</span>
              </div>
              <div className="p-2 border-b border-black flex justify-between">
                <span className="font-bold">Shortage %:</span>
                <span className="font-bold">
                  {showGrayDetails ? `${calc.shortagePercent}%` : '—'}
                </span>
              </div>
              <div className="p-2 border-r border-black flex justify-between">
                <span className="font-bold">Total Gray Pieces:</span>
                <span className="font-bold">
                  {showGrayDetails ? String(calc.totalGrayPieces) : '—'}
                </span>
              </div>
              <div className="p-2 border-r border-black flex justify-between">
                <span className="font-bold">Total Finish Pieces:</span>
                <span className="font-bold">{String(calc.totalFinishPieces)}</span>
              </div>
              <div className="p-2 flex justify-between">
                <span className="font-bold">Finish Type:</span>
                <span className="font-bold">{calc.finishType}</span>
              </div>
            </div>

            {/* Delivery Summary */}
            <div className="bg-gray-300 border-b border-black px-3 py-1.5 font-black uppercase text-[10px] tracking-wide">
              Delivery Summary
            </div>
            <table className="w-full border-collapse text-[10px] border-b border-black">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border border-black p-1">Date</th>
                  <th className="border border-black p-1">DC No</th>
                  <th className="border border-black p-1">Gray Pieces</th>
                  <th className="border border-black p-1">Gray Meters</th>
                  <th className="border border-black p-1">Finish Pieces</th>
                  <th className="border border-black p-1">Finish Meters</th>
                  <th className="border border-black p-1">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 text-center">
                    {new Date(order.order_date).toLocaleDateString('en-PK')}
                  </td>
                  <td className="border border-black p-1 text-center">{order.order_no}</td>
                  <td className="border border-black p-1 text-center">
                    {showGrayDetails ? String(calc.totalGrayPieces) : '—'}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {showGrayDetails ? formatQty(calc.totalGrayMeters) : '—'}
                  </td>
                  <td className="border border-black p-1 text-center">{String(calc.totalFinishPieces)}</td>
                  <td className="border border-black p-1 text-center">
                    {formatQty(calc.totalFinishMeters)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {showGrayDetails ? formatQty(balanceMeters) : '—'}
                  </td>
                </tr>
                <tr className="bg-gray-200 font-bold">
                  <td colSpan={2} className="border border-black p-1 text-right">
                    Total:
                  </td>
                  <td className="border border-black p-1 text-center">
                    {showGrayDetails ? String(calc.totalGrayPieces) : '—'}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {showGrayDetails ? formatQty(calc.totalGrayMeters) : '—'}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {String(calc.totalFinishPieces)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {formatQty(calc.totalFinishMeters)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {showGrayDetails ? formatQty(balanceMeters) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Final Totals */}
            <div className="flex justify-end p-4 border-b border-black">
              <div className="w-64 border border-black text-[10px]">
                <div className="flex justify-between p-2 border-b border-black bg-gray-100">
                  <span className="font-bold">Grand Total Pieces:</span>
                  <span className="font-bold">
                    {showGrayDetails ? String(calc.totalGrayPieces) : String(calc.totalFinishPieces)}
                  </span>
                </div>
                <div className="flex justify-between p-2 border-b border-black bg-gray-100">
                  <span className="font-bold">Grand Total Meters:</span>
                  <span className="font-bold">{formatQty(calc.totalFinishMeters)}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-300 font-bold">
                  <span>Balance Meters:</span>
                  <span>{showGrayDetails ? formatQty(balanceMeters) : '—'}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between px-8 py-6 text-[10px] font-bold">
              <div className="w-32 border-t border-black pt-2 text-center">Authorized Sign</div>
              <div className="w-32 border-t border-black pt-2 text-center">Checked By</div>
              <div className="w-32 border-t border-black pt-2 text-center">Receiver Sign</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
