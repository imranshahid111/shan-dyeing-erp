import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Edit, Trash2, Package, Loader2, Eye } from 'lucide-react';
import { grayLotService, GrayLotItem } from '../services/grayLotService';
import { toast } from 'sonner';

export default function GrayLotManagement() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<GrayLotItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [canDelete, setCanDelete] = useState(true);
  const [canEdit, setCanEdit] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoading(true);
        const response = await grayLotService.getGrayLots(searchTerm, currentPage, pageSize);
        setLots(response.data);
        setTotalItems(response.total);
        setTotalPages(Math.ceil(response.total / pageSize) || 1);
      } catch (error) {
        console.error('Failed to load gray lots', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();

    // Parse user privileges
    try {
      const saved = localStorage.getItem('erp_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin') {
          setCanDelete(true);
          setCanEdit(true);
        } else {
          setCanDelete(parsed.privileges?.can_delete ?? false);
          setCanEdit(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [searchTerm, currentPage]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Gray Lot?')) return;
    try {
      await grayLotService.deleteGrayLot(id);
      setLots(prev => prev.filter(lot => lot.id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete gray lot');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Gray Lot Management</h2>
          <p>{lots.length} lots in inventory</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/gray-lots/new')}>
          <Plus size={16} />
          New Gray Lot
        </button>
      </div>

      {/* Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="card-header">
          <div className="search-bar" style={{ maxWidth: '22rem' }}>
            <Search className="search-bar-icon" size={16} />
            <input
              type="text"
              placeholder="Search by lot no or party name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="badge badge-gray">{lots.length} Records</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading gray lots...</p>
            </div>
          ) : lots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={26} /></div>
              <p className="empty-state-title">No Gray Lots Found</p>
              <p className="empty-state-desc">Create your first gray lot to get started with inventory tracking.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/gray-lots/new')}>
                <Plus size={15} /> New Gray Lot
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lot No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Process</th>
                  <th>Quality</th>
                  <th style={{ textAlign: 'right' }}>Than</th>
                  <th style={{ textAlign: 'right' }}>Gazana</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 700,
                        color: 'var(--gray-900)', fontSize: '0.875rem',
                      }}>{lot.lot_no}</span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                      {lot.entry_date}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                        {lot.party_name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${lot.process_type === 'Dyeing' ? 'badge-blue' : 'badge-orange'}`}>
                        {lot.process_type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>
                      {lot.quality ? (typeof lot.quality === 'object' ? lot.quality.name : lot.quality) : 'Unknown'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gray-700)' }}>
                      {lot.than}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-600)' }}>
                      {lot.gazana}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <button
                          className="icon-btn"
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: 'none',
                            padding: '0.4rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                          title="View Gray Lot"
                          onClick={() => navigate(`/gray-lots/view/${lot.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <button
                            className="icon-btn primary"
                            title="Edit Gray Lot"
                            onClick={() => navigate(`/gray-lots/edit/${lot.id}`)}
                          >
                            <Edit size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="icon-btn danger"
                            title="Delete Gray Lot"
                            onClick={() => handleDelete(lot.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Pagination Footer */}
          {!loading && totalItems > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <span className="text-xs font-bold text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
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
