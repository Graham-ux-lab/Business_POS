import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, Clock } from 'lucide-react';
import api from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/audit?limit=200');
      setLogs(response.data.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const haystack = `${log.action} ${log.entity_type} ${log.username} ${log.full_name}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Audit Logs</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Track sensitive actions across products, sales, and backups.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <ShieldCheck className="h-7 w-7" />
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-900">
        <div className="border-b border-slate-200 p-4 dark:border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search audit logs..."
              className="w-full rounded-xl border-2 border-slate-200 bg-white py-2 pl-10 pr-4 text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">No audit logs found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{log.action}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {log.full_name || log.username || 'System'} · {log.entity_type}
                    {log.entity_id ? ` #${log.entity_id}` : ''}
                  </p>
                </div>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="mr-2 h-4 w-4" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
