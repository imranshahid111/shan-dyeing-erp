import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Save, X, PlusCircle } from 'lucide-react';
import { grayLotService } from '../services/grayLotService';
import { customerService, CustomerItem } from '../services/customerService';
import { qualityService, QualityItem } from '../services/qualityService';
import { toast } from 'sonner';

interface GrayLot {
  id: string;
  entryDate: string;
  partyName: string;
  processType: string;
  biltiNo: string;
  lotNo: string;
  qualityId: string;
  quality?: any;
  measurement: string;
  than: number;
  gazana: number;
  notes: string;
}

export default function GrayLotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id && location.pathname.includes('/edit/');
  const isView = !!id && location.pathname.includes('/view/');

  const [formData, setFormData] = useState<Partial<GrayLot>>({
    entryDate: new Date().toISOString().split('T')[0],
    processType: 'Dyeing',
    measurement: 'Meter',
    lotNo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [qualities, setQualities] = useState<QualityItem[]>([]);

  // Refs for all form fields in order
  const entryDateRef = useRef<HTMLInputElement>(null);
  const partyNameRef = useRef<HTMLInputElement>(null);
  const processTypeRef = useRef<HTMLSelectElement>(null);
  const biltiNoRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLSelectElement>(null);
  const measurementRef = useRef<HTMLSelectElement>(null);
  const thanRef = useRef<HTMLInputElement>(null);
  const gazanaRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const fieldRefs = [
    entryDateRef,
    partyNameRef,
    processTypeRef,
    biltiNoRef,
    qualityRef,
    measurementRef,
    thanRef,
    gazanaRef,
    notesRef,
  ];

  useEffect(() => {
    if (id) {
      const loadLot = async () => {
        try {
          const res = await grayLotService.getGrayLot(id);
          setFormData({
            id: String(res.id),
            entryDate: res.entry_date || '',
            partyName: res.party_name || '',
            processType: res.process_type || 'Dyeing',
            biltiNo: res.bill_no || '',
            lotNo: res.lot_no || '',
            qualityId: String(res.quality_id || ''),
            measurement: res.measurement || 'Meter',
            than: res.than || 0,
            gazana: res.gazana || 0,
            notes: res.notes || '',
          });
        } catch (error) {
          console.error("Failed to load gray lot details", error);
          setSubmitError("Failed to load gray lot details.");
        }
      };
      loadLot();
    }
  }, [id]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [custRes, qualRes] = await Promise.all([
          customerService.getCustomers('', 1, 1000),
          qualityService.getQualities()
        ]);
        setCustomers(custRes.data);
        setQualities(qualRes as any);
      } catch (error) {
        console.error('Failed to load initial data', error);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!id) {
      const fetchNextLot = async () => {
        try {
          const res = await grayLotService.getNextLotNumber();
          setFormData(prev => ({ ...prev, lotNo: res.nextLotNo }));
        } catch (error) {
          console.error("Failed to fetch next lot number", error);
        }
      };
      fetchNextLot();
    }
  }, [id]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, fieldIndex: number) => {
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
    if (isView) return;
    if (!formData.partyName || !formData.qualityId || !formData.entryDate) {
      setSubmitError('Party name, fabric quality and entry date are required.');
      return;
    }

    try {
      setSubmitError('');
      setIsSubmitting(true);

      const payload = {
        entryDate: formData.entryDate,
        partyName: formData.partyName,
        processType: formData.processType || 'Dyeing',
        billNo: formData.biltiNo || '',
        lotNo: formData.lotNo || '',
        qualityId: Number(formData.qualityId),
        measurement: formData.measurement || 'Meter',
        than: Number(formData.than || 0),
        gazana: Number(formData.gazana || 0),
        notes: formData.notes || '',
      };

      if (isEdit && id) {
        await grayLotService.updateGrayLot(id, payload);
        toast.success('Gray Lot updated successfully!');
      } else {
        await grayLotService.createGrayLot(payload);
        toast.success('New Gray Lot added successfully!');
      }

      navigate('/gray-lots');
    } catch (error) {
      console.log(error);
      setSubmitError('Gray lot save failed. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isView ? 'View Gray Lot' : isEdit ? 'Edit Gray Lot' : 'Add New Gray Lot'}
          </h2>
          <p className="text-gray-500 mt-1">
            {isView ? `Viewing Lot No: ${formData.lotNo}` : isEdit ? `Modifying Lot No: ${formData.lotNo}` : 'Create a new entry for fabric processing'}
          </p>
        </div>
        <button
          onClick={() => navigate('/gray-lots')}
          className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-200 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="space-y-8">
          {/* Basic Info Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <PlusCircle size={20} />
              <h4 className="text-sm font-semibold uppercase tracking-wider">Basic Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
                <input
                  ref={entryDateRef}
                  disabled={isView}
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Name</label>
                <input
                  ref={partyNameRef}
                  disabled={isView}
                  list="party-list"
                  type="text"
                  placeholder="Search party..."
                  value={formData.partyName || ''}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                />
                <datalist id="party-list">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Process Type</label>
                <select
                  ref={processTypeRef}
                  disabled={isView}
                  value={formData.processType}
                  onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 2)}
                >
                  <option>Dyeing</option>
                  <option>Redyeing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bilti No</label>
                <input
                  ref={biltiNoRef}
                  disabled={isView}
                  type="text"
                  placeholder="Enter bilti number"
                  value={formData.biltiNo || ''}
                  onChange={(e) => setFormData({ ...formData, biltiNo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lot No</label>
                <input
                  type="text"
                  value={formData.lotNo || 'Fetching...'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-bold cursor-not-allowed"
                  disabled
                />
                {!isView && <p className="text-[10px] text-blue-500 mt-1 italic font-bold uppercase tracking-wider">Sequential Auto-Generated</p>}
              </div>
            </div>
          </section>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Fabric Details Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <PlusCircle size={20} />
              <h4 className="text-sm font-semibold uppercase tracking-wider">Fabric Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Name</label>
                <select
                  ref={qualityRef}
                  disabled={isView}
                  required
                  value={formData.qualityId || ''}
                  onChange={(e) => setFormData({ ...formData, qualityId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 4)}
                >
                  <option value="">Select Quality</option>
                  {qualities.map((q) => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Measurement</label>
                <select
                  ref={measurementRef}
                  disabled={isView}
                  value={formData.measurement}
                  onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 5)}
                >
                  <option>Meter</option>
                  <option>Yard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Than / Pieces</label>
                <input
                  ref={thanRef}
                  disabled={isView}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.than || ''}
                  onChange={(e) => setFormData({ ...formData, than: Math.max(0, Number(e.target.value)) })}
                  onKeyPress={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 6)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gazana</label>
                <input
                  ref={gazanaRef}
                  disabled={isView}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.gazana || ''}
                  onChange={(e) => setFormData({ ...formData, gazana: Math.max(0, Number(e.target.value)) })}
                  onKeyPress={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  onKeyDown={(e) => handleKeyDown(e, 7)}
                />
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">Additional Notes</label>
            <textarea
              ref={notesRef}
              disabled={isView}
              placeholder="Enter any additional details about this lot..."
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none disabled:bg-gray-50 disabled:text-gray-500"
              onKeyDown={(e) => handleKeyDown(e, 8)}
            ></textarea>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={() => navigate('/gray-lots')}
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              {isView ? 'Back' : 'Cancel'}
            </button>
            {!isView && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-semibold"
              >
                <Save size={20} />
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Gray Lot'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
