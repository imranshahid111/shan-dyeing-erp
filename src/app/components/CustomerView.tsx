import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  User, 
  FileText, 
  History as HistoryIcon, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar
} from 'lucide-react';

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
];

interface LedgerEntry {
  id: string;
  date: string;
  type: 'Invoice' | 'Payment';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

const mockLedger: LedgerEntry[] = [
  { id: '1', date: '2026-04-01', type: 'Invoice', reference: 'INV-2026-001', debit: 60000, credit: 0, balance: 60000 },
  { id: '2', date: '2026-04-05', type: 'Payment', reference: 'PYM-10045', debit: 0, credit: 20000, balance: 40000 },
  { id: '3', date: '2026-04-10', type: 'Invoice', reference: 'INV-2026-045', debit: 12000, credit: 0, balance: 52000 },
];

export default function CustomerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'history'>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // In a real app, fetch from API. Mocking for now:
    const found = mockCustomers.find(c => c.id === id) || mockCustomers[0];
    setCustomer(found);
  }, [id]);

  if (!customer) return <div className="p-8 text-center">Loading customer details...</div>;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/customers')}
            className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-100 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{customer.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium text-xs">Customer ID: {customer.id}</span>
              <span>•</span>
              <span>{customer.contactPerson}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/customers/edit/${customer.id}`)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            Edit Profile
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-500/20">
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Outstanding</span>
            <Wallet className="text-red-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{customer.outstanding.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
            <ArrowUpRight size={14} />
            <span>12% from last month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Billed</span>
            <ArrowUpRight className="text-blue-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">₹7,52,000</p>
          <div className="flex items-center gap-1 text-xs text-blue-600 mt-2 font-medium">
            <span>24 Total Invoices</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Paid</span>
            <ArrowDownLeft className="text-green-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-800">₹7,00,000</p>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-2 font-medium">
            <span>Last Payment: 5 days ago</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-8 py-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'overview' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            <User size={18} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-8 py-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'ledger' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            <FileText size={18} />
            Ledger
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-8 py-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'history' 
                ? 'border-blue-600 text-blue-600 bg-white' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            <HistoryIcon size={18} />
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Building2 size={16} className="text-blue-500" />
                    Business Details
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Legal Name</span>
                      <span className="text-sm font-medium text-gray-800">{customer.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500">GSTIN</span>
                      <span className="text-sm font-medium text-gray-800 uppercase">{customer.gstNo}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Opening Balance</span>
                      <span className="text-sm font-medium text-gray-800">₹0.00</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    Address Information
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-700 leading-relaxed">{customer.address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Phone size={16} className="text-blue-500" />
                    Contact Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-800">{customer.mobile}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-800">{customer.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                  <h5 className="font-semibold mb-2">Customer Credit Limit</h5>
                  <p className="text-xs text-slate-400 mb-4">Set a maximum credit limit for this customer to manage risk.</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold">₹5,00,000</span>
                    <span className="text-xs text-slate-400">10% Used</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full w-[10%]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-800">Financial Statement</h4>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <Calendar size={16} />
                    This Quarter
                  </button>
                  <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">
                    Download PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Debit (₹)</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit (₹)</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockLedger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            entry.type === 'Invoice' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{entry.reference}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-800">
                          {entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                <HistoryIcon size={32} />
              </div>
              <h4 className="text-lg font-semibold text-gray-700">No Process History</h4>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
                Transaction history is recorded after the first process lot is completed for this customer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
