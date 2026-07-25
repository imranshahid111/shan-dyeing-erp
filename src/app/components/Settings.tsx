import { confirmDialog } from "../utils/confirmDialog";
import React, { useState, useRef } from 'react';
import { Database, AlertTriangle, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleRestore = async () => {
    if (!file) return;

    if (!await confirmDialog('WARNING: This action is DESTRUCTIVE. It will completely overwrite the existing database with the data from the uploaded file. Are you absolutely sure you want to proceed?')) {
      return;
    }

    setIsUploading(true);
    setStatus('idle');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('database', file);

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
              onClick={handleRestore}
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
    </div>
  );
}
