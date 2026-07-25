import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService, authService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  CheckSquare, 
  AlertCircle,
  Truck
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const loadCheckoutData = async () => {
    setLoading(true);
    try {
      // 1. Load cart
      const cartData = await cartService.get();
      setCart(cartData);
      
      // If cart is empty, redirect back to cart
      if (!cartData.items || cartData.items.length === 0) {
        showToast('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi thanh toán.', 'warning');
        navigate('/cart');
        return;
      }

      // 2. Load user profile to pre-fill shipping information
      const profile = await authService.getProfile();
      setFullName(profile.full_name || profile.fullName || '');
      setShippingPhone(profile.phone || '');
      // Address might be empty or in customer database, we let user fill it or use a default if available
      setShippingAddress(profile.address || '');

    } catch (err) {
      console.error(err);
      showToast('Lỗi tải dữ liệu', 'Không thể khởi tạo thông tin thanh toán.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!shippingPhone.trim()) {
      errors.shippingPhone = 'Số điện thoại giao hàng không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(shippingPhone.trim())) {
      errors.shippingPhone = 'Số điện thoại không hợp lệ (phải từ 10-11 số)';
    }

    if (!shippingAddress.trim()) {
      errors.shippingAddress = 'Địa chỉ giao nhận hàng không được để trống';
    } else if (shippingAddress.trim().length < 10) {
      errors.shippingAddress = 'Vui lòng cung cấp địa chỉ chi tiết hơn (tối thiểu 10 ký tự)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await orderService.checkout({
        shippingPhone: shippingPhone.trim(),
        shippingAddress: shippingAddress.trim()
      });

      showToast('Đặt hàng thành công', 'Đơn hàng của bạn đã được ghi nhận và đang chờ duyệt.', 'success');
      
      // Update global cart badge
      window.dispatchEvent(new Event('cart-updated'));
      
      // Redirect to Order History
      navigate('/order-history');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể tiến hành đặt hàng. Vui lòng thử lại.';
      showToast('Đặt hàng thất bại', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <span className="text-secondary">Đang chuẩn bị hồ sơ thanh toán đơn hàng...</span>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate('/cart')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={16} />
          <span>Quay lại giỏ hàng</span>
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Xác Nhận Đơn Hàng & Thanh Toán</h2>
      </div>

      <div className="checkout-layout">
        {/* Left Form: Delivery Address */}
        <form onSubmit={handlePlaceOrder} className="checkout-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Truck size={18} className="text-primary" />
            <span>Thông Tin Nhận Hàng</span>
          </h3>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Tên người nhận (Từ hồ sơ cá nhân)</label>
            <div className="input-wrapper" style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)' }}>
              <User size={18} className="input-icon" style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                value={fullName}
                disabled 
                style={{ cursor: 'not-allowed', color: 'var(--text-secondary)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="shippingPhone">Số điện thoại nhận hàng *</label>
            <div className="input-wrapper">
              <Phone size={18} className="input-icon" />
              <input 
                type="text" 
                id="shippingPhone"
                className={`form-input ${formErrors.shippingPhone ? 'is-invalid' : ''}`} 
                placeholder="Nhập số điện thoại nhận hàng..."
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            {formErrors.shippingPhone && <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{formErrors.shippingPhone}</span>}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="shippingAddress">Địa chỉ nhận hàng chi tiết *</label>
            <div className="input-wrapper" style={{ alignItems: 'flex-start' }}>
              <MapPin size={18} className="input-icon" style={{ marginTop: '0.6rem' }} />
              <textarea 
                id="shippingAddress"
                className={`form-input ${formErrors.shippingAddress ? 'is-invalid' : ''}`} 
                rows="3"
                placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, thành phố..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                disabled={isSubmitting}
                required
                style={{ paddingLeft: '2.5rem', paddingTop: '0.5rem' }}
              />
            </div>
            {formErrors.shippingAddress && <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{formErrors.shippingAddress}</span>}
          </div>

          <div 
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.05)', 
              border: '1px dashed var(--success-border)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem',
              fontSize: '0.85rem',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}
          >
            <CheckSquare size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong>Phương thức thanh toán:</strong> Thanh toán khi nhận hàng (COD). Quý khách sẽ chỉ phải thanh toán sau khi đã nhận và kiểm tra đầy đủ sản phẩm.
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 700 }}
          >
            {isSubmitting ? 'Đang gửi đơn hàng...' : 'Xác Nhận Đặt Mua Hàng'}
          </button>
        </form>

        {/* Right Summary: Cart Items review */}
        <div className="checkout-summary-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', margin: 0 }}>
            Tóm Tắt Sản Phẩm Đã Chọn
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyBetween: 'space-between', gap: '1rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '4px', 
                  background: 'var(--background)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.6rem',
                  color: 'var(--primary)',
                  border: '1px solid var(--border)'
                }}>
                  {item.product.sku.slice(0, 3)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Số lượng: {item.quantity} x {formatPrice(item.product.price)}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{formatPrice(item.subTotal)}</span>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.5rem 0' }} />

          <div className="checkout-summary-item">
            <span>Tạm tính hàng hóa:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatPrice(cart.totalPrice)}</span>
          </div>
          <div className="checkout-summary-item">
            <span>Vận chuyển hàng COD:</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>Miễn phí</span>
          </div>

          <div className="checkout-summary-total">
            <span>Tổng thanh toán:</span>
            <span>{formatPrice(cart.totalPrice)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Checkout;
