import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search, Loader2, AlertCircle, X, Tag } from 'lucide-react';
import { qualityService, QualityItem } from '../services/qualityService';

export default function Qualities() {
  const [qualities, setQualities] = useState<QualityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [qualityName, setQualityName] = useState('');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQualities = async () => {
    try {
      setLoading(true);
      const res = await qualityService.getQualities();
      setQualities(res as any);
    } catch (error) {
      console.error('Failed to fetch qualities', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQualities(); }, []);

  const openModal = (id?: number, name?: string) => {
    setEditingId(id ?? null);
    setQualityName(name ?? '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qualityName.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (editingId) {
        await qualityService.updateQuality(editingId, qualityName);
      } else {
        await qualityService.createQuality(qualityName);
      }
      setShowModal(false);
      setQualityName('');
      setEditingId(null);
      fetchQualities();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quality?')) return;
    try {
      await qualityService.deleteQuality(id);
      fetchQualities();
    } catch (error) {
      alert('Failed to delete quality');
    }
  };

  const filteredQualities = qualities.filter(q =>
    q.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Fabric Qualities</h2>
          <p>Manage standard quality types for gray lots</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} />
          Add Quality
        </button>
      </div>

      {/* Card */}
      <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div className="card-header">
          <div className="search-bar" style={{ maxWidth: '18rem' }}>
            <Search className="search-bar-icon" size={16} />
            <input
              type="text"
              placeholder="Search qualities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="badge badge-gray">{filteredQualities.length} Records</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '1.25rem' }}>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Fetching qualities...</p>
            </div>
          ) : filteredQualities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Tag size={26} /></div>
              <p className="empty-state-title">No Qualities Found</p>
              <p className="empty-state-desc">Add fabric quality types to use when creating gray lots.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => openModal()}>
                <Plus size={15} /> Add Quality
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              {filteredQualities.map(q => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1rem',
                    background: 'var(--gray-25)',
                    border: '1.5px solid var(--gray-150)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-300)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--brand-50)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray-150)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--gray-25)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem' }}>{q.name}</span>
                  <div style={{ display: 'flex', gap: '0.125rem' }}>
                    <button className="icon-btn primary" onClick={() => openModal(q.id, q.name)} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(q.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '22rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Quality' : 'Add New Quality'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <label className="form-label">Quality Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  className="input-field"
                  placeholder="e.g. Cotton Latha, Wash n Wear"
                  value={qualityName}
                  onChange={e => setQualityName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Quality' : 'Create Quality'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
