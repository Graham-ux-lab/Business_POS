import React, { useEffect, useMemo, useState } from 'react';
import { Download, TrendingUp, Package, AlertTriangle, DollarSign, Calendar, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const today = new Date().toISOString().slice(0, 10);

const reportTypes = [
  {
    key: 'daily-sales',
    name: 'Daily Sales',
    icon: Calendar,
    desc: 'Sales for one business day',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'sales',
    name: 'Sales',
    icon: TrendingUp,
    desc: 'Sales across a selected date range',
    color: 'from-green-500 to-emerald-500',
  },
  {
    key: 'inventory',
    name: 'Inventory',
    icon: Package,
    desc: 'Current stock levels and stock value',
    color: 'from-purple-500 to-pink-500',
  },
  {
    key: 'low-stock',
    name: 'Low Stock',
    icon: AlertTriangle,
    desc: 'Products at or below reorder threshold',
    color: 'from-red-500 to-orange-500',
  },
  {
    key: 'profit',
    name: 'Profit',
    icon: DollarSign,
    desc: 'Revenue, costs, and gross profit',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    key: 'best-sellers',
    name: 'Best Sellers',
    icon: TrendingUp,
    desc: 'Top products by quantity sold',
    color: 'from-indigo-500 to-purple-500',
  },
];

const columnsByReport = {
  'daily-sales': [
    ['receipt_number', 'Receipt'],
    ['created_at', 'Date'],
    ['cashier', 'Cashier'],
    ['payment_method', 'Payment'],
    ['total_amount', 'Total'],
    ['status', 'Status'],
  ],
  sales: [
    ['receipt_number', 'Receipt'],
    ['created_at', 'Date'],
    ['cashier', 'Cashier'],
    ['payment_method', 'Payment'],
    ['subtotal', 'Subtotal'],
    ['tax_amount', 'Tax'],
    ['total_amount', 'Total'],
    ['status', 'Status'],
  ],
  inventory: [
    ['name', 'Product'],
    ['sku', 'SKU'],
    ['category', 'Category'],
    ['quantity', 'Qty'],
    ['low_stock_threshold', 'Threshold'],
    ['cost_price', 'Cost'],
    ['selling_price', 'Price'],
    ['stock_retail_value', 'Retail Value'],
  ],
  'low-stock': [
    ['name', 'Product'],
    ['sku', 'SKU'],
    ['category', 'Category'],
    ['quantity', 'Qty'],
    ['threshold', 'Threshold'],
    ['selling_price', 'Price'],
  ],
  profit: [
    ['name', 'Product'],
    ['sku', 'SKU'],
    ['quantity_sold', 'Qty Sold'],
    ['revenue', 'Revenue'],
    ['cost', 'Cost'],
    ['profit', 'Profit'],
  ],
  'best-sellers': [
    ['name', 'Product'],
    ['sku', 'SKU'],
    ['category', 'Category'],
    ['quantity_sold', 'Qty Sold'],
    ['revenue', 'Revenue'],
  ],
};

const formatValue = (key, value) => {
  if (value === null || value === undefined) return '-';
  if (key.includes('amount') || key.includes('price') || key.includes('total') || key.includes('revenue') || key.includes('cost') || key.includes('profit') || key.includes('value')) {
    return `KES ${Number(value || 0).toLocaleString()}`;
  }
  if (key.includes('created_at')) {
    return new Date(value).toLocaleString();
  }
  return String(value);
};

const toCsv = (columns, rows) => {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [
    columns.map(([, label]) => escape(label)).join(','),
    ...rows.map((row) => columns.map(([key]) => escape(formatValue(key, row[key]))).join(',')),
  ].join('\n');
};

const Reports = () => {
  const [activeType, setActiveType] = useState('daily-sales');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeReport = reportTypes.find((item) => item.key === activeType);
  const columns = useMemo(() => columnsByReport[activeType] || [], [activeType]);
  const rows = report?.rows || [];
  const summary = report?.summary || {};

  useEffect(() => {
    fetchReport();
  }, [activeType]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ startDate, endDate });
      const response = await api.get(`/reports/${activeType}?${params.toString()}`);
      setReport(response.data.data);
    } catch {
      toast.error('Failed to load report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    const csv = toCsv(columns, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeType}-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
    doc.setFontSize(16);
    doc.text(`${activeReport.name} Report`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [columns.map(([, label]) => label)],
      body: rows.map((row) => columns.map(([key]) => formatValue(key, row[key]))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(`${activeType}-${startDate}-to-${endDate}.pdf`);
  };

  const summaryCards = Object.entries(summary).map(([key, value]) => ({
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
    value: formatValue(key, value),
  }));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">View specific database reports and download them.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((reportType) => {
          const Icon = reportType.icon;
          const active = activeType === reportType.key;
          return (
            <button
              key={reportType.key}
              onClick={() => setActiveType(reportType.key)}
              className={
                'overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900 ' +
                (active ? 'ring-2 ring-emerald-500' : '')
              }
            >
              <div className={'h-1.5 bg-gradient-to-r ' + reportType.color}></div>
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-slate-100 p-3 dark:bg-gray-800">
                    <Icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  {active && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Selected</span>}
                </div>
                <h3 className="mb-1 text-lg font-bold text-slate-800 dark:text-white">{reportType.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{reportType.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-emerald-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{activeReport.name} Report</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{rows.length} row{rows.length === 1 ? '' : 's'} found</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <button onClick={fetchReport}
              className="flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
              <RefreshCw className="mr-2 h-4 w-4" />Run
            </button>
            <button onClick={downloadCsv} disabled={!rows.length}
              className="flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
              <Download className="mr-2 h-4 w-4" />CSV
            </button>
            <button onClick={downloadPdf} disabled={!rows.length}
              className="flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              <Download className="mr-2 h-4 w-4" />PDF
            </button>
          </div>
        </div>

        {summaryCards.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {summaryCards.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50 p-4 dark:bg-gray-800">
                <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50 text-sm text-slate-500 dark:border-gray-800 dark:bg-gray-800 dark:text-slate-300">
                {columns.map(([, label]) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {loading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={columns.length}>Loading report...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={columns.length}>No data for this report.</td></tr>
              ) : rows.map((row, index) => (
                <tr key={index} className="text-sm hover:bg-slate-50 dark:hover:bg-gray-800">
                  {columns.map(([key]) => (
                    <td key={key} className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                      {formatValue(key, row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
