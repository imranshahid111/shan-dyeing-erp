import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import { grayLotService, GrayLotItem } from '../services/grayLotService';

export default function GrayLotManagement() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<GrayLotItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoading(true);
        const response = await grayLotService.getGrayLots(searchTerm);
        setLots(response.data);
      } catch (error) {
        console.error('Failed to load gray lots', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Gray Lot?')) return;
    try {
      await grayLotService.deleteGrayLot(id);
      setLots(prev => prev.filter(lot => lot.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete gray lot');
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
                    <td style={{ color: 'var(--gray-600)' }}>{lot.quality}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gray-700)' }}>
                      {lot.than}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-600)' }}>
                      {lot.gazana}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <button
                          className="icon-btn primary"
                          title="Edit Gray Lot"
                          onClick={() => navigate(`/gray-lots/edit/${lot.id}`)}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Delete Gray Lot"
                          onClick={() => handleDelete(lot.id)}
                        >
                          <Trash2 size={15} />
                        </button>
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
