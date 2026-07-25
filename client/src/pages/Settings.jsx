import React, { useState, useEffect } from 'react';
import { Save, Store, Mail, Phone, MapPin, Percent, DollarSign, FileText, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    business_name: '', business_email: '', business_phone: '', business_address: '',
    tax_percentage: '16', currency: 'KES', receipt_header: '', receipt_footer: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.data) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {} finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const downloadBackup = async () => {
    try {
      const response = await api.get('/backup');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `business-pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch {
      toast.error('Failed to create backup');
    }
  };

  const restoreBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await api.post('/backup/restore', backup);
      toast.success('Backup restored. Refresh the app to reload data.');
    } catch {
      toast.error('Failed to restore backup');
    } finally {
      event.target.value = '';
    }
  };

  if (loading) {
    return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="h-64 bg-gray-200 rounded-2xl"></div></div></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Business Settings</h1>
        <p className="text-gray-500 mt-1">Configure your business information</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center space-x-4 mb-8 pb-6 border-b">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{settings.business_name || 'Business Name'}</h2>
            <p className="text-gray-500">Business Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Store className="w-4 h-4 inline mr-1" />Business Name
            </label>
            <input type="text" value={settings.business_name} onChange={(e) => setSettings({...settings, business_name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />Email
            </label>
            <input type="email" value={settings.business_email} onChange={(e) => setSettings({...settings, business_email: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />Phone
            </label>
            <input type="text" value={settings.business_phone} onChange={(e) => setSettings({...settings, business_phone: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Percent className="w-4 h-4 inline mr-1" />Tax Percentage (%)
            </label>
            <input type="number" value={settings.tax_percentage} onChange={(e) => setSettings({...settings, tax_percentage: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />Currency
            </label>
            <select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors">
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />Address
            </label>
            <textarea value={settings.business_address} onChange={(e) => setSettings({...settings, business_address: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" rows="3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />Receipt Header
            </label>
            <input type="text" value={settings.receipt_header} onChange={(e) => setSettings({...settings, receipt_header: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />Receipt Footer
            </label>
            <input type="text" value={settings.receipt_footer} onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors" />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end">
          <button onClick={handleSave}
            className="flex items-center px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl">
            <Save className="w-5 h-5 mr-2" />Save Settings
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Data Backup & Restore</h2>
          <p className="text-gray-500 mt-1">Export a full JSON backup or restore from a saved backup file.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadBackup}
            className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5 mr-2" />Download Backup
          </button>
          <label className="flex cursor-pointer items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl">
            <Upload className="w-5 h-5 mr-2" />Restore Backup
            <input type="file" accept="application/json" onChange={restoreBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;
