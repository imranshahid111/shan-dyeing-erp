//@ts-nocheck
import { useEffect, useState } from 'react';
import { activityLogService, ActivityLogItem } from '../services/activityLogService';
import { History, Search, AlertCircle, Clock, Info, User, RefreshCw } from 'lucide-react';

const moduleColors: Record<string, string> = {
  Invoices: 'badge-green',
  Payments: 'badge-blue',
  GrayLots: 'badge-purple',
  DeliveryOrders: 'badge-orange',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activityLogService.getActivityLogs();
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase())
  );

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
        <button className="btn btn-secondary" onClick={fetchLogs}>
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
          <span className="badge badge-gray">{filteredLogs.length} Events</span>
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
              <button className="btn btn-secondary" style={{ marginTop: '1.25rem' }} onClick={fetchLogs}>
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
      </div>
    </div>
  );
}
