import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, User, Lock, Eye, EyeOff, Sparkles, ShoppingCart, TrendingUp, Package } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { login } = useAuth();

  const slides = [
    {
      icon: ShoppingCart,
      title: 'Fast Checkout',
      desc: 'Process sales in seconds with barcode scanning',
      color: 'from-green-400 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      desc: 'Track sales, inventory, and profits instantly',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Package,
      title: 'Inventory Control',
      desc: 'Never run out of stock with smart alerts',
      color: 'from-purple-400 to-pink-500'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login({ username, password });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}></div>

      {/* Left side - Slideshow */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative w-full max-w-lg">
          {/* Floating elements */}
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rounded-2xl rotate-12 backdrop-blur-sm border border-white/20 animate-float"></div>
          <div className="absolute -bottom-5 -right-5 w-16 h-16 bg-white/10 rounded-xl -rotate-12 backdrop-blur-sm border border-white/20 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 -right-8 w-12 h-12 bg-white/5 rounded-full backdrop-blur-sm border border-white/10 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Slides */}
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            const isActive = index === currentSlide;
            return (
              <div key={index} 
                className={"transition-all duration-700 absolute inset-0 flex flex-col items-center justify-center text-center " + 
                  (isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none')}>
                <div className={"w-24 h-24 bg-gradient-to-br " + slide.color + " rounded-3xl flex items-center justify-center mb-8 shadow-2xl transform transition-transform hover:scale-110"}>
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{slide.title}</h2>
                <p className="text-lg text-gray-300 max-w-sm">{slide.desc}</p>
              </div>
            );
          })}

          {/* Slide indicators */}
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {slides.map((_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)}
                className={"h-2 rounded-full transition-all duration-500 " + 
                  (index === currentSlide ? 'w-8 bg-primary-400' : 'w-2 bg-gray-600 hover:bg-gray-500')} />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md relative">
          {/* Decorative top bar */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 rounded-full"></div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:rotate-6 transition-transform duration-300">
                  <Store className="w-10 h-10 text-white" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">Business POS</h1>
              <p className="text-gray-400">Sign in to manage your business</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500
                      focus:border-primary-400 focus:bg-white/10 focus:outline-none transition-all duration-300"
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500
                      focus:border-primary-400 focus:bg-white/10 focus:outline-none transition-all duration-300"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-lg
                  hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    Sign In
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-gray-600">© 2026 Business POS System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-20px) rotate(12deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
