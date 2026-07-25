import React, { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AlertCircle, X } from 'lucide-react';

let confirmRoot: Root | null = null;
let confirmContainer: HTMLDivElement | null = null;

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!confirmContainer) {
      confirmContainer = document.createElement('div');
      document.body.appendChild(confirmContainer);
      confirmRoot = createRoot(confirmContainer);
    }

    const handleResolve = (result: boolean) => {
      if (confirmRoot) {
        confirmRoot.render(null);
      }
      resolve(result);
    };

    const DialogComponent = () => {
      useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') handleResolve(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
      }, []);

      return (
        <div className="modal-overlay" onClick={() => handleResolve(false)}>
          <div className="modal-dialog" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2 text-red-600" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertCircle size={20} /> Confirm Action
              </h3>
              <button className="modal-close-btn" onClick={() => handleResolve(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body p-5">
              <p className="text-gray-700 font-medium" style={{ color: '#374151', fontWeight: 500 }}>{message}</p>
            </div>
            <div className="modal-footer flex justify-end gap-3 p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => handleResolve(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ backgroundColor: '#dc2626', color: 'white' }} onClick={() => handleResolve(true)}>
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      );
    };

    confirmRoot!.render(<DialogComponent />);
  });
}
