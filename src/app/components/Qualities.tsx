import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Search, Loader2, AlertCircle } from 'lucide-react';
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
      console.error("Failed to fetch qualities", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualities();
  }, []);

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
      alert(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this quality?")) return;
    try {
      await qualityService.deleteQuality(id);
      fetchQualities();
    } catch (error) {
      alert("Failed to delete quality");
    }
  };

  const filteredQualities = qualities.filter(q => 
    q.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Fabric Qualities</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage standard qualities for gray lots</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setQualityName('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          Add New Quality
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search qualities..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredQualities.length} Total Records</p>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-xs font-black uppercase tracking-widest leading-none">Fetching qualities...</p>
            </div>
          ) : filteredQualities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredQualities.map((q) => (
                <div key={q.id} className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between">
                  <span className="font-bold text-gray-800">{q.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(q.id);
                        setQualityName(q.name);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <AlertCircle size={48} className="opacity-10 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No qualities found</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                {editingId ? 'Edit Quality' : 'Add New Quality'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quality Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Cotton Latha, Wash n Wear"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800"
                  value={qualityName}
                  onChange={(e) => setQualityName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : (editingId ? 'UPDATE QUALITY' : 'CREATE QUALITY')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-black tracking-widest hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
