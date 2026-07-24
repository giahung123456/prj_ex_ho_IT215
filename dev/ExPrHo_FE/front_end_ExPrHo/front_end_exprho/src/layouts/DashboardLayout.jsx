import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  ShoppingBag,
  Menu,
  ShieldCheck
} from 'lucide-react';

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Đăng xuất thành công', 'Hẹn gặp lại bạn!', 'success');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    {
      path: '/',
      label: 'Tổng quan',
      icon: <LayoutDashboard size={20} />,
      roles: ['ADMIN', 'STOREKEEPER', 'SALES', 'CUSTOMER']
    },
    {
      path: '/profile',
      label: 'Hồ sơ cá nhân',
      icon: <User size={20} />,
      roles: ['ADMIN', 'STOREKEEPER', 'SALES', 'CUSTOMER']
    },
    {
      path: '/admin/employees',
      label: 'Quản lý nhân viên',
      icon: <Users size={20} />,
      roles: ['ADMIN'] // Admin only
    }
  ];

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Package size={20} />
          </div>
          <span className="sidebar-brand">Quản Lý Bán Hàng</span>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            // Render only if user has correct role
            if (item.roles && !item.roles.includes(currentUser?.role)) {
              return null;
            }

            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`menu-item-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile-widget" onClick={() => navigate('/profile')}>
            <div className="avatar-circle">
              {getInitials(currentUser?.full_name)}
            </div>
            <div className="user-info-text">
              <span className="user-name">{currentUser?.full_name?.split(' ').pop()}</span>
              <span className="user-role-badge">{currentUser?.role?.toLowerCase()}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        <header className="topbar">
          <div className="page-title-area">
            <span className="page-title">
              {location.pathname === '/' && 'Bảng Điều Khiển Tổng Quan'}
              {location.pathname === '/profile' && 'Cập Nhật Hồ Sơ Cá Nhân'}
              {location.pathname === '/admin/employees' && 'Quản Lý Tài Khoản Nhân Viên'}
            </span>
          </div>

          <div className="topbar-right">
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 500,
                backgroundColor: 'var(--surface-hover)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <ShieldCheck size={16} className="text-primary" />
              <span>Hệ thống bảo mật</span>
            </div>
          </div>
        </header>

        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
