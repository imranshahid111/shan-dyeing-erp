import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Save, X, UserPlus, MapPin, Phone, Building } from 'lucide-react';
import { customerService } from '../services/customerService';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  outstanding: number;
}

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    mobile: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Refs for all form fields in order
  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const fieldRefs = [nameRef, mobileRef, addressRef];

  useEffect(() => {
    if (isEdit && id) {
      const loadCustomer = async () => {
        try {
          const res = await customerService.getCustomer(id);
          setFormData({
            id: String(res.id),
            name: res.name || '',
            mobile: res.phone || '',
            address: res.city || '',
            outstanding: Number(res.outstanding_amount || 0),
          });
        } catch (error) {
          console.error("Failed to load customer details", error);
          setSubmitError("Failed to load customer details.");
        }
      };
      loadCustomer();
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile) {
      setSubmitError('Company name and mobile number are required.');
      return;
    }

    try {
      setSubmitError('');
      setIsSubmitting(true);

      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address || '',
        outstanding: formData.outstanding || 0,
      };

      if (isEdit && id) {
        await customerService.updateCustomer(id, payload);
        toast.success('Customer updated successfully!');
      } else {
        const customerCode = `CUST-${Date.now().toString().slice(-6)}`;
        await customerService.createCustomer({
          customerCode,
          ...payload
        });
        toast.success('New Customer added successfully!');
      }
      navigate('/customers');
    } catch (error) {
      setSubmitError('Customer save failed. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <p className="text-gray-500 mt-1">
            {isEdit ? `Modifying profile for: ${formData.name}` : 'Create a new customer profile for billing and tracking'}
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
          
          {/* Company Details Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <UserPlus size={20} />
              <h4 className="text-sm font-semibold uppercase tracking-wider">Customer Profile</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company / Customer Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Building size={18} />
                  </div>
                  <input
                    ref={nameRef}
                    type="text"
                    required
                    placeholder="e.g., ABC Textiles Ltd."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 font-semibold"
                    onKeyDown={(e) => handleKeyDown(e, 0)}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile / Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input
                    ref={mobileRef}
                    type="tel"
                    required
                    placeholder="e.g., +92 300 1234567"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 font-semibold"
                    onKeyDown={(e) => handleKeyDown(e, 1)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City / Full Address</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin size={18} />
                  </div>
                  <input
                    ref={addressRef}
                    type="text"
                    placeholder="e.g., Faisalabad, Punjab"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 font-semibold"
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                  />
                </div>
              </div>
            </div>
          </section>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-semibold disabled:opacity-50"
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
