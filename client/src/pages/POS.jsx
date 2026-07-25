import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../contexts/PosContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Search, Minus, Plus, Trash2, ShoppingCart, X, Clock, Zap, TrendingUp, Sparkles, Sun, Moon, Receipt, ScanLine, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const POS = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, tax, total, processPayment } = usePos();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const searchInputRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    searchInputRef.current?.focus();
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      const url = selectedCategory === 'all' ? '/products?limit=100' : '/products?category=' + selectedCategory + '&limit=100';
      const response = await api.get(url);
      setProducts(response.data.data || []);
    } catch (error) {}
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {}
  };

  const handlePayment = async () => {
    if (!amountPaid || parseFloat(amountPaid) < total) {
      toast.error('Insufficient amount');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await processPayment({
        paymentMethod,
        amountPaid: parseFloat(amountPaid),
        items: cart,
        subtotal,
        tax,
        total
      });
      setShowPayment(false);
      setAmountPaid('');
      if (result?.data?.receipt_number) {
        toast.success('🎉 Sale complete!');
      }
      searchInputRef.current?.focus();
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const change = amountPaid ? parseFloat(amountPaid) - total : 0;
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-wide">Business POS Checkout</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Retail sales desk · Inventory synced</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-3 text-sm">
            <span className="px-3 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs text-slate-600 dark:text-slate-300">
              <ShoppingCart className="w-3 h-3 inline mr-1" />{cart.length} cart items
            </span>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400">
              KES {total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} 
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
              text-gray-600 dark:text-gray-300 hover:scale-110">
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <BadgeCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-600 dark:text-gray-300">{greeting},</span>
            <span className="font-semibold text-gray-800 dark:text-white">{user?.fullName?.split(' ')[0]}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-gray-800 px-6 py-4 space-y-4 transition-colors">
            <div className="relative">
              <ScanLine className="absolute left-4 top-3.5 text-emerald-500 w-5 h-5" />
              <input ref={searchInputRef} type="text" placeholder="Scan barcode or search products by name..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 
                  rounded-2xl text-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500
                  focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none transition-all shadow-sm" />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-1">
              <button onClick={() => setSelectedCategory('all')}
                className={"px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap " + 
                  (selectedCategory === 'all' ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xl scale-105' : 
                   'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600')}>
                All Products
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={"px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap " + 
                    (selectedCategory === cat.id ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xl scale-105' : 
                     'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600')}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <button key={product.id} 
                  onClick={() => { 
                    if (product.quantity > 0) {
                      addToCart(product);
                      toast.success('✓ ' + product.name, { duration: 800, icon: '🛒' });
                    }
                  }}
                  disabled={product.quantity === 0}
                  className={"group relative bg-white dark:bg-gray-900 rounded-2xl p-4 transition-all duration-300 text-left border border-slate-200 dark:border-gray-800 " + 
                    (product.quantity === 0 ? 'opacity-40 cursor-not-allowed' : 
                     'hover:shadow-2xl dark:hover:shadow-gray-900/50 hover:scale-105 hover:-translate-y-1 cursor-pointer active:scale-95')}>
                  
                  {product.quantity > 0 && product.quantity <= 5 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse z-10">
                      {product.quantity} left
                    </div>
                  )}

                  <div className="w-full h-32 bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 dark:from-gray-800 dark:via-gray-800 dark:to-emerald-950 rounded-2xl mb-3 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute left-3 top-3 px-2 py-1 bg-white/80 dark:bg-gray-900/80 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {product.sku || 'SKU'}
                    </div>
                    <span className="text-5xl font-black text-emerald-200 dark:text-emerald-900 group-hover:scale-110 transition-transform">
                      {product.name.charAt(0)}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-white mb-1 truncate text-sm">{product.name}</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 truncate">{product.category_name || 'Uncategorized'} · {product.quantity} in stock</p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-gray-500">Retail price</p>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">KES {product.selling_price}</p>
                    </div>
                    {product.quantity > 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                        + Add
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-[420px] bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 flex flex-col shadow-2xl transition-colors">
          <div className="p-5 border-b border-slate-200 dark:border-gray-800 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                Current Receipt
              </h2>
              <span className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart}
                className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-semibold transition-colors border border-red-200 dark:border-red-800">
                <Trash2 className="w-4 h-4 inline mr-1" /> Clear Cart
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="relative mb-6">
                  <ShoppingCart className="w-24 h-24 opacity-10 dark:opacity-5" />
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
                </div>
                <p className="text-xl font-bold text-gray-300 dark:text-gray-600 mb-2">No items on receipt</p>
                <p className="text-sm">Scan or tap products to begin a sale</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 dark:text-white">{item.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">KES {item.selling_price} × {item.quantity}</p>
                    </div>
                    <button onClick={() => removeFromCart(index)} 
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 bg-white dark:bg-gray-600 rounded-xl p-1">
                      <button onClick={() => updateQuantity(index, item.quantity - 1)} 
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors text-gray-600 dark:text-gray-300">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-black text-lg text-gray-800 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(index, item.quantity + 1)} 
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors text-gray-600 dark:text-gray-300">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-black text-primary-600 dark:text-primary-400 text-lg">
                      KES {(item.selling_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t dark:border-gray-700 p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-bold text-gray-800 dark:text-white">KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">VAT (16%)</span>
                <span className="font-bold text-gray-800 dark:text-white">KES {tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl pt-3 border-t-2 dark:border-gray-600">
                <span className="font-black text-gray-800 dark:text-white">TOTAL</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">KES {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {quickAmounts.slice(0, 3).map(amt => (
                <button key={amt} onClick={() => { setAmountPaid(amt.toString()); setShowPayment(true); }}
                  className="py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-xs font-bold 
                    text-gray-700 dark:text-gray-300 transition-colors">
                  KES {amt}
                </button>
              ))}
            </div>

            <button onClick={() => setShowPayment(true)} disabled={cart.length === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-lg 
                hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-95 tracking-wide">
              <TrendingUp className="w-5 h-5 inline mr-2" />
              TAKE PAYMENT · KES {total.toLocaleString()}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" 
          onClick={() => setShowPayment(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl transition-colors" 
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">Complete Payment</h2>
              <button onClick={() => setShowPayment(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-600 dark:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Amount to Pay</p>
              <p className="text-5xl font-black text-gray-900 dark:text-white">KES {total.toLocaleString()}</p>
              {tax > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Includes KES {tax.toLocaleString()} VAT</p>}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { method: 'cash', label: 'Cash', emoji: '💵' },
                { method: 'mpesa', label: 'M-Pesa', emoji: '📱' },
                { method: 'card', label: 'Card', emoji: '💳' },
              ].map(pm => (
                <button key={pm.method} onClick={() => setPaymentMethod(pm.method)}
                  className={"relative p-4 rounded-2xl border-2 transition-all overflow-hidden " + 
                    (paymentMethod === pm.method ? 'border-primary-500 shadow-lg scale-105 bg-primary-50 dark:bg-primary-900/20' : 
                     'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500')}>
                  {paymentMethod === pm.method && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600"></div>
                  )}
                  <span className="text-3xl block mb-1">{pm.emoji}</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{pm.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Amount Received</label>
              <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl 
                  focus:border-primary-500 focus:outline-none text-2xl font-black text-center 
                  bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white" 
                placeholder="0.00" autoFocus />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {quickAmounts.map(amt => (
                  <button key={amt} onClick={() => setAmountPaid(amt.toString())}
                    className="py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl 
                      text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
                    KES {amt}
                  </button>
                ))}
              </div>
            </div>

            {change > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 
                rounded-2xl p-5 mb-6 text-center border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400 font-bold mb-1">CHANGE DUE</p>
                <p className="text-4xl font-black text-green-600 dark:text-green-400">KES {change.toLocaleString()}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button onClick={() => { setShowPayment(false); setAmountPaid(''); }}
                className="flex-1 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-bold 
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300">
                Cancel
              </button>
              <button onClick={handlePayment} 
                disabled={isProcessing || !amountPaid || parseFloat(amountPaid) < total}
                className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-black 
                  hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 shadow-xl
                  transform hover:scale-[1.02] active:scale-95">
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : '✓ Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
