import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Eye, Package, FileText, CalendarDays, Hash, Trash2, FileEdit } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { toast } from 'sonner';

const statusConfig: Record<string, { badge: string; label: string }> = {
  completed: { badge: 'badge-yellow', label: 'Pending Invoice' },
  billed:    { badge: 'badge-blue',   label: 'Invoiced' },
  paid:      { badge: 'badge-green',  label: 'Paid' },
  cancelled: { badge: 'badge-red',    label: 'Cancelled' },
};

export default function DeliveryOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DeliveryOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [canDelete, setCanDelete] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure? This will also remove associated payments and adjust customer balance.')) return;
    try {
      await deliveryOrderService.deleteDeliveryOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await deliveryOrderService.getDeliveryOrders(
        statusFilter, currentPage, pageSize, undefined, undefined, undefined, search
      );
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(Math.ceil(res.total / pageSize) || 1);
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search]);

  useEffect(() => { loadOrders(); }, [statusFilter, search, currentPage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin') {
          setCanDelete(true);
        } else {
          setCanDelete(parsed.privileges?.can_delete ?? false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Delivery Orders</h2>
          <p>{total} order{total !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" id="btn-add-do" onClick={() => navigate('/delivery-orders/new')}>
          <Plus size={16} />
          Add Delivery Order
        </button>
      </div>

      {/* Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div className="search-bar" style={{ maxWidth: '20rem' }}>
              <Search className="search-bar-icon" size={16} />
              <input
                type="text"
                placeholder="Search by order no, customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="select-field"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ minWidth: '11rem' }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Pending Invoice</option>
              <option value="billed">Invoiced</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <span className="badge badge-gray">{total} Records</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading delivery orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={26} /></div>
              <p className="empty-state-title">No Delivery Orders</p>
              <p className="empty-state-desc">No orders match the selected filters. Create a new delivery order to get started.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/delivery-orders/new')}>
                <Plus size={15} /> Create Delivery Order
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Hash size={12} />Order No</div></th>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><FileText size={12} />Lot No</div></th>
                  <th>Customer</th>
                  <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><CalendarDays size={12} />Date</div></th>
                  <th style={{ textAlign: 'right' }}>Gray</th>
                  <th style={{ textAlign: 'right' }}>Ready</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sc = statusConfig[order.status] ?? statusConfig['completed'];
                  
                  const isLotMeter = order.gray_lot?.measurement?.toLowerCase() === 'meter';
                  const grayQty = isLotMeter ? (Number(order.total_gray_gazana) * 0.9144) : Number(order.total_gray_gazana);
                  const grayUnit = isLotMeter ? 'Mtr' : 'Gaz';

                  let inputUnit = order.input_unit || (order as any).grid_data?.inputUnit || 'meter';
                  const isReadyGaz = inputUnit === 'gaz';
                  const readyQty = isReadyGaz ? Number(order.total_ready_gazana) : (Number(order.total_ready_gazana) * 0.9144);
                  const readyUnit = isReadyGaz ? 'Gaz' : 'Mtr';

                  return (
                    <tr key={order.id}>
                      <td>
                        <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                          {order.order_no}
                        </p>
                        {order.invoice_no && (
                          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--brand-600)', marginTop: '2px' }}>
                            INV: {order.invoice_no}
                          </p>
                        )}
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {order.gray_lot?.lot_no ?? '—'}
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{order.customer?.name ?? '—'}</p>
                        {order.customer?.customer_code && (
                          <p style={{ fontSize: '0.6875rem', color: 'var(--gray-400)' }}>{order.customer.customer_code}</p>
                        )}
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {order.order_date
                          ? new Date(order.order_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--gray-600)' }}>
                        {Number(grayQty ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                        <span style={{ fontSize: '0.65rem', marginLeft: '4px', color: 'var(--gray-400)', textTransform: 'uppercase' }}>{grayUnit}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-600)' }}>
                        {Number(readyQty ?? 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                        <span style={{ fontSize: '0.65rem', marginLeft: '4px', color: 'var(--brand-400)', textTransform: 'uppercase' }}>{readyUnit}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${sc.badge}`}>{sc.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                          <button
                            className="row-action-btn view"
                            onClick={() => navigate(`/delivery-orders/${order.id}`)}
                          >
                            <Eye size={13} />
                            View
                          </button>
                          {order.status === 'completed' && (
                            <button
                              className="row-action-btn view"
                              style={{ color: 'var(--brand-600)', backgroundColor: 'var(--brand-50)' }}
                              onClick={() => navigate(`/delivery-orders/edit/${order.id}`)}
                            >
                              <FileEdit size={13} />
                              Edit
                            </button>
                          )}
                           {canDelete && (
                            <button
                              className="icon-btn danger"
                              title="Delete Order"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          {/* Pagination Footer */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <span className="text-xs font-bold text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-100 rounded-lg shadow-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}