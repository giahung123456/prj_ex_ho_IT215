import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ClipboardList, 
  Eye, 
  X, 
  AlertCircle,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const OrderManagement = () => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active details modal order
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination & Filters
  const [filters, setFilters] = useState({
    page: 0,
    size: 10
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll(filters);
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải đơn hàng', 'Không thể lấy danh sách đơn hàng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, { status: newStatus });
      showToast('Cập nhật thành công', `Đơn hàng đã được chuyển sang trạng thái ${newStatus}`, 'success');
      loadOrders();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.';
      showToast('Lỗi cập nhật', msg, 'error');
    }
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-pending">CHỜ DUYỆT</span>;
      case 'CONFIRMED': return <span className="badge badge-confirmed">ĐÃ XÁC NHẬN</span>;
      case 'SHIPPING': return <span className="badge badge-shipping">ĐANG GIAO</span>;
      case 'COMPLETED': return <span className="badge badge-completed">HOÀN THÀNH</span>;
      case 'CANCELLED': return <span className="badge badge-cancelled">ĐÃ HỦY</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Overview Table */}
      <div className="card">
        <h3 className="card-title">
          <ClipboardList size={18} className="text-primary" />
          <span>Danh sách đơn đặt hàng từ khách hàng</span>
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="text-secondary">Đang tải danh sách đơn hàng...</span>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <AlertCircle size={40} className="text-muted" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Chưa có đơn đặt hàng nào trong hệ thống.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>STT</th>
                    <th>Mã Đơn</th>
                    <th>Ngày Đặt</th>
                    <th>Khách Hàng</th>
                    <th>Điện thoại nhận</th>
                    <th>Địa chỉ giao hàng</th>
                    <th style={{ textAlign: 'right' }}>Tổng cộng</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ textAlign: 'center', width: '280px' }}>Hành động / Phân duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => (
                    <tr key={ord.id}>
                      <td>{filters.page * filters.size + idx + 1}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{ord.orderCode}</td>
                      <td>{formatDateTime(ord.createdAt)}</td>
                      <td style={{ fontWeight: 600 }}>{ord.username}</td>
                      <td>{ord.shippingPhone}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ord.shippingAddress}>
                        {ord.shippingAddress}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(ord.totalAmount)}</td>
                      <td style={{ textAlign: 'center' }}>{getStatusBadge(ord.status)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleOpenDetails(ord)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                          </button>
                          
                          {/* Status Change Dropdown */}
                          <select
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '130px', margin: 0 }}
                            value={ord.status}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          >
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="CONFIRMED">Xác nhận</option>
                            <option value="SHIPPING">Giao hàng</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Hủy đơn</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị {orders.length}/{totalElements} đơn hàng
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    disabled={filters.page === 0} 
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Trước
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setFilters(prev => ({ ...prev, page: i }))}
                      className={`btn ${filters.page === i ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', minWidth: '35px' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={filters.page === totalPages - 1} 
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slideup" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Chi Tiết Đơn Hàng: {selectedOrder.orderCode}</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Shipping summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ backgroundColor: 'var(--surface-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Thông tin người nhận</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tài khoản: {selectedOrder.username}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SĐT nhận: {selectedOrder.shippingPhone}</div>
                </div>
                <div style={{ backgroundColor: 'var(--surface-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Địa chỉ nhận hàng</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>{selectedOrder.shippingAddress}</div>
                </div>
              </div>

              {/* Items table */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Danh sách sản phẩm mua</h4>
                <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Mã SKU</th>
                        <th>Tên sản phẩm</th>
                        <th style={{ textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ textAlign: 'center' }}>Số lượng</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.orderItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.productSku}</td>
                          <td style={{ fontWeight: 600 }}>{item.productName}</td>
                          <td style={{ textAlign: 'right' }}>{formatPrice(item.price)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatPrice(item.subTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total amount summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', alignItems: 'baseline', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tổng thanh toán đơn hàng:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{formatPrice(selectedOrder.totalAmount)}</span>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderManagement;
