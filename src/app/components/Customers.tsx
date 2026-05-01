import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit, Trash2, Search, Eye, Phone } from 'lucide-react';
import { customerService } from '../services/customerService';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  outstanding: number;
  customerCode: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const response = await customerService.getCustomers(searchTerm, 1, 60);
        const mapped = response.data.map((item) => ({
          id: String(item.id),
          name: item.name,
          mobile: item.phone,
          address: item.city || '-',
          outstanding: Number(item.outstanding_amount || 0),
          customerCode: item.customer_code,
        }));
        setCustomers(mapped);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [searchTerm]);

  const filteredCustomers = useMemo(() => customers, [customers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/customers/new')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-semibold"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-gray-700">Customer Code</th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-gray-700">Company Name</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">City / Address</th>
                <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:text-gray-700">Outstanding</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Loading customers...
                  </td>
                </tr>
              )}
              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No customers found matching your search.
                  </td>
                </tr>
              )}
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/customers/view/${customer.id}`)}
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
                      {customer.customerCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      {customer.mobile}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm max-w-[200px] truncate">
                    {customer.address}
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600 text-right">
                    Rs {customer.outstanding.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => navigate(`/customers/view/${customer.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Ledger"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => navigate(`/customers/edit/${customer.id}`)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
