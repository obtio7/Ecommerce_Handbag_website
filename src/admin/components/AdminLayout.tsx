import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Tag, Users, LogOut, Menu, X, FileText, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/coupons', label: 'Promo Codes', icon: Tag },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/refunds', label: 'Refunds', icon: RefreshCw },
];

const AdminLayout: React.FC = () => {
  const { logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-surface border-r border-border-tan
          flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Branding */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-tan">
          <h1 className="text-lg font-serif tracking-widest text-primary">
            ZAREVIELLE
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-text-dark/60 hover:text-text-dark"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-dark/70 hover:bg-primary/5 hover:text-text-dark'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="px-3 py-4 border-t border-border-tan">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-sm font-medium text-text-dark/70 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center px-4 py-3 bg-surface border-b border-border-tan">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-text-dark/70 hover:text-text-dark rounded-md"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <h1 className="ml-3 text-base font-serif tracking-widest text-primary">
            ZAREVIELLE
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
