import toast from 'react-hot-toast';

let notificationInterval = null;
let lowStockProducts = [];

export const checkLowStock = async (api) => {
  try {
    const response = await api.get('/products?limit=1000');
    const products = response.data.data || [];
    const lowStock = products.filter(p => p.quantity <= p.low_stock_threshold && p.quantity >= 0);
    
    const newLowStock = lowStock.filter(p => 
      !lowStockProducts.find(prev => prev.id === p.id)
    );
    
    if (newLowStock.length > 0) {
      newLowStock.forEach(product => {
        if (product.quantity === 0) {
          toast.error(product.name + ' is OUT OF STOCK!', { duration: 5000 });
        } else {
          toast(product.name + ' is low (' + product.quantity + ' left)', { duration: 4000, icon: '⚠️' });
        }
      });
    }
    
    lowStockProducts = lowStock;
    return lowStock;
  } catch (error) {
    return [];
  }
};

export const startNotificationPolling = (api, intervalMs = 60000) => {
  checkLowStock(api);
  notificationInterval = setInterval(() => { checkLowStock(api); }, intervalMs);
};

export const stopNotificationPolling = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};
