import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  CreditCard,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await cartService.get();
      setCart(data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi giỏ hàng', 'Không thể lấy thông tin giỏ hàng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (itemId, currentQty, delta) => {
    if (isUpdating) return;
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedCart = await cartService.updateQuantity(itemId, { quantity: newQty });
      setCart(updatedCart);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể cập nhật số lượng.';
      showToast('Lỗi cập nhật', msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const updatedCart = await cartService.removeItem(itemId);
      setCart(updatedCart);
      showToast('Thành công', 'Đã xóa sản phẩm khỏi giỏ hàng.', 'success');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error(err);
      showToast('Lỗi xóa sản phẩm', 'Không thể xóa sản phẩm khỏi giỏ hàng.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không?')) {
      try {
        await cartService.clear();
        setCart({ items: [], totalPrice: 0 });
        showToast('Thành công', 'Đã làm trống giỏ hàng.', 'success');
        window.dispatchEvent(new Event('cart-updated'));
      } catch (err) {
        console.error(err);
        showToast('Lỗi thao tác', 'Không thể xóa giỏ hàng.', 'error');
      }
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <span className="text-secondary">Đang mở giỏ hàng của bạn...</span>
      </div>
    );
  }

  const items = cart?.items || [];
  const hasItems = items.length > 0;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', width: 'auto' }}>
          <ArrowLeft size={16} />
          <span>Quay lại cửa hàng</span>
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={24} className="text-primary" />
          <span>Giỏ Hàng Của Bạn</span>
        </h2>
      </div>

      {!hasItems ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <AlertCircle size={48} className="text-muted" style={{ marginBottom: '1.25rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Giỏ hàng đang trống!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Hãy chọn một vài sản phẩm chất lượng để bắt đầu đặt hàng nhé.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Mua sắm ngay</button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Left: Cart Items Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="cart-table-wrapper">
              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th style={{ textAlign: 'right' }}>Giá bán</th>
                      <th style={{ textAlign: 'center' }}>Số lượng</th>
                      <th style={{ textAlign: 'right' }}>Thành tiền</th>
                      <th style={{ textAlign: 'center', width: '80px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="cart-item-info">
                            <div style={{ 
                              width: '44px', 
                              height: '44px', 
                              borderRadius: 'var(--radius-sm)', 
                              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--border) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              color: 'var(--primary)'
                            }}>
                              {item.product.sku.slice(0, 3)}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.product.categoryName}</span>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.product.name}</div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>SKU: {item.product.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(item.product.price)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="cart-qty-control">
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                className="cart-qty-btn"
                                disabled={isUpdating}
                              >
                                <Minus size={12} />
                              </button>
                              <input 
                                type="text" 
                                className="cart-qty-input" 
                                value={item.quantity} 
                                readOnly 
                              />
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                className="cart-qty-btn"
                                disabled={isUpdating}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(item.subTotal)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.15)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}
                            disabled={isUpdating}
                            title="Xóa khỏi giỏ hàng"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button 
                onClick={handleClearCart} 
                className="btn btn-secondary text-danger btn-sm" 
                style={{ borderColor: 'rgba(239, 68, 68, 0.2)', width: 'auto' }}
              >
                Xóa sạch giỏ hàng
              </button>
            </div>
          </div>

          {/* Right: Cart Summary Card */}
          <div className="card cart-summary-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              Tóm Tắt Đơn Hàng
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Giá trị giỏ hàng:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatPrice(cart.totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Phí vận chuyển:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>Miễn phí</span>
              </div>
              
              <div 
                style={{ 
                  height: '1px', 
                  backgroundColor: 'var(--border)', 
                  margin: '0.5rem 0'
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800 }}>
                <span>Tổng cộng:</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(cart.totalPrice)}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
              disabled={isUpdating}
            >
              <CreditCard size={18} />
              <span>Tiến Hành Đặt Hàng</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Đảm bảo hàng chính hãng 100% • Trả hàng miễn phí 7 ngày
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Cart;
