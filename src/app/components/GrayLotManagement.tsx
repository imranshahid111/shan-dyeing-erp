import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
        console.error("Failed to load gray lots", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Gray Lot?")) return;
    
    try {
      await grayLotService.deleteGrayLot(id);
      setLots(prev => prev.filter(lot => lot.id !== id));
      alert("Gray Lot deleted successfully!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete gray lot");
      console.error("Delete error", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Lot No or Party Name..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/gray-lots/new')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Gray Lot
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot No</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Than</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gazana</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading lots...
                  </td>
                </tr>
              ) : lots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No lots found.
                  </td>
                </tr>
              ) : (
                lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{lot.lot_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{lot.entry_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{lot.party_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs ${lot.process_type === 'Dyeing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {lot.process_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{lot.quality}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{lot.than}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{lot.gazana}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/gray-lots/edit/${lot.id}`)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </button>
                        <button 
                          onClick={() => handleDelete(lot.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
