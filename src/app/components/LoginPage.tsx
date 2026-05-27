import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Package, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%',
        width: '45%', height: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-10%',
        width: '45%', height: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '900px',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
        position: 'relative', zIndex: 10,
        animation: 'dialogIn 0.4s ease both',
      }}>
        
        {/* Left Branding Panel */}
        <div style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          padding: '3rem 2.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Overlay shine */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Top content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '3rem', height: '3rem', marginBottom: '2rem',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={22} color="white" />
            </div>
            <h2 style={{
              fontSize: '2.25rem', fontWeight: 800, color: 'white',
              lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0,
            }}>
              Shan Dyeing<br />Textile Industry
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              marginTop: '1rem', fontSize: '1rem', lineHeight: 1.6, margin: '1rem 0 0',
            }}>
              Developed by <span style={{ color: '#fff', fontWeight: 700 }}>Imran Shahid</span>
            </p>
          </div>

          {/* Feature bullets */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {['Gray lot & delivery order tracking', 'Billing, invoicing & payments', 'Customer ledger management'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form */}
        <div style={{
          padding: '3rem 2.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.625rem', fontWeight: 800, color: 'white',
              letterSpacing: '-0.02em', margin: '0 0 0.375rem',
            }}>Welcome back</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>
              Sign in to your ERP dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.625rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white',
                    fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 500,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,179,237,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  Password
                </label>
                {/* <a href="#" style={{ fontSize: '0.75rem', color: 'rgba(99,179,237,0.8)', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </a> */}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 2.875rem 0.75rem 2.625rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white',
                    fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 500,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,179,237,0.6)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '0.875rem',
                background: isLoading ? 'rgba(37,99,235,0.5)' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '0.9375rem', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: 'inherit',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                transition: 'all 0.2s',
                marginTop: '0.25rem',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
            textAlign: 'center', lineHeight: 1.5,
          }}>
            Shan Dyeing ERP &mdash; Developed by Imran Shahid
          </p>
        </div>
      </div>
    </div>
  );
}
