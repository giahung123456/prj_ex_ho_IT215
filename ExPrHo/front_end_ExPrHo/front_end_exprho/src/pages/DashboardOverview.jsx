import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserCheck, Shield, AlertTriangle } from '../components/Icons';

const DashboardOverview = () => {
  const { currentUser } = useAuth();

  const getRoleTitle = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên (Admin)';
      case 'STOREKEEPER':
        return 'Thủ kho (Storekeeper)';
      case 'SALES':
        return 'Nhân viên bán hàng (Sales)';
      case 'CUSTOMER':
        return 'Khách mua hàng (Customer)';
      default:
        return role;
    }
  };

  const getWelcomeDescription = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Hệ thống đang hoạt động ổn định. Bạn có toàn quyền quản trị danh mục, nhân viên, sản phẩm và khách hàng.';
      case 'STOREKEEPER':
        return 'Chào mừng Thủ kho! Bạn có quyền quản trị danh sách sản phẩm, thực hiện kiểm kê kho và xem biến động kho.';
      case 'SALES':
        return 'Chào mừng nhân viên bán hàng! Bạn có thể xem thông tin sản phẩm và quản lý thông tin khách hàng.';
      case 'CUSTOMER':
        return 'Chào mừng quý khách! Hãy khám phá danh sách sản phẩm bán lẻ và tiến hành đặt hàng.';
      default:
        return '';
    }
  };

  return (
    <div className="animate-slideup">
      {/* Profile Card Summary */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {currentUser?.full_name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Chào mừng quay lại, {currentUser?.full_name}!
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge badge-${currentUser?.role?.toLowerCase()}`}>
              {getRoleTitle(currentUser?.role)}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              • {currentUser?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Privilege & Info Box */}
      <div className="card">
        <h3 className="card-title">
          <Shield size={20} className="text-primary" />
          <span>Thông tin phân quyền dữ liệu & vai trò (RBAC)</span>
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {getWelcomeDescription(currentUser?.role)}
        </p>

        {/* Warning card specifically for Sales indicating restrictions */}
        {currentUser?.role === 'SALES' && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1.25rem',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--warning)',
              fontSize: '0.9rem'
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Quy định phân quyền Nhân viên Bán hàng:</strong>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                <li>Bạn <strong>không được xem</strong> menu "Quản lý nhân viên" ở thanh điều hướng bên trái.</li>
                <li>Bạn <strong>không được xem</strong> các cột "Giá vốn" trong các bảng sản phẩm hoặc kho hàng.</li>
                <li>Bạn <strong>chỉ có quyền</strong> cập nhật thông tin khách hàng, không được quyền xóa hồ sơ khách hàng.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Info card for Storekeeper */}
        {currentUser?.role === 'STOREKEEPER' && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1.25rem',
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--secondary)',
              fontSize: '0.9rem'
            }}
          >
            <Shield size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Quy định phân quyền Thủ kho:</strong>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                <li>Bạn <strong>được xem</strong> trường Giá vốn của sản phẩm để theo dõi biến động kho.</li>
                <li>Bạn <strong>không được phép</strong> vào trang "Quản lý nhân viên" hoặc thay đổi vai trò tài khoản nhân viên.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Info card for Customer */}
        {currentUser?.role === 'CUSTOMER' && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1.25rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)',
              fontSize: '0.9rem'
            }}
          >
            <UserCheck size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Quy định phân quyền Khách hàng:</strong>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                <li>Bạn <strong>chỉ xem được giá bán lẻ</strong> của sản phẩm, tuyệt đối không nhìn thấy giá vốn nhập.</li>
                <li>Bạn chỉ có quyền tạo đơn hàng và thanh toán trên giỏ hàng cá nhân của mình.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Info card for Admin */}
        {currentUser?.role === 'ADMIN' && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              padding: '1.25rem',
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)',
              fontSize: '0.9rem'
            }}
          >
            <Shield size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Quyền hạn Quản trị viên tối cao:</strong>
              Bạn có quyền thực hiện toàn bộ thao tác CRUD (Xem, Thêm, Sửa, Xóa) trên hệ thống bao gồm thông tin nhân sự, sản phẩm, và thiết lập trạng thái mở khóa/khóa tài khoản của toàn bộ nhân viên.
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Diagnostic Cards (Only for staff roles) */}
      {currentUser?.role !== 'CUSTOMER' && (
        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {currentUser?.role === 'ADMIN' ? '3' : '2'}
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Số nhân viên trong hệ thống
            </span>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.25rem' }}>
              100%
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Hệ thống bảo mật & kết nối
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
