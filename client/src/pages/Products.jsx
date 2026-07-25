import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, Barcode, Printer, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import JsBarcode from 'jsbarcode';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBarcode, setShowBarcode] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const barcodeRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', category_id: '', description: '',
    cost_price: '', selling_price: '', quantity: '0', low_stock_threshold: '10'
  });

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (showBarcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, showBarcode.barcode || showBarcode.sku, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10
        });
      } catch (error) {
        console.error('Barcode generation failed:', error);
      }
    }
  }, [showBarcode]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put('/products/' + editingProduct.id, formData);
        toast.success('Product updated!');
      } else {
        await api.post('/products', formData);
        toast.success('Product added!');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, sku: product.sku, barcode: product.barcode || '',
      category_id: product.category_id || '', description: product.description || '',
      cost_price: product.cost_price, selling_price: product.selling_price,
      quantity: product.quantity, low_stock_threshold: product.low_stock_threshold || '10'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete('/products/' + id);
        toast.success('Product deleted');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', barcode: '', category_id: '', description: '', cost_price: '', selling_price: '', quantity: '0', low_stock_threshold: '10' });
  };

  const generateSKU = () => {
    const sku = 'SKU-' + Date.now().toString().slice(-8);
    setFormData({ ...formData, sku });
  };

  const generateBarcode = () => {
    const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setFormData({ ...formData, barcode });
  };

  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Barcode</title></head><body style="text-align:center;padding:20px;">');
    printWindow.document.write('<h3>' + showBarcode.name + '</h3>');
    printWindow.document.write('<svg>' + barcodeRef.current.innerHTML + '</svg>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{products.length} products in inventory</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl">
          <Plus className="w-5 h-5 mr-2" />Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by name, SKU or barcode..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-96 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <th className="pb-3 px-6 font-medium">Product</th>
                <th className="pb-3 px-6 font-medium">SKU</th>
                <th className="pb-3 px-6 font-medium">Barcode</th>
                <th className="pb-3 px-6 font-medium">Category</th>
                <th className="pb-3 px-6 font-medium">Price</th>
                <th className="pb-3 px-6 font-medium">Stock</th>
                <th className="pb-3 px-6 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center text-xl font-bold text-primary-700 dark:text-primary-300">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6"><span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">{product.sku}</span></td>
                  <td className="py-4 px-6">
                    <button onClick={() => setShowBarcode(product)}
                      className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:underline text-sm">
                      <Barcode className="w-4 h-4" />
                      <span>{product.barcode || 'Generate'}</span>
                    </button>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{product.category_name || '-'}</td>
                  <td className="py-4 px-6 font-bold text-primary-600 dark:text-primary-400">KES {product.selling_price}</td>
                  <td className="py-4 px-6">
                    <span className={"px-2 py-1 rounded-full text-xs font-bold " + 
                      (product.quantity > 20 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 
                       product.quantity > 10 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                       product.quantity > 0 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' : 
                       'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300')}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-1">
                      <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setShowBarcode(product); }} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors" title="Barcode">
                        <Barcode className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU *</label>
                  <div className="flex space-x-2">
                    <input type="text" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                    <button type="button" onClick={generateSKU} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">Generate</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
                  <div className="flex space-x-2">
                    <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                    <button type="button" onClick={generateBarcode} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                      <Barcode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Price *</label>
                  <input type="number" step="0.01" required value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price *</label>
                  <input type="number" step="0.01" required value={formData.selling_price} onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Alert</label>
                  <input type="number" value={formData.low_stock_threshold} onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-primary-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2 border-2 border-gray-200 dark:border-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center">
                  <Save className="w-4 h-4 mr-2" />{editingProduct ? 'Update' : 'Save'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {showBarcode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBarcode(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Product Barcode</h2>
              <button onClick={() => setShowBarcode(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{showBarcode.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {showBarcode.sku}</p>
            </div>
            <div className="bg-white p-6 rounded-xl mb-4 flex justify-center">
              <svg ref={barcodeRef}></svg>
            </div>
            <div className="flex space-x-3">
              <button onClick={printBarcode}
                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center justify-center">
                <Printer className="w-4 h-4 mr-2" />Print Barcode
              </button>
              <button onClick={() => setShowBarcode(null)}
                className="px-6 py-3 border-2 border-gray-200 dark:border-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
