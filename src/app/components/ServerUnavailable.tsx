import { RefreshCcw, ServerCrash, Wifi } from 'lucide-react';
import { useServerStatus } from '../hooks/useServerStatus';

export default function ServerUnavailable() {
  const { status, lastErrorMessage } = useServerStatus();

  if (status === 'connected') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.92)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '2.5rem',
        textAlign: 'center',
        boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        animation: 'dialogIn 0.3s ease both',
      }}>
        {/* Icon */}
        <div style={{
          width: '4rem', height: '4rem',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <ServerCrash size={28} style={{ color: '#f87171' }} />
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.25rem', fontWeight: 800, color: 'white',
          margin: '0 0 0.625rem', letterSpacing: '-0.01em',
        }}>
          Server Unavailable
        </h2>
        <p style={{
          fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.6, margin: '0 0 1.25rem',
        }}>
          Cannot reach the LAN server. Make sure the server machine is online and the API is accessible.
        </p>

        {/* Error message */}
        {lastErrorMessage && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(252,165,165,0.8)',
              fontFamily: 'monospace',
              margin: 0, lineHeight: 1.5,
              wordBreak: 'break-all',
            }}>
              {lastErrorMessage}
            </p>
          </div>
        )}

        {/* Retry button */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'}
        >
          <RefreshCcw size={17} />
          Retry Connection
        </button>
      </div>
    </div>
  );
}
