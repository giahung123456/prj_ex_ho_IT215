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

            {/* Protected Core Dashboard Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Common dashboard home */}
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
