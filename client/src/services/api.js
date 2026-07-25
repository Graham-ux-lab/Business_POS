import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const OFFLINE_QUEUE_KEY = 'business_pos_offline_queue';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const readQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeQueue = (queue) => {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: queue.length }));
};

export const getOfflineQueueCount = () => readQueue().length;

export const flushOfflineQueue = async () => {
  if (!navigator.onLine) return { synced: 0, remaining: getOfflineQueueCount() };

  const queue = readQueue();
  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await api.request({
        url: item.url,
        method: item.method,
        data: item.data,
        __skipOfflineQueue: true,
      });
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  if (synced) toast.success(`${synced} offline action${synced === 1 ? '' : 's'} synced`);
  return { synced, remaining: remaining.length };
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config || {};
    const method = (config.method || '').toLowerCase();
    const canQueue = ['post', 'put', 'patch', 'delete'].includes(method);

    if (!error.response && canQueue && !config.__skipOfflineQueue) {
      const queue = readQueue();
      queue.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: config.url,
        method,
        data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
        createdAt: new Date().toISOString(),
      });
      writeQueue(queue);
      toast.success('Saved offline. It will sync when connection returns.');
      return Promise.resolve({ data: { success: true, offline: true, queued: true } });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
