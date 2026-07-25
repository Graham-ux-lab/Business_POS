import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PosProvider } from './contexts/PosContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

function HomeRedirect() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAdmin ? '/dashboard' : '/pos'} replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/pos" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PosProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px' } }} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<HomeRedirect />} />
                <Route path="dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="pos" element={<POS />} />
                <Route path="products" element={<AdminRoute><Products /></AdminRoute>} />
                <Route path="categories" element={<AdminRoute><Categories /></AdminRoute>} />
                <Route path="inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
                <Route path="suppliers" element={<AdminRoute><Suppliers /></AdminRoute>} />
                <Route path="purchases" element={<AdminRoute><Purchases /></AdminRoute>} />
                <Route path="sales" element={<SalesHistory />} />
                <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
                <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
                <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
              </Route>
            </Routes>
          </PosProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
