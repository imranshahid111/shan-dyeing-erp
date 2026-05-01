import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Package, Truck, FileText, ClipboardCheck, Users, CreditCard, BarChart3, Bell, Search, Menu, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/gray-lots', label: 'Gray Lot Management', icon: Package },
  { path: '/delivery-orders', label: 'Delivery Orders', icon: Truck },
  { path: '/billing', label: 'Billing / Invoices', icon: FileText },
  { path: '/gate-pass', label: 'Gate Pass', icon: ClipboardCheck },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/staff', label: 'Staff Management', icon: Users },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Handle user data safely
  let userData = { name: "Admin User", email: "admin@textile.com" };
  try {
    const saved = localStorage.getItem('erp_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) {
        userData = parsed;
      }
    }
  } catch (e) {
    console.error("User parsing failed");
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col shadow-2xl relative">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Package className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight text-nowrap">SHAN DYEING</h1>
              <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">Enterprise ERP</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3 p-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 shadow-inner text-white font-black uppercase text-xs">
                {userData.name.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{userData.name}</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">{userData.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 shadow-sm shadow-red-500/20 shrink-0"
              title="Logout Account"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-8 py-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu size={20} className="text-gray-600" />
              </button>
              {/* Back & Reload Buttons */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all group"
                  title="Go Back"
                >
                  <ArrowLeft size={18} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                </button>
                <button
                  onClick={() => navigate(0)}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all group"
                  title="Reload Page"
                >
                  <RefreshCw size={16} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                </button>
              </div>
              <div className="border-l-2 border-slate-100 pl-4">
                <h2 className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent uppercase tracking-tight">
                  {navItems.find((item) => item.path === location.pathname)?.label || 'Overview'}
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5 font-black uppercase tracking-widest leading-none">Welcome back, {userData.name.split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl w-64 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Global Search..."
                  className="bg-transparent border-none outline-none text-xs font-bold w-full"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button className="relative p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl transition-all border border-gray-100">
                  <Bell size={20} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
                </button>
                
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                   <div className="text-right hidden xl:block">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-xs font-bold text-blue-600">Active Shift</p>
                   </div>
                   <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg border border-white/10">
                    <span className="text-xs font-black text-white">{userData.name.substring(0,2).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
