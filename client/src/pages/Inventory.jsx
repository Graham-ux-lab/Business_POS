import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, TrendingUp, TrendingDown, Package, Edit2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState(null);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.data || []);
    } catch (error) {}
  };

  const handleAdjustStock = async (productId, newQuantity) => {
    try {
      await api.put('/products/' + productId, { quantity: newQuantity });
      toast.success('Stock updated!');
      setAdjustModal(null);
      fetchInventory();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.selling_price), 0);
  const lowStock = products.filter(p => p.quantity <= p.low_stock_threshold && p.quantity > 0);
  const outOfStock = products.filter(p => p.quantity === 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory Management</h1>
      <p className="text-gray-500 mb-6">Monitor stock levels and manage inventory</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg"><Package className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-bold">{products.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg"><TrendingUp className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-gray-500">Total Value</p><p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg"><AlertTriangle className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-gray-500">Low Stock</p><p className="text-2xl font-bold text-yellow-600">{lowStock.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg"><TrendingDown className="w-6 h-6 text-white" /></div>
            <div><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-red-600">{outOfStock.length}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="pb-3 px-6 font-medium">Product</th>
                <th className="pb-3 px-6 font-medium">SKU</th>
                <th className="pb-3 px-6 font-medium">Current Stock</th>
                <th className="pb-3 px-6 font-medium">Status</th>
                <th className="pb-3 px-6 font-medium">Unit Price</th>
                <th className="pb-3 px-6 font-medium">Total Value</th>
                <th className="pb-3 px-6 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-semibold text-gray-800">{product.name}</td>
                  <td className="py-4 px-6 text-sm font-mono">{product.sku}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className={"text-lg font-bold " + (product.quantity > 10 ? 'text-green-600' : product.quantity > 0 ? 'text-yellow-600' : 'text-red-600')}>
                        {product.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {product.quantity === 0 ? <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">OUT OF STOCK</span> :
                     product.quantity <= product.low_stock_threshold ? <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">LOW STOCK</span> :
                     <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">IN STOCK</span>}
                  </td>
                  <td className="py-4 px-6 font-semibold">KES {product.selling_price}</td>
                  <td className="py-4 px-6 font-bold text-primary-600">KES {(product.quantity * product.selling_price).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <button onClick={() => setAdjustModal(product)}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors">
                      <Edit2 className="w-4 h-4 inline mr-1" />Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setAdjustModal(null)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
            <p className="text-gray-600 mb-4">{adjustModal.name}</p>
            <p className="text-3xl font-bold text-primary-600 mb-6">Current: {adjustModal.quantity}</p>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button onClick={() => setAdjustModal({...adjustModal, quantity: Math.max(0, adjustModal.quantity - 1)})}
                className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><Minus className="w-6 h-6" /></button>
              <span className="text-3xl font-bold w-20 text-center">{adjustModal.quantity}</span>
              <button onClick={() => setAdjustModal({...adjustModal, quantity: adjustModal.quantity + 1})}
                className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200"><Plus className="w-6 h-6" /></button>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setAdjustModal(null)} className="flex-1 py-2 border-2 border-gray-200 rounded-xl font-semibold">Cancel</button>
              <button onClick={() => handleAdjustStock(adjustModal.id, adjustModal.quantity)}
                className="flex-1 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
