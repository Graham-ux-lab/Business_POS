import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Warehouse,
  Truck,
  ShoppingBag,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Store,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
  { name: 'Sales', href: '/sales', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const cashierNavigation = [
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'My Sales', href: '/sales', icon: BarChart3 },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigation = isAdmin ? adminNavigation : cashierNavigation;

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors dark:bg-gray-950 md:h-screen md:min-h-0">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside className={"fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 md:relative md:z-auto md:translate-x-0 " + (mobileMenuOpen ? 'translate-x-0 ' : '-translate-x-full ') + (sidebarOpen ? 'md:w-64' : 'md:w-20')}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-800">
          <div className={'flex items-center space-x-2 ' + (!sidebarOpen ? 'md:hidden' : '')}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">Business POS</span>
                <p className="text-xs text-slate-400 dark:text-slate-500">{user?.role}</p>
              </div>
          </div>
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => {
              if (window.matchMedia('(min-width: 768px)').matches) setSidebarOpen(!sidebarOpen);
              else setMobileMenuOpen(false);
            }}
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 md:block"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  'flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ' +
                  (active
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800')
                }
              >
                <Icon className={'w-5 h-5 flex-shrink-0 ' + (active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                <span className={!sidebarOpen ? 'md:hidden' : ''}>{item.name}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-gray-800 p-4 bg-slate-50 dark:bg-gray-950">
          <button
            onClick={toggleTheme}
            className={
              'w-full mb-3 flex items-center rounded-xl transition-colors bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 ' +
              (sidebarOpen ? 'justify-between px-3 py-2' : 'justify-center p-2 md:justify-center')
            }
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className={!sidebarOpen ? 'md:hidden text-sm font-semibold' : 'text-sm font-semibold'}>{isDark ? 'Light mode' : 'Dark mode'}</span>
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center justify-between">
              <div className={'flex min-w-0 items-center space-x-3 ' + (!sidebarOpen ? 'md:hidden' : '')}>
                <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-800 dark:text-white truncate w-32">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            <button
              onClick={logout}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto bg-slate-50 transition-colors dark:bg-gray-950">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden">
          <button type="button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <Store className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="truncate text-sm font-bold text-slate-800 dark:text-white">Business POS</span>
          </div>
          <span className="ml-auto truncate text-xs text-slate-500 dark:text-slate-400">{user?.fullName}</span>
        </div>
        <div className="min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
