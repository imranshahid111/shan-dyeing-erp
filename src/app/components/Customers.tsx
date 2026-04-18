import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit, Trash2, Search, Eye, Phone } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  gstNo: string;
  outstanding: number;
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'ABC Textiles',
    contactPerson: 'Rajesh Kumar',
    mobile: '+91 98765 43210',
    email: 'rajesh@abctextiles.com',
    address: 'Mumbai, Maharashtra',
    gstNo: '27AAAAA1234A1Z5',
    outstanding: 52000,
  },
  {
    id: '2',
    name: 'XYZ Industries',
    contactPerson: 'Priya Sharma',
    mobile: '+91 98765 43211',
    email: 'priya@xyzind.com',
    address: 'Surat, Gujarat',
    gstNo: '24BBBBB5678B2Y4',
    outstanding: 38500,
  },
];

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="cursor-pointer flex-1"
                onClick={() => navigate(`/customers/view/${customer.id}`)}
              >
                <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{customer.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{customer.contactPerson}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => navigate(`/customers/edit/${customer.id}`)}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Customer"
                >
                  <Edit size={16} className="text-blue-600" />
                </button>
                <button 
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Customer"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm flex-1">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Phone size={14} />
                </div>
                <span>{customer.mobile}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Eye size={14} className="opacity-0" /> {/* Spacer */}
                  <span>📍</span>
                </div>
                <span className="line-clamp-1">{customer.address}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-[10px]">
                  GST
                </div>
                <span className="uppercase text-xs font-medium">{customer.gstNo}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 font-medium">Outstanding Bal.</span>
                <span className="font-bold text-red-600">₹{customer.outstanding.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => navigate(`/customers/view/${customer.id}`)}
                className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-semibold flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                View Profile & Ledger
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
