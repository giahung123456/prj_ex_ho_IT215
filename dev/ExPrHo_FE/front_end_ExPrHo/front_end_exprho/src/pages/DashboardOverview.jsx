import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Package, 
  Database, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  ArrowUpRight, 
  RefreshCw,
  Clock,
  UserCheck
} from 'lucide-react';
import { productService, stockLogService, customerService, orderService } from '../services/api';
import Storefront from './Storefront';

const DashboardOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for metrics and summaries
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    totalOrders: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch products stats
      const prodRes = await productService.getAll({ size: 100 });
      const products = prodRes.content || [];
      const total = products.length;
      const outOfStock = products.filter(p => p.stockQuantity === 0).length;
      const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;

      // 2. Fetch customers stats
      const custRes = await customerService.getAll({ size: 100 });
      const customers = custRes || [];

      // 3. Fetch orders stats
      let orders = [];
      let pendingCount = 0;
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SALES') {
        const orderRes = await orderService.getAll({ size: 100 });
        orders = orderRes.content || [];
        pendingCount = orders.filter(o => o.status === 'PENDING').length;
      }

      setStats({
        totalProducts: total,
        outOfStockProducts: outOfStock,
        lowStockProducts: lowStock,
        totalCustomers: customers.length,
        pendingOrders: pendingCount,
        totalOrders: orders.length
      });

      // 4. Fetch recent logs for Storekeeper / Admin
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STOREKEEPER') {
        const logRes = await stockLogService.getAll({ page: 0, size: 5 });
        setRecentLogs(logRes.content || []);
      }

      // 5. Fetch recent orders for Sales / Admin
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SALES') {
        const orderRes = await orderService.getAll({ page: 0, size: 5 });
        setRecentOrders(orderRes.content || []);
      }

    } catch (err) {
      console.error("Error fetching dashboard overview data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  // Redirect customer directly to retail storefront (placed after all hooks to satisfy Rules of Hooks)
  if (currentUser?.role === 'CUSTOMER') {
    return <Storefront />;
  }

  const getRoleTitle = (role) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên (Admin)';
      case 'STOREKEEPER': return 'Thủ kho (Storekeeper)';
      case 'SALES': return 'Nhân viên bán hàng (Sales)';
      default: return role;
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Profile Card Summary */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.75rem' }}>
        <div 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {currentUser?.full_name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
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
        <button 
          onClick={fetchDashboardData} 
          className="btn btn-secondary" 
          style={{ marginLeft: 'auto', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Làm mới dữ liệu"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* METRICS GRID */}
      {currentUser?.role === 'STOREKEEPER' && (
        <div className="grid-3">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalProducts}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tổng số mặt hàng</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fee2e2', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>{stats.outOfStockProducts}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sản phẩm hết hàng</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef3c7', color: '#f59e0b' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{stats.lowStockProducts}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sản phẩm tồn kho thấp (&lt;10)</div>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'SALES' && (
        <div className="grid-3">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalCustomers}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tổng số khách hàng</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#fef3c7', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pendingOrders}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Đơn hàng chờ duyệt</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: '#d1fae5', color: '#10b981' }}>
              <ClipboardList size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.totalOrders}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tổng đơn đặt hàng</div>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'ADMIN' && (
        <div className="grid-4">
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG MẶT HÀNG</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{stats.totalProducts}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>HẾT HÀNG / TỒN THẤP</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--error)', marginTop: '0.25rem' }}>{stats.outOfStockProducts} / {stats.lowStockProducts}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ĐƠN CHỜ DUYỆT</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.25rem' }}>{stats.pendingOrders}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>KHÁCH HÀNG</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>{stats.totalCustomers}</div>
          </div>
        </div>
      )}

      {/* TWO COLUMNS: ACTIONS & TRANSACTIONS */}
      <div className="grid-2">
        {/* Left column: Role Description & Quick Actions */}
        <div className="card">
          <h3 className="card-title">
            <Shield size={20} className="text-primary" />
            <span>Phân Quyền & Lối Tắt Nhanh</span>
          </h3>

          {currentUser?.role === 'STOREKEEPER' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Hệ thống phân quyền <strong>Thủ Kho</strong> cho phép bạn theo dõi nhập xuất sản phẩm và giá trị vốn (`cost_price`). Bạn chịu trách nhiệm kiểm định lượng tồn kho thực tế chính xác.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Danh sách & Điều chỉnh kho</span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate('/stock-logs')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Xem nhật ký biến động kho</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentUser?.role === 'SALES' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Là nhân viên <strong>Bán Hàng</strong>, bạn có nhiệm vụ hỗ trợ khách hàng và điều chuyển trạng thái đơn hàng từ lúc đặt cho tới khi giao nhận thành công. Bạn <strong>không được xem</strong> trường Giá vốn của sản phẩm.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => navigate('/orders')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Duyệt & Quản lý đơn hàng</span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate('/admin/customers')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Quản lý danh sách khách hàng</span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Tra cứu bảng giá bán lẻ</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentUser?.role === 'ADMIN' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Tài khoản <strong>Admin</strong> quản trị tối cao. Bạn có quyền thao tác trên toàn bộ bảng dữ liệu bao gồm cấu hình danh mục sản phẩm và khóa/mở khóa tài khoản nhân sự.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button onClick={() => navigate('/admin/employees')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Nhân sự</button>
                <button onClick={() => navigate('/admin/categories')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Danh mục</button>
                <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Sản phẩm</button>
                <button onClick={() => navigate('/orders')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Đơn hàng</button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Recent logs (Storekeeper/Admin) OR Recent Orders (Sales/Admin) */}
        <div className="card">
          {(currentUser?.role === 'STOREKEEPER') && (
            <>
              <h3 className="card-title">
                <Database size={20} className="text-primary" />
                <span>Nhật ký kho gần đây</span>
              </h3>
              {recentLogs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Không có biến động kho gần đây.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Loại</th>
                        <th>Biến động</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600 }}>{log.productSku}</td>
                          <td>
                            <span className={`badge ${log.type === 'IMPORT' ? 'badge-sales' : log.type === 'EXPORT' ? 'badge-customer' : 'badge-admin'}`}>
                              {log.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: log.changeQuantity > 0 ? 'var(--success)' : log.changeQuantity < 0 ? 'var(--error)' : 'var(--text-main)' }}>
                            {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {(currentUser?.role === 'SALES') && (
            <>
              <h3 className="card-title">
                <ClipboardList size={20} className="text-primary" />
                <span>Đơn hàng mới nhất</span>
              </h3>
              {recentOrders.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Không có đơn đặt hàng nào gần đây.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 700 }}>{ord.orderCode}</td>
                          <td>{ord.username}</td>
                          <td style={{ fontWeight: 600 }}>{formatPrice(ord.totalAmount)}</td>
                          <td>
                            <span className={`badge badge-${ord.status.toLowerCase()}`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {currentUser?.role === 'ADMIN' && (
            <>
              <h3 className="card-title">
                <Database size={20} className="text-primary" />
                <span>Hoạt động hệ thống</span>
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Hệ thống đang hoạt động ở chế độ kết nối cơ sở dữ liệu.
              </p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Mock database status: <strong>Sẵn sàng</strong> (khi VITE_API_URL trống)</li>
                <li>Phát hiện biến động tồn kho: <strong>Có hoạt động ({stats.totalProducts} sp)</strong></li>
                <li>Phân hệ bảo mật & mã hóa JWT: <strong>Hoạt động bình thường</strong></li>
              </ul>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardOverview;
