import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Truck, FileText, ClipboardCheck, Users, 
  CreditCard, BarChart3, Bell, Search, ArrowLeft, RefreshCw, 
  LogOut, History, Wallet, ChevronRight, Database, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main', privilegeKey: 'can_view_dashboard' },
  { path: '/gray-lots', label: 'Gray Lots', icon: Package, section: 'operations', privilegeKey: 'can_view_gray_lots' },
  { path: '/return-lots', label: 'Return Lots', icon: RefreshCw, section: 'operations', privilegeKey: 'can_view_gray_lots' },
  { path: '/delivery-orders', label: 'Delivery Orders', icon: Truck, section: 'operations', privilegeKey: 'can_view_delivery_orders' },
  { path: '/billing', label: 'Billing / Invoices', icon: FileText, section: 'operations', privilegeKey: 'can_view_billing' },
  { path: '/payments', label: 'Payments', icon: Wallet, section: 'operations', privilegeKey: 'can_view_payments' },
  { path: '/customers', label: 'Customers', icon: Users, section: 'management', privilegeKey: 'can_view_customers' },
  { path: '/qualities', label: 'Fabric Qualities', icon: ClipboardCheck, section: 'management', privilegeKey: 'can_view_qualities' },
  { path: '/gate-pass', label: 'Gate Pass', icon: ClipboardCheck, section: 'management', privilegeKey: 'can_view_gate_pass' },
  { path: '/staff', label: 'Staff', icon: Users, section: 'management', privilegeKey: 'can_view_staff' },
  { path: '/activity-logs', label: 'Activity Logs', icon: History, section: 'system', privilegeKey: 'can_view_activity_logs' },
  { path: '/reports', label: 'Reports', icon: BarChart3, section: 'system', privilegeKey: 'can_view_reports' },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch { /* silent */ }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  let userData = { name: 'Admin User', email: 'admin@textile.com', role: 'admin', privileges: {} as any };
  try {
    const saved = localStorage.getItem('erp_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) {
        userData = {
          name: parsed.full_name || parsed.name || 'Admin User',
          email: parsed.email || 'admin@textile.com',
          role: parsed.role || 'admin',
          privileges: parsed.privileges || {}
        };
      }
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
  const isAdmin = userData.role === 'admin';
  const privileges: any = userData.privileges || {};

  return (
    <TooltipProvider delayDuration={0}>
    <div style={{ display: 'flex', height: '100vh', background: 'var(--gray-50)' }}>
      
      {/* ── Sidebar ── */}
      <aside
        className="app-sidebar"
        data-collapsed={sidebarCollapsed}
        style={{
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
          padding: '1.25rem 1.25rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div className="sidebar-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div onClick={()=>navigate('/')} style={{
              width: '2.25rem', height: '2.25rem',
              background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--accent-500) 100%)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
              flexShrink: 0,
            }}>
              <Package size={16} color="white" />
            </div>
            <div onClick={()=>navigate('/')} className="sidebar-brand-text" style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.9375rem', fontWeight: 800, color: 'white',
                letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>Shan Dyeing</p>
              <p style={{
                fontSize: '0.6rem', fontWeight: 700, color: 'var(--brand-400)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Enterprise ERP</p>
            </div>
            {!sidebarCollapsed && (
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
          {sidebarCollapsed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                title="Expand sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll sidebar-nav" style={{
          flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem',
        }}>
          {sections.map(({ key, label }) => {
            const items = navItems.filter(i => {
              if (i.section !== key) return false;
              if (isAdmin) return true;
              return !!privileges[i.privilegeKey];
            });
            if (!items.length) return null;
            return (
              <div key={key} style={{ marginBottom: '0.25rem' }}>
                {label && (
                  <p className="sidebar-section-label" style={{
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

                  const linkEl = (
                    <Link
                      to={item.path}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span className="nav-item-label" style={{ flex: 1 }}>{item.label}</span>
                      {isActive && !sidebarCollapsed && (
                        <ChevronRight size={13} className="nav-item-chevron" style={{ opacity: 0.5 }} />
                      )}
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.path}>{linkEl}</div>;
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
          <div className="sidebar-user-row" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 800, color: 'white',
            }}>{initials}</div>
            <div className="sidebar-user-text" style={{ flex: 1, overflow: 'hidden' }}>
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
              className="sidebar-logout-btn"
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

            {/* Database Download Button */}
            <button
              title="Download Database Backup"
              onClick={() => {
                const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/database/backup`;
                // Use an invisible iframe to avoid blank tab and prevent losing app state on error
                let iframe = document.getElementById('db-download-iframe') as HTMLIFrameElement;
                if (!iframe) {
                  iframe = document.createElement('iframe');
                  iframe.id = 'db-download-iframe';
                  iframe.style.display = 'none';
                  document.body.appendChild(iframe);
                }
                iframe.src = url;
              }}
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
              <Database size={16} />
            </button>

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
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', position: 'relative' }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              tabIndex={0}
              onBlur={() => setTimeout(() => setIsProfileOpen(false), 150)}
            >
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
              
              {isProfileOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0,
                  background: 'white', border: '1px solid var(--gray-200)',
                  borderRadius: '10px', padding: '0.5rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 50, minWidth: '120px'
                }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', background: 'transparent', border: 'none',
                      borderRadius: '6px', cursor: 'pointer', color: 'var(--gray-700)',
                      fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-900)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-700)';
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
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
    </TooltipProvider>
  );
}
