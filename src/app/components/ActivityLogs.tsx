//@ts-nocheck
import { useEffect, useState } from 'react';
import { activityLogService, ActivityLogItem } from '../services/activityLogService';
import { History, Search, AlertCircle, Clock, Info, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const moduleColors: Record<string, string> = {
  Invoices: 'badge-green',
  Payments: 'badge-blue',
  GrayLots: 'badge-purple',
  'Delivery Orders': 'badge-orange',
  'Gate Pass': 'badge-orange',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchLogs = async (p = page, ps = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const res = await activityLogService.getActivityLogs(p, ps);
      setLogs(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, pageSize);
  }, [page, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase())
  );

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <History size={22} style={{ color: 'var(--brand-500)' }} />
            Activity Logs
          </h2>
          <p>Audit trail of all actions performed in the ERP</p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchLogs(page, pageSize)}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Card */}
      <div className="card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div className="card-header">
          <div className="search-bar" style={{ maxWidth: '24rem' }}>
            <Search className="search-bar-icon" size={16} />
            <input
              type="text"
              placeholder="Filter by module or action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-gray">{total.toLocaleString()} Total Events</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>Per page:</label>
              <select
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value))}
                style={{
                  fontSize: '0.8125rem',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  color: 'var(--gray-700)',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Scanning history...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                <AlertCircle size={24} style={{ color: '#b91c1c' }} />
              </div>
              <p className="empty-state-title" style={{ color: '#b91c1c' }}>Failed to Load Logs</p>
              <p className="empty-state-desc">{error}</p>
              <button className="btn btn-secondary" style={{ marginTop: '1.25rem' }} onClick={() => fetchLogs(page, pageSize)}>
                Try Again
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><History size={26} /></div>
              <p className="empty-state-title">No Activity Found</p>
              <p className="empty-state-desc">No log entries match your current filter.</p>
            </div>
          ) : (
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                        <Clock size={13} style={{ color: 'var(--gray-300)' }} />
                        {(() => {
                          const dateVal = log.created_at || log.createdAt;
                          if (!dateVal) return '—';
                          const d = new Date(dateVal);
                          return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        })()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${moduleColors[log.module] ?? 'badge-gray'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--brand-600)', fontSize: '0.8125rem', fontWeight: 600 }}>
                        <User size={13} />
                        {log.user_name || 'System'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ maxWidth: '20rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                        <Info size={13} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.details || '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && total > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--gray-100)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', margin: 0 }}>
              Showing <strong>{startRecord}</strong>–<strong>{endRecord}</strong> of <strong>{total.toLocaleString()}</strong> events
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(1)}
                disabled={page === 1}
                style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
              >
                «
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {/* Page number chips */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.375rem 0.625rem',
                      fontSize: '0.8125rem',
                      fontWeight: page === p ? 700 : 400,
                      borderRadius: '0.5rem',
                      border: page === p ? '1.5px solid var(--brand-500)' : '1px solid var(--gray-200)',
                      background: page === p ? 'var(--brand-50)' : 'white',
                      color: page === p ? 'var(--brand-600)' : 'var(--gray-600)',
                      cursor: 'pointer',
                      minWidth: '2rem',
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
