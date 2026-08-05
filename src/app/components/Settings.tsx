import { confirmDialog } from "../utils/confirmDialog";
import React, { useState, useRef, useEffect } from 'react';
import { Database, AlertTriangle, Upload, CheckCircle2, XCircle, Loader2, Network } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCustomServerIpRaw, setCustomServerIp, getRuntimeConfig } from '../config/runtimeConfig';
import { toast } from 'sonner';


export default function Settings() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [serverIp, setServerIp] = useState(getCustomServerIpRaw() || '');
  const [activeApiUrl, setActiveApiUrl] = useState('');

  useEffect(() => {
    getRuntimeConfig().then(config => {
      setActiveApiUrl(config.apiBaseUrl);
    });
  }, []);

  const handleSaveServerIp = () => {
    setCustomServerIp(serverIp);
    toast.success('Server connection settings updated. Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleInitiateRestore = async () => {
    if (!file) return;

    if (!await confirmDialog('WARNING: This action is DESTRUCTIVE. It will completely overwrite the existing database with the data from the uploaded file. Are you absolutely sure you want to proceed?')) {
      return;
    }

    setPassword('');
    setShowPasswordModal(true);
  };

  const handleConfirmRestore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setErrorMessage('Password is required');
      return;
    }

    setShowPasswordModal(false);
    setIsUploading(true);
    setStatus('idle');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('database', file!);
    formData.append('password', password);

    try {
      const token = getToken ? getToken() : localStorage.getItem('erp_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      
      const response = await fetch(`${apiUrl}/database/restore`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to restore database');
      }

      setStatus('success');
      setFile(null);
      setPassword('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Optionally reload the page after a few seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during database restoration.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)' }}>System Settings</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Manage application configuration and database.</p>
      </div>

      {/* Server IP Settings Card */}
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        border: '1px solid var(--gray-200)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            background: 'rgba(59, 130, 246, 0.1)',
            color: 'rgb(59, 130, 246)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Network size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Server Connection Settings</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', margin: 0, marginTop: '2px' }}>Configure the backend server IP address or base API URL.</p>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '30rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Server IP / Base API URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100 or localhost"
                  value={serverIp}
                  onChange={e => setServerIp(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.625rem 0.875rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveServerIp}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: 'var(--brand-500, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: 1.4, margin: '0.5rem 0 0' }}>
                Enter the IP address of the local system hosting the database/server (e.g. <code>192.168.1.100</code>). 
                If left empty, the application will try to automatically detect the IP in your local network.
              </p>
            </div>
            
            {/* Show currently active URL */}
            <div style={{ 
              background: 'var(--gray-50)', 
              borderRadius: '8px', 
              padding: '0.75rem 1rem', 
              border: '1px solid var(--gray-200)',
              fontSize: '0.8125rem',
              color: 'var(--gray-600)'
            }}>
              Active API Endpoint: <strong style={{ color: 'var(--gray-900)', fontFamily: 'monospace' }}>{activeApiUrl}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        border: '1px solid var(--gray-200)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'rgb(239, 68, 68)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Database size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Database Restoration</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', margin: 0, marginTop: '2px' }}>Upload a .sql backup file to replace the current database.</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          
          <div style={{
            background: 'rgba(254, 242, 242, 1)',
            border: '1px solid rgba(252, 165, 165, 1)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <AlertTriangle size={24} color="rgb(220, 38, 38)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ color: 'rgb(153, 27, 27)', fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.25rem 0' }}>Destructive Action Warning</h4>
              <p style={{ color: 'rgb(185, 28, 28)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                Restoring a database will completely erase all current data and replace it with the data contained in the uploaded file. Please ensure you have downloaded a recent backup before proceeding. This action cannot be undone.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '30rem' }}>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '2rem', border: '2px dashed var(--gray-300)', borderRadius: '12px',
              cursor: 'pointer', transition: 'all 0.2s',
              background: 'var(--gray-50)',
              ...(file ? { borderColor: 'var(--brand-500)', background: 'rgba(59, 130, 246, 0.05)' } : {})
            }}>
              <Upload size={32} color={file ? 'var(--brand-500)' : 'var(--gray-400)'} style={{ marginBottom: '1rem' }} />
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                {file ? file.name : 'Click to select .sql file'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                Only .sql files are supported
              </span>
              <input 
                type="file" 
                accept=".sql" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
            </label>

            {status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'rgb(220, 38, 38)', fontSize: '0.875rem', background: 'rgba(254, 242, 242, 1)', padding: '0.75rem', borderRadius: '8px' }}>
                <XCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {status === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgb(22, 163, 74)', fontSize: '0.875rem', background: 'rgba(240, 253, 244, 1)', padding: '0.75rem', borderRadius: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Database successfully restored! Reloading application...</span>
              </div>
            )}

            <button
              onClick={handleInitiateRestore}
              disabled={!file || isUploading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: (!file || isUploading) ? 'var(--gray-300)' : 'rgb(220, 38, 38)',
                color: 'white', border: 'none', borderRadius: '8px',
                padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600,
                cursor: (!file || isUploading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '0.5rem'
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Restoring Database...
                </>
              ) : (
                <>
                  <Database size={18} />
                  Restore Database
                </>
              )}
            </button>
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .spin { animation: spin 1s linear infinite; }
            `}</style>
          </div>

        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="flex items-center gap-2 text-gray-900" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                <Database size={20} color="#dc2626" /> Security Verification
              </h3>
              <button className="modal-close-btn" onClick={() => setShowPasswordModal(false)}>
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmRestore}>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Please enter your password to authorize replacing the database.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9375rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', borderRadius: '0 0 1rem 1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={!password}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: !password ? '#fca5a5' : '#dc2626',
                    color: 'white',
                    fontWeight: 600,
                    cursor: !password ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm & Restore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
