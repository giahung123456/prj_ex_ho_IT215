import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cartService } from '../services/api';
import { 
  Users, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Menu,
  ShieldCheck,
  Layers,
  UserCheck,
  ShoppingCart,
  History,
  ClipboardList,
  Database
} from 'lucide-react';

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [cartItemCount, setCartItemCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const isCustomer = currentUser?.role === 'CUSTOMER';

  // Load and subscribe to cart updates
  const loadCartCount = async () => {
    if (isCustomer) {
      try {
        const cart = await cartService.get();
        const totalItems = cart.items ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
        setCartItemCount(totalItems);
      } catch (err) {
        console.error("Error loading cart count", err);
      }
    }
  };

  useEffect(() => {
    loadCartCount();

    // Listen to custom cart updated event
    const handleCartUpdate = () => {
      loadCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    showToast('Đăng xuất thành công', 'Hẹn gặp lại bạn!', 'success');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  // Staff Sidebar Menu Items
  const sidebarItems = [
    {
      path: '/',
      label: 'Tổng quan',
      icon: <LayoutDashboard size={20} />,
      roles: ['ADMIN', 'STOREKEEPER', 'SALES']
    },
    {
      path: '/products',
      label: 'Quản lý sản phẩm',
      icon: <Package size={20} />,
      roles: ['ADMIN', 'STOREKEEPER', 'SALES']
    },
    {
      path: '/admin/categories',
      label: 'Quản lý danh mục',
      icon: <Layers size={20} />,
      roles: ['ADMIN'] // Admin only
    },
    {
      path: '/stock-logs',
      label: 'Biến động kho',
      icon: <Database size={20} />,
      roles: ['ADMIN', 'STOREKEEPER'] // Admin & Storekeeper
    },
    {
      path: '/orders',
      label: 'Quản lý đơn hàng',
      icon: <ClipboardList size={20} />,
      roles: ['ADMIN', 'SALES'] // Admin & Sales
    },
    {
      path: '/admin/customers',
      label: 'Quản lý khách hàng',
      icon: <UserCheck size={20} />,
      roles: ['ADMIN', 'SALES'] // Admin & Sales
    },
    {
      path: '/admin/employees',
      label: 'Quản lý nhân viên',
      icon: <Users size={20} />,
      roles: ['ADMIN'] // Admin only
    },
    {
      path: '/profile',
      label: 'Hồ sơ cá nhân',
      icon: <User size={20} />,
      roles: ['ADMIN', 'STOREKEEPER', 'SALES']
    }
  ];

  // Render Customer Layout (Top Navbar)
  if (isCustomer) {
    return (
      <div className="ecom-container" data-role="CUSTOMER">
        <header className="ecom-header">
          <div className="ecom-navbar">
            <Link to="/" className="ecom-brand">
              <ShoppingCart size={24} />
              <span>ShihoStore</span>
            </Link>

            <ul className="ecom-nav-menu">
              <li>
                <Link to="/" className={`ecom-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                  Cửa hàng
                </Link>
              </li>
              <li>
                <Link to="/order-history" className={`ecom-nav-link ${location.pathname === '/order-history' ? 'active' : ''}`}>
                  Đơn hàng của tôi
                </Link>
              </li>
            </ul>

            <div className="ecom-nav-actions">
              {/* Shopping Cart Button */}
              <div className="cart-btn-wrapper">
                <button 
                  className="cart-icon-btn" 
                  onClick={() => navigate('/cart')}
                  title="Giỏ hàng của bạn"
                >
                  <ShoppingCart size={20} />
                </button>
                {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
              </div>

              {/* User Dropdown */}
              <div className="user-dropdown-container">
                <button 
                  className="user-nav-btn" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                >
                  <div className="user-nav-avatar">
                    {getInitials(currentUser?.full_name)}
                  </div>
                  <span className="user-nav-name">{currentUser?.full_name?.split(' ').pop()}</span>
                </button>

                {showDropdown && (
                  <div className="user-dropdown-menu">
                    <Link to="/profile" className="user-dropdown-item">
                      <User size={16} />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <div className="user-dropdown-divider"></div>
                    <button onClick={handleLogout} className="user-dropdown-item text-danger">
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="ecom-main">
          <Outlet />
        </main>

        <footer className="ecom-footer">
          <p>© 2026 ShihoStore. Hệ Thống Quản Lý Bán Hàng Dự Án IT215. Thiết kế cao cấp.</p>
        </footer>
      </div>
    );
  }

  // Render Admin / Staff Layout (Sidebar)
  return (
    <div className="dashboard-wrapper" data-role={currentUser?.role}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Package size={20} />
          </div>
          <span className="sidebar-brand">Quản Lý Bán Hàng</span>
        </div>

        <ul className="sidebar-menu">
          {sidebarItems.map((item) => {
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
              {location.pathname === '/admin/categories' && 'Quản Lý Danh Mục Sản Phẩm'}
              {location.pathname === '/admin/customers' && 'Quản Lý Danh Sách Khách Hàng'}
              {location.pathname === '/products' && 'Quản Lý Kho Hàng & Sản Phẩm'}
              {location.pathname === '/stock-logs' && 'Nhật Ký Biến Động Kho'}
              {location.pathname === '/orders' && 'Duyệt & Quản Lý Đơn Hàng'}
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
              <span>Phân hệ: {currentUser?.role}</span>
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
