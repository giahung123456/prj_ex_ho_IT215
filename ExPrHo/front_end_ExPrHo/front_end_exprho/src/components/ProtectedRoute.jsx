import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justify-content: 'center',
        background: 'var(--background)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save original location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    // Return a beautiful 403 Forbidden screen
    return (
      <div className="auth-wrapper" style={{ minHeight: '100vh' }}>
        <div className="auth-circle auth-circle-1"></div>
        <div className="auth-circle auth-circle-2"></div>
        <div className="auth-card animate-slideup" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div className="auth-logo" style={{ background: 'linear-gradient(135deg, var(--error) 0%, #b91c1c 100%)' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 className="auth-title" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Truy Cập Bị Từ Chối</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Tài khoản của bạn (vai trò <strong>{currentUser?.role}</strong>) không được phân quyền để truy cập trang này. Vui lòng liên hệ quản trị viên hoặc quay lại trang chủ.
          </p>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto', gap: '0.5rem' }}>
            <ArrowLeft size={18} />
            Quay Lại Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
