import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { 
  LayoutDashboard, Package, Truck, FileText, ClipboardCheck, Users, 
  CreditCard, BarChart3, Bell, Search, ArrowLeft, RefreshCw, 
  LogOut, History, Wallet, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { path: '/gray-lots', label: 'Gray Lots', icon: Package, section: 'operations' },
  { path: '/delivery-orders', label: 'Delivery Orders', icon: Truck, section: 'operations' },
  { path: '/billing', label: 'Billing / Invoices', icon: FileText, section: 'operations' },
  { path: '/payments', label: 'Payments & Ledger', icon: Wallet, section: 'operations' },
  { path: '/customers', label: 'Customers', icon: Users, section: 'management' },
  { path: '/qualities', label: 'Fabric Qualities', icon: ClipboardCheck, section: 'management' },
  { path: '/gate-pass', label: 'Gate Pass', icon: ClipboardCheck, section: 'management' },
  { path: '/staff', label: 'Staff', icon: Users, section: 'management' },
  { path: '/activity-logs', label: 'Activity Logs', icon: History, section: 'system' },
  { path: '/reports', label: 'Reports', icon: BarChart3, section: 'system' },
];

const sections = [
  { key: 'main',       label: null },
  { key: 'operations', label: 'Operations' },
  { key: 'management', label: 'Management' },
  { key: 'system',     label: 'System' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  let userData = { name: 'Admin User', email: 'admin@textile.com' };
  try {
    const saved = localStorage.getItem('erp_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.name) userData = parsed;
    }
  } catch { /* silent */ }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const currentLabel = navItems.find(
    (item) => item.path === '/' 
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
  )?.label ?? 'Overview';

  const initials = userData.name.substring(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--gray-50)' }}>
      
      {/* ── Sidebar ── */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'linear-gradient(180deg, var(--sidebar-bg-from) 0%, var(--sidebar-bg-to) 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 20,
        position: 'relative',
      }}>

        {/* Subtle top accent line */}
        {/* <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, var(--brand-500), var(--accent-500))',
          flexShrink: 0,
        }} /> */}

        {/* Logo */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem',
              background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--accent-500) 100%)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
              flexShrink: 0,
            }}>
              <Package size={16} color="white" />
            </div>
            <div>
              <p style={{
                fontSize: '0.9375rem', fontWeight: 800, color: 'white',
                letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>Shan Dyeing</p>
              <p style={{
                fontSize: '0.6rem', fontWeight: 700, color: 'var(--brand-400)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Enterprise ERP</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll" style={{
          flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem',
        }}>
          {sections.map(({ key, label }) => {
            const items = navItems.filter(i => i.section === key);
            if (!items.length) return null;
            return (
              <div key={key} style={{ marginBottom: '0.25rem' }}>
                {label && (
                  <p style={{
                    fontSize: '0.5625rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.25)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    padding: '0.75rem 0.75rem 0.375rem',
                  }}>{label}</p>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <ChevronRight size={13} style={{ opacity: 0.5 }} />}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '0.875rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 800, color: 'white',
            }}>{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{
                fontSize: '0.8125rem', fontWeight: 700, color: 'white',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{userData.name}</p>
              <p style={{
                fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{userData.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                flexShrink: 0, width: '1.875rem', height: '1.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(239,68,68,0.1)',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                color: 'rgba(252,165,165,0.9)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.25)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(252,165,165,0.9)';
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{
          background: 'rgba(255,255,255,0.98)',
          borderBottom: '1px solid var(--gray-150)',
          padding: '0 1.75rem',
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 1px 0 rgba(0,0,0,0.05)',
        }}>

          {/* Left: nav controls + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Nav buttons */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              background: 'var(--gray-50)', border: '1px solid var(--gray-150)',
              borderRadius: '10px', padding: '3px',
            }}>
              <button
                onClick={() => navigate(-1)}
                title="Go Back"
                style={{
                  width: '1.75rem', height: '1.75rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', borderRadius: '7px',
                  cursor: 'pointer', color: 'var(--gray-500)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'white';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand-600)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-500)';
                }}
              >
                <ArrowLeft size={15} />
              </button>
              <button
                onClick={() => navigate(0)}
                title="Reload"
                style={{
                  width: '1.75rem', height: '1.75rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', borderRadius: '7px',
                  cursor: 'pointer', color: 'var(--gray-500)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'white';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand-600)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-500)';
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '1.25rem', background: 'var(--gray-200)' }} />

            {/* Page title */}
            <div>
              <h1 style={{
                fontSize: '0.9375rem', fontWeight: 800, color: 'var(--gray-900)',
                letterSpacing: '-0.01em', margin: 0,
              }}>{currentLabel}</h1>
              <p style={{
                fontSize: '0.6875rem', color: 'var(--gray-400)',
                fontWeight: 600, letterSpacing: '0.04em',
                textTransform: 'uppercase', marginTop: '1px',
              }}>
                Welcome back, {userData.name.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Right: search + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--gray-50)', border: '1.5px solid var(--gray-150)',
              borderRadius: '10px', padding: '0.375rem 0.75rem',
              width: '13rem',
              transition: 'all var(--transition-fast)',
            }}
              onFocusCapture={e => {
                e.currentTarget.style.borderColor = 'var(--brand-400)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
              }}
              onBlurCapture={e => {
                e.currentTarget.style.borderColor = 'var(--gray-150)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Search size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-700)',
                  width: '100%', fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Bell */}
            <button
              style={{
                width: '2.125rem', height: '2.125rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--gray-50)', border: '1.5px solid var(--gray-150)',
                borderRadius: '10px', cursor: 'pointer', position: 'relative',
                color: 'var(--gray-500)', transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'white';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-150)';
              }}
            >
              <Bell size={16} />
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '6px', height: '6px',
                background: 'var(--brand-500)', borderRadius: '50%',
                border: '1.5px solid white',
              }} />
            </button>

            {/* Divider */}
            <div style={{ width: '1px', height: '1.5rem', background: 'var(--gray-200)' }} />

            {/* User badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-800)', lineHeight: 1.2,
                }}>{userData.name}</p>
                <p style={{
                  fontSize: '0.625rem', color: 'var(--gray-400)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div style={{
                width: '2.125rem', height: '2.125rem',
                background: 'linear-gradient(135deg, var(--gray-800), var(--gray-900))',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem', fontWeight: 800, color: 'white',
                boxShadow: 'var(--shadow-md)',
              }}>{initials}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="sidebar-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: 'var(--page-padding)' }}
        >
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
