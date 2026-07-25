import React, { useState, useEffect } from 'react';
import { Plus, Eye, Search, X, Save, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '', items: [{ product_id: '', quantity: 1, cost_price: '' }]
  });

  useEffect(() => { 
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/purchases');
      setPurchases(response.data.data || []);
    } catch (error) {}
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error) {}
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.data || []);
    } catch (error) {}
  };

  const addItem = () => {
    setFormData({...formData, items: [...formData.items, { product_id: '', quantity: 1, cost_price: '' }]});
  };

  const removeItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({...formData, items});
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      items[index] = { ...items[index], [field]: value, cost_price: product?.cost_price || '' };
    } else {
      items[index] = { ...items[index], [field]: value };
    }
    setFormData({...formData, items});
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.cost_price) * parseInt(item.quantity) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchases', {
        supplier_id: formData.supplier_id,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          cost_price: parseFloat(item.cost_price)
        }))
      });
      toast.success('Purchase recorded! Stock updated.');
      setShowModal(false);
      setFormData({ supplier_id: '', items: [{ product_id: '', quantity: 1, cost_price: '' }] });
      fetchPurchases();
    } catch (error) {
      toast.error('Failed to record purchase');
    }
  };

  const filtered = purchases.filter(p => 
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Purchases</h1>
          <p className="text-gray-500 mt-1">Record and track supplier purchases</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl">
          <Plus className="w-5 h-5 mr-2" />New Purchase
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm mb-6">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search purchases..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                <th className="pb-3 px-6 font-medium">Reference</th>
                <th className="pb-3 px-6 font-medium">Supplier</th>
                <th className="pb-3 px-6 font-medium">Date</th>
                <th className="pb-3 px-6 font-medium">Items</th>
                <th className="pb-3 px-6 font-medium">Total</th>
                <th className="pb-3 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(purchase => (
                <tr key={purchase.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono font-bold text-primary-600">{purchase.reference_number || 'N/A'}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span>{purchase.supplier_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                  <td className="py-4 px-6"><span className="px-2 py-1 bg-gray-100 rounded-full text-sm">{purchase.items_count || 0} items</span></td>
                  <td className="py-4 px-6 font-bold">KES {purchase.total_amount?.toLocaleString() || 0}</td>
                  <td className="py-4 px-6">
                    <span className={"px-3 py-1 rounded-full text-xs font-bold " + 
                      (purchase.status === 'received' ? 'bg-green-100 text-green-700' : 
                       purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
                      {purchase.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold">New Purchase</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <select required value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none">
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">Items</h3>
                  <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium">+ Add Item</button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Product</label>
                      <select value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        <option value="">Select</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cost Price</label>
                      <input type="number" step="0.01" value={item.cost_price} onChange={(e) => updateItem(index, 'cost_price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex items-end">
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-lg font-bold">Total: KES {calculateTotal().toLocaleString()}</p>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-6 py-2 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
                  <button type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center">
                    <Save className="w-4 h-4 mr-2" />Record Purchase
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
