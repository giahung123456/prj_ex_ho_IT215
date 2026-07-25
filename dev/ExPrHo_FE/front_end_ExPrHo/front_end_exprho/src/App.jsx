import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout & Guards
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Protected pages
import DashboardOverview from './pages/DashboardOverview';
import Profile from './pages/Profile';
import EmployeeManagement from './pages/EmployeeManagement';
import CategoryManagement from './pages/CategoryManagement';
import CustomerManagement from './pages/CustomerManagement';

// New Pages
import ProductManagement from './pages/ProductManagement';
import StockLogs from './pages/StockLogs';
import OrderManagement from './pages/OrderManagement';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Core Dashboard & E-commerce Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Index Route: Displays role-appropriate dashboard or storefront */}
              <Route index element={<DashboardOverview />} />
              
              {/* Common profile management */}
              <Route path="profile" element={<Profile />} />
              
              {/* Admin-only Employee management */}
              <Route 
                path="admin/employees" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <EmployeeManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Admin-only Category management */}
              <Route 
                path="admin/categories" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <CategoryManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Admin & Sales Customer management */}
              <Route 
                path="admin/customers" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                    <CustomerManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Products & Inventory (Admin, Keeper, Sales) */}
              <Route 
                path="products" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STOREKEEPER', 'SALES']}>
                    <ProductManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Stock Logs (Admin, Keeper) */}
              <Route 
                path="stock-logs" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'STOREKEEPER']}>
                    <StockLogs />
                  </ProtectedRoute>
                } 
              />

              {/* Admin & Sales Order management */}
              <Route 
                path="orders" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                    <OrderManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Customer-only Cart route */}
              <Route 
                path="cart" 
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <Cart />
                  </ProtectedRoute>
                } 
              />

              {/* Customer-only Checkout route */}
              <Route 
                path="checkout" 
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />

              {/* Customer-only Order History route */}
              <Route 
                path="order-history" 
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER']}>
                    <OrderHistory />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Catch-all Route: Redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
