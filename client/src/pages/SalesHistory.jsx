import React, { useState, useEffect } from 'react';
import { Search, Eye, Printer, X, Receipt, Calendar, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ReceiptPrinter from '../components/ReceiptPrinter';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(null);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales?limit=100');
      setSales(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load sales');
    }
  };

  const viewReceipt = async (saleId) => {
    try {
      const response = await api.get('/sales/' + saleId);
      setSelectedSale(response.data.data);
      setShowReceipt(true);
    } catch (error) {
      toast.error('Failed to load receipt');
    }
  };

  const handlePrint = async (saleId) => {
    try {
      const response = await api.get('/sales/' + saleId);
      setShowPrintOptions(response.data.data);
    } catch (error) {
      toast.error('Failed to load receipt');
    }
  };

  const filtered = sales.filter(s => 
    s.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.payment_method?.toLowerCase().includes(search.toLowerCase())
  );

  const paymentIcons = { cash: '💵', mpesa: '📱', card: '💳' };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sales History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{sales.length} transactions recorded</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by receipt, customer or payment..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-96 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <th className="pb-3 px-6 font-medium">Receipt #</th>
                <th className="pb-3 px-6 font-medium">Date & Time</th>
                <th className="pb-3 px-6 font-medium">Items</th>
                <th className="pb-3 px-6 font-medium">Total</th>
                <th className="pb-3 px-6 font-medium">Payment</th>
                <th className="pb-3 px-6 font-medium">Status</th>
                <th className="pb-3 px-6 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sale => (
                <tr key={sale.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-primary-600 dark:text-primary-400 font-mono">{sale.receipt_number}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(sale.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                      {sale.items_count || 0} items
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-800 dark:text-white">
                    KES {sale.total_amount?.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium capitalize">
                      {paymentIcons[sale.payment_method]} {sale.payment_method}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={"px-3 py-1 rounded-full text-xs font-bold " + 
                      (sale.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 
                       'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300')}>
                      {sale.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-1">
                      <button onClick={() => viewReceipt(sale.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePrint(sale.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Print">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Receipt Modal */}
      {showReceipt && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReceipt(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Receipt</h2>
              <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <Receipt className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                <h3 className="font-bold text-xl text-gray-800 dark:text-white">{selectedSale.receipt_number}</h3>
                <p className="text-gray-500 dark:text-gray-400">{new Date(selectedSale.created_at).toLocaleString()}</p>
              </div>
              
              <div className="border-t border-b dark:border-gray-700 py-4 mb-4">
                {selectedSale.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.product_name} x{item.quantity}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">KES {item.total?.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Subtotal</span><span className="text-gray-800 dark:text-white">KES {selectedSale.subtotal?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tax</span><span className="text-gray-800 dark:text-white">KES {selectedSale.tax_amount?.toLocaleString() || 0}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-gray-700"><span>Total</span><span className="text-primary-600 dark:text-primary-400">KES {selectedSale.total_amount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Paid ({selectedSale.payment_method})</span><span className="text-gray-800 dark:text-white">KES {selectedSale.amount_paid?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Change</span><span className="text-gray-800 dark:text-white">KES {selectedSale.change_amount?.toLocaleString() || 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Options Modal */}
      {showPrintOptions && (
        <ReceiptPrinter 
          sale={showPrintOptions} 
          onClose={() => setShowPrintOptions(null)} 
        />
      )}
    </div>
  );
};

export default SalesHistory;
