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
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigation = isAdmin ? adminNavigation : cashierNavigation;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 transition-colors">
      <aside className={"bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 shadow-sm transition-all duration-300 flex flex-col " + (sidebarOpen ? 'w-64' : 'w-20')}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">Business POS</span>
                <p className="text-xs text-slate-400 dark:text-slate-500">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                className={
                  'flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ' +
                  (active
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800')
                }
              >
                <Icon className={'w-5 h-5 flex-shrink-0 ' + (active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                {sidebarOpen && <span>{item.name}</span>}
                {active && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-gray-800 p-4 bg-slate-50 dark:bg-gray-950">
          <button
            onClick={toggleTheme}
            className={
              'w-full mb-3 flex items-center rounded-xl transition-colors bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 ' +
              (sidebarOpen ? 'justify-between px-3 py-2' : 'justify-center p-2')
            }
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {sidebarOpen && <span className="text-sm font-semibold">{isDark ? 'Light mode' : 'Dark mode'}</span>}
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
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
            )}
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

      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-gray-950 transition-colors">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
