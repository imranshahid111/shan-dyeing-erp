import { useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

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
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

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
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Add New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Company Name</label>
              <input
                type="text"
                placeholder="Enter company name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Contact Person</label>
              <input
                type="text"
                placeholder="Enter contact person"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Mobile</label>
              <input
                type="tel"
                placeholder="+91 "
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">GST No</label>
              <input
                type="text"
                placeholder="27AAAAA1234A1Z5"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Address</label>
              <input
                type="text"
                placeholder="City, State"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Save Customer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{customer.contactPerson}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit size={16} className="text-blue-600" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span>📱</span>
                <span>{customer.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>✉️</span>
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>📍</span>
                <span>{customer.address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>🏢</span>
                <span className="text-xs">{customer.gstNo}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Outstanding</span>
                <span className="font-semibold text-red-600">₹{customer.outstanding.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
