import { Package } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: '45%', height: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'pulse 2.5s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-10%',
        width: '45%', height: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'pulse 2.5s ease-in-out infinite 0.8s',
      }} />

      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem',
        animation: 'fadeIn 0.6s ease both',
      }}>
        {/* Logo */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: '-8px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))',
            borderRadius: '28px', filter: 'blur(16px)',
            animation: 'pulseGlow 2s ease-in-out infinite',
          }} />
          <div style={{
            position: 'relative',
            width: '80px', height: '80px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 40px rgba(59,130,246,0.35)',
          }}>
            <Package size={38} color="white" />
          </div>
        </div>

        {/* Branding */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '1.875rem', fontWeight: 800, color: 'white',
            letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
          }}>
            SHAN DYEING <span style={{ color: '#60a5fa' }}>ERP</span>
          </h1>
          <p style={{
            fontSize: '0.6875rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            marginTop: '0.5rem',
          }}>
            Smart Textile Solutions
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '160px', height: '3px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '100px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '100px',
            animation: 'progressBar 3s ease-out forwards',
          }} />
        </div>

        {/* Status */}
        <p style={{
          fontSize: '0.75rem', fontWeight: 500,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.05em',
          animation: 'pulse 2s ease-in-out infinite',
          margin: '-0.75rem 0 0',
        }}>
          Initializing secure environment...
        </p>
      </div>
    </div>
  );
}
