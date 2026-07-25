import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put('/categories/' + editingCategory.id, formData);
        toast.success('Category updated!');
      } else {
        await api.post('/categories', formData);
        toast.success('Category added!');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await api.delete('/categories/' + id);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const colors = ['from-green-400 to-emerald-500', 'from-blue-400 to-cyan-500', 'from-purple-400 to-pink-500', 
                  'from-orange-400 to-red-500', 'from-teal-400 to-green-500', 'from-indigo-400 to-blue-500'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-500 mt-1">{categories.length} categories</p>
        </div>
        <button onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '' }); setShowModal(true); }}
          className="flex items-center px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl">
          <Plus className="w-5 h-5 mr-2" />Add Category
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((cat, index) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className={"h-2 bg-gradient-to-r " + colors[index % colors.length]}></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <FolderTree className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{cat.name}</h3>
                </div>
              </div>
              {cat.description && <p className="text-gray-500 text-sm mb-4">{cat.description}</p>}
              <div className="flex justify-end space-x-1 border-t pt-3">
                <button onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, description: cat.description || '' }); setShowModal(true); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(cat.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700">
                  <Save className="w-4 h-4 mr-2 inline" />{editingCategory ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
