import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Save, X, PlusCircle } from 'lucide-react';

interface GrayLot {
  id: string;
  entryDate: string;
  partyName: string;
  processType: string;
  billNo: string;
  lotNo: string;
  quality: string;
  measurement: string;
  than: number;
  gazana: number;
  notes: string;
}

// Mock data (in a real app, this would come from an API)
const mockLots: GrayLot[] = [
  {
    id: '1',
    entryDate: '2026-04-15',
    partyName: 'ABC Textiles',
    processType: 'Dyeing',
    billNo: 'B-1001',
    lotNo: 'GL-2045',
    quality: 'Cotton 60s',
    measurement: 'Meter',
    than: 10,
    gazana: 250,
    notes: 'Premium quality batch',
  },
  {
    id: '2',
    entryDate: '2026-04-16',
    partyName: 'XYZ Industries',
    processType: 'Redyeing',
    billNo: 'B-1002',
    lotNo: 'GL-2046',
    quality: 'Polyester Blend',
    measurement: 'Yard',
    than: 8,
    gazana: 180,
    notes: 'Reprocess - color correction',
  },
];

export default function GrayLotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<GrayLot>>({
    entryDate: new Date().toISOString().split('T')[0],
    processType: 'Dyeing',
    measurement: 'Meter',
  });

  // Refs for all form fields in order
  const entryDateRef = useRef<HTMLInputElement>(null);
  const partyNameRef = useRef<HTMLInputElement>(null);
  const processTypeRef = useRef<HTMLSelectElement>(null);
  const billNoRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLInputElement>(null);
  const measurementRef = useRef<HTMLSelectElement>(null);
  const thanRef = useRef<HTMLInputElement>(null);
  const gazanaRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const fieldRefs = [
    entryDateRef,
    partyNameRef,
    processTypeRef,
    billNoRef,
    qualityRef,
    measurementRef,
    thanRef,
    gazanaRef,
    notesRef,
  ];

  useEffect(() => {
    if (isEdit) {
      const lot = mockLots.find((l) => l.id === id);
      if (lot) {
        setFormData(lot);
      }
    }
  }, [id, isEdit]);

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

  const handleSubmit = () => {
    // In a real app, you'd send formData to your API here
    console.log('Submitting:', formData);
    alert(isEdit ? 'Gray Lot updated successfully!' : 'New Gray Lot added successfully!');
    navigate('/gray-lots');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit Gray Lot' : 'Add New Gray Lot'}
          </h2>
          <p className="text-gray-500 mt-1">
            {isEdit ? `Modifying Lot No: ${formData.lotNo}` : 'Create a new entry for fabric processing'}
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
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Name</label>
                <input
                  ref={partyNameRef}
                  type="text"
                  placeholder="Search party..."
                  value={formData.partyName || ''}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Process Type</label>
                <select
                  ref={processTypeRef}
                  value={formData.processType}
                  onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  onKeyDown={(e) => handleKeyDown(e, 2)}
                >
                  <option>Dyeing</option>
                  <option>Redyeing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill No</label>
                <input
                  ref={billNoRef}
                  type="text"
                  placeholder="Enter bill number"
                  value={formData.billNo || ''}
                  onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lot No</label>
                <input
                  type="text"
                  value={formData.lotNo || 'Auto-generated'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>
          </section>

          {/* Fabric Details Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <PlusCircle size={20} />
              <h4 className="text-sm font-semibold uppercase tracking-wider">Fabric Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Name</label>
                <input
                  ref={qualityRef}
                  type="text"
                  placeholder="e.g., Cotton 60s"
                  value={formData.quality || ''}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 4)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Measurement</label>
                <select
                  ref={measurementRef}
                  value={formData.measurement}
                  onChange={(e) => setFormData({ ...formData, measurement: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
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
                  type="number"
                  placeholder="0"
                  value={formData.than || ''}
                  onChange={(e) => setFormData({ ...formData, than: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onKeyDown={(e) => handleKeyDown(e, 6)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gazana</label>
                <input
                  ref={gazanaRef}
                  type="number"
                  placeholder="0.00"
                  value={formData.gazana || ''}
                  onChange={(e) => setFormData({ ...formData, gazana: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
              placeholder="Enter any additional details about this lot..."
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              onKeyDown={(e) => handleKeyDown(e, 8)}
            ></textarea>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={() => navigate('/gray-lots')}
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-semibold"
            >
              <Save size={20} />
              {isEdit ? 'Save Changes' : 'Create Gray Lot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
