import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { flushOfflineQueue, getOfflineQueueCount } from '../services/api';

const OfflineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(getOfflineQueueCount());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const updateQueue = (event) => setQueueCount(event.detail ?? getOfflineQueueCount());

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    window.addEventListener('offline-queue-updated', updateQueue);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('offline-queue-updated', updateQueue);
    };
  }, []);

  useEffect(() => {
    if (online && queueCount > 0) {
      handleSync();
    }
  }, [online]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await flushOfflineQueue();
    setQueueCount(result.remaining);
    setSyncing(false);
  };

  if (online && queueCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        {online ? <RefreshCw className="h-5 w-5 text-emerald-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {online ? 'Offline actions pending' : 'Offline mode active'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {queueCount} queued action{queueCount === 1 ? '' : 's'}
          </p>
        </div>
        {online && queueCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {syncing ? 'Syncing' : 'Sync'}
          </button>
        )}
        {!online && <CloudOff className="h-5 w-5 text-slate-400" />}
      </div>
    </div>
  );
};

export default OfflineStatus;
