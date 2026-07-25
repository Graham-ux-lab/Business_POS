import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Clock, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

const COLORS = ['#059669', '#0d9488', '#2563eb', '#7c3aed', '#f97316'];

const emptyDashboard = {
  stats: {
    todaySales: 0,
    yesterdaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    lowStockItems: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
  },
  salesData: [],
  topProducts: [],
  recentTransactions: [],
  lowStockProducts: [],
};

const percentChange = (current, previous) => {
  if (!previous && !current) return '0.0%';
  if (!previous) return '+100%';
  const value = ((current - previous) / previous) * 100;
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const Dashboard = () => {
  const [range, setRange] = useState('weekly');
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/dashboard?range=${range}`);
      setDashboard({ ...emptyDashboard, ...(response.data.data || {}) });
    } catch {
      setDashboard(emptyDashboard);
    } finally {
      setLoading(false);
    }
  };

  const { stats, salesData, topProducts, recentTransactions, lowStockProducts } = dashboard;

  const statCards = [
    {
      title: "Today's Sales",
      value: `KES ${stats.todaySales.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-green-400 to-green-600',
      change: percentChange(stats.todaySales, stats.yesterdaySales),
      changeColor: stats.todaySales >= stats.yesterdaySales ? 'text-green-600' : 'text-red-600',
      trend: 'vs yesterday',
    },
    {
      title: 'Transactions',
      value: stats.todayTransactions.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      change: 'Today',
      changeColor: 'text-blue-600',
      trend: 'completed sales',
    },
    {
      title: 'Monthly Revenue',
      value: `KES ${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-purple-400 to-purple-600',
      change: percentChange(stats.monthlyRevenue, stats.lastMonthRevenue),
      changeColor: stats.monthlyRevenue >= stats.lastMonthRevenue ? 'text-green-600' : 'text-red-600',
      trend: 'vs last month',
    },
    {
      title: 'Low Stock Alert',
      value: `${stats.lowStockItems.toLocaleString()} items`,
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-red-400 to-red-600',
      change: stats.lowStockItems ? 'Needs restock' : 'All good',
      changeColor: stats.lowStockItems ? 'text-red-600' : 'text-green-600',
      trend: 'inventory',
    },
  ];

  const totalTopProductValue = topProducts.reduce((sum, product) => sum + product.value, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-gray-950">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Live business overview from your database.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div className={card.color + ' rounded-xl p-3 shadow-lg'}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <span className={card.changeColor + ' text-sm font-semibold'}>{card.change}</span>
                  <p className="text-xs text-slate-400">{card.trend}</p>
                </div>
              </div>
              <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</h3>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{loading ? '...' : card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Sales Overview</h2>
            <div className="flex space-x-2">
              {['weekly', 'monthly', 'yearly'].map((option) => (
                <button
                  key={option}
                  onClick={() => setRange(option)}
                  className={
                    'rounded-lg px-3 py-1 text-sm font-semibold capitalize transition-colors ' +
                    (range === option
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-300 dark:hover:bg-gray-700')
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Sales']} />
              <Bar dataKey="sales" fill="#059669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <h2 className="mb-6 text-lg font-bold text-slate-800 dark:text-white">Top Products</h2>
          {topProducts.length ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {topProducts.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {topProducts.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {totalTopProductValue ? Math.round((item.value / totalTopProductValue) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800 dark:text-slate-400">No product sales yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
            <Link to="/sales" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="space-y-4">
            {recentTransactions.length ? recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-4">
                  <div className="rounded-lg bg-slate-100 p-2 dark:bg-gray-800">
                    <Receipt className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{transaction.receipt}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.customer} · {transaction.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white">KES {transaction.amount.toLocaleString()}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600 dark:bg-gray-800 dark:text-slate-300">{transaction.payment}</span>
                </div>
              </div>
            )) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800 dark:text-slate-400">No transactions yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Low Stock Alert</h2>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">{lowStockProducts.length} items</span>
            </div>
            <div className="space-y-3">
              {lowStockProducts.length ? lowStockProducts.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{item.name}</p>
                    <p className="text-sm text-red-600 dark:text-red-300">Only {item.stock} left (min: {item.threshold})</p>
                  </div>
                  <Link to="/inventory" className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">Restock</Link>
                </div>
              )) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-gray-800 dark:text-slate-400">No low-stock products.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/pos" className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-center text-white transition-all hover:shadow-lg">
                <ShoppingCart className="mx-auto mb-2 h-8 w-8" />
                <span className="text-sm font-semibold">New Sale</span>
              </Link>
              <Link to="/products" className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-center text-white transition-all hover:shadow-lg">
                <Package className="mx-auto mb-2 h-8 w-8" />
                <span className="text-sm font-semibold">Add Product</span>
              </Link>
              <Link to="/inventory" className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-center text-white transition-all hover:shadow-lg">
                <TrendingUp className="mx-auto mb-2 h-8 w-8" />
                <span className="text-sm font-semibold">Inventory</span>
              </Link>
              <Link to="/reports" className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-center text-white transition-all hover:shadow-lg">
                <DollarSign className="mx-auto mb-2 h-8 w-8" />
                <span className="text-sm font-semibold">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
