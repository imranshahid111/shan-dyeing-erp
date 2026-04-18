import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Save, X, UserPlus } from 'lucide-react';

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

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    gstNo: '',
  });

  // Refs for all form fields in order
  const nameRef = useRef<HTMLInputElement>(null);
  const contactPersonRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const gstNoRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const fieldRefs = [
    nameRef,
    contactPersonRef,
    mobileRef,
    emailRef,
    gstNoRef,
    addressRef,
  ];

  useEffect(() => {
    if (isEdit) {
      const customer = mockCustomers.find((c) => c.id === id);
      if (customer) {
        setFormData(customer);
      }
    }
  }, [id, isEdit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, fieldIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (fieldIndex < fieldRefs.length - 1) {
        fieldRefs[fieldIndex + 1].current?.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    console.log('Submitting Customer:', formData);
    alert(isEdit ? 'Customer updated successfully!' : 'New Customer added successfully!');
    navigate('/customers');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <p className="text-gray-500 mt-1">
            {isEdit ? `Modifying: ${formData.name}` : 'Create a new customer profile for billing and tracking'}
          </p>
        </div>
        <button
          onClick={() => navigate('/customers')}
          className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-200 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <UserPlus size={20} />
              <h4 className="text-sm font-semibold uppercase tracking-wider">Company Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="e.g., ABC Textiles Ltd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <input
                  ref={contactPersonRef}
                  type="text"
                  placeholder="Enter contact name"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  ref={gstNoRef}
                  type="text"
                  placeholder="Enter GSTIN"
                  value={formData.gstNo}
                  onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                  onKeyDown={(e) => handleKeyDown(e, 4)}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <Save size={20} className="text-gray-400" />
              <h4 className="text-sm font-semibold uppercase tracking-wider">Contact & Address</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  ref={mobileRef}
                  type="tel"
                  placeholder="+91 "
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 2)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <input
                  ref={addressRef}
                  type="text"
                  placeholder="Street, City, State, ZIP"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 5)}
                />
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={() => navigate('/customers')}
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-semibold"
            >
              <Save size={20} />
              {isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
