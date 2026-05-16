import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Eye, Package, FileText, CalendarDays, Hash, Trash2 } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Invoice' },
  billed:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Invoiced' },
  paid:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Paid' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled' },
};

export default function DeliveryOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<DeliveryOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Delivery Order? This will also remove associated payments and adjust customer balance.")) return;
    
    try {
      await deliveryOrderService.deleteDeliveryOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      setTotal(prev => prev - 1);
      alert("Delivery Order deleted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete order");
      console.error(err);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await deliveryOrderService.getDeliveryOrders(
        statusFilter,
        1,
        100,
        undefined,
        undefined,
        undefined,
        search
      );
      setOrders(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const filteredOrders = orders;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Delivery Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Total {total} order{total !== 1 ? 's' : ''} found
          </p>
        </div>

        <button
          id="btn-add-do"
          onClick={() => navigate('/delivery-orders/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-sm font-semibold shadow-md shadow-blue-200"
        >
          <Plus size={18} />
          Add DO
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order no, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="completed">Pending Invoice</option>
          <option value="billed">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <Package size={48} strokeWidth={1.2} />
            <p className="text-base font-medium">No Data</p>
            <button
              onClick={() => navigate('/delivery-orders/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Create DO
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><Hash size={13} /> Order No</div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><FileText size={13} /> Lot No</div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><CalendarDays size={13} /> Date</div>
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Gray
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ready
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order, idx) => {
                  const sc = statusColors[order.status] ?? statusColors['completed'];
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                    >
                      {/* Order No */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-mono font-bold text-gray-800">{order.order_no}</p>
                        {order.invoice_no && (
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-0.5">
                            Inv: {order.invoice_no}
                          </p>
                        )}
                      </td>

                      {/* Lot No */}
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        {order.gray_lot?.lot_no ?? '—'}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-800">{order.customer?.name ?? '—'}</p>
                        {order.customer?.customer_code && (
                          <p className="text-xs text-gray-400">{order.customer.customer_code}</p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {order.order_date
                          ? new Date(order.order_date).toLocaleDateString('en-PK', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-gray-600 whitespace-nowrap">
                        {Number(order.total_gray_gazana ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-blue-600 whitespace-nowrap">
                        {Number(order.total_ready_gazana ?? 0).toLocaleString()}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* {order.status === 'completed' && (
                            <button
                              onClick={() => navigate('/billing/new', { state: { preSelectedDoId: order.id } })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              <FileText size={14} />
                              Invoice
                            </button>
                          )} */}
                          <button
                            onClick={() => navigate(`/delivery-orders/${order.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}