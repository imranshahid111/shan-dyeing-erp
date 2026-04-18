import { Outlet, Link, useLocation } from 'react-router';
import { LayoutDashboard, Package, Truck, FileText, ClipboardCheck, Users, CreditCard, BarChart3, Bell, Search, Menu } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/gray-lots', label: 'Gray Lot Management', icon: Package },
  { path: '/delivery-orders', label: 'Delivery Orders', icon: Truck },
  { path: '/billing', label: 'Billing / Invoices', icon: FileText },
  { path: '/gate-pass', label: 'Gate Pass', icon: ClipboardCheck },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col shadow-2xl">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Package className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SHAN DYEING ERP</h1>
              <p className="text-xs text-slate-400">Dyeing Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">AD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-400">admin@textile.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                <Menu size={20} className="text-gray-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Welcome back, Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>
              {/* Notifications */}
              <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {/* Date & Avatar */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <span className="text-sm text-gray-600 hidden sm:block">April 18, 2026</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">AD</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
