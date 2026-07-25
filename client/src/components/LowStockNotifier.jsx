import { useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LowStockNotifier = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkLowStock = async () => {
      try {
        const response = await api.get('/products?limit=100');
        const products = response.data.data || [];
        const lowStock = products.filter((product) => {
          const threshold = product.low_stock_threshold ?? 10;
          return product.quantity <= threshold;
        });

        if (lowStock.length === 0) return;

        toast.error(`${lowStock.length} low-stock item${lowStock.length === 1 ? '' : 's'} need attention`, {
          id: 'low-stock-alert',
          duration: 6000,
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Business POS low stock', {
            body: `${lowStock.length} item${lowStock.length === 1 ? '' : 's'} at or below threshold.`,
          });
        }
      } catch {
        // Offline mode or API downtime is handled elsewhere.
      }
    };

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkLowStock();
    const interval = setInterval(checkLowStock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return null;
};

export default LowStockNotifier;
