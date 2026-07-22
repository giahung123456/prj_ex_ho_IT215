import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Mail, Phone, UserCheck, Eye, EyeOff, ClipboardList } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const tempErrors = {};
    if (!username.trim()) tempErrors.username = 'Tên đăng nhập không được trống';
    if (!fullName.trim()) tempErrors.fullName = 'Họ tên không được trống';
    
    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      tempErrors.email = 'Email không được trống';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Định dạng email không hợp lệ';
    }

    // Phone regex (10 or 11 digits)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Số điện thoại không được trống';
    } else if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      tempErrors.phoneNumber = 'Số điện thoại phải từ 10 đến 11 chữ số';
    }

    if (password.length < 6) {
      tempErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Kiểm tra dữ liệu', 'Vui lòng kiểm tra các trường bị lỗi màu đỏ', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: username.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        password: password,
      });

      showToast('Đăng ký thành công', 'Bạn có thể đăng nhập ngay bây giờ!', 'success');
      navigate('/login');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra trong quá trình đăng ký.';
      showToast('Đăng ký thất bại', errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-circle auth-circle-1"></div>
      <div className="auth-circle auth-circle-2"></div>

      <div className="auth-card animate-slideup" style={{ maxWidth: '520px', padding: '2.5rem 2rem' }}>
        <div className="auth-header" style={{ marginBottom: '1.75rem' }}>
          <div className="auth-logo">
            <ClipboardList size={26} />
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.65rem' }}>Đăng Ký Tài Khoản</h1>
          <p className="auth-subtitle">Đăng ký trở thành khách hàng của hệ thống</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Tên đăng nhập / Username</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                className={`form-input ${errors.username ? 'has-error' : ''}`}
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.username && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Họ và tên</label>
            <div className="input-wrapper">
              <UserCheck size={18} className="input-icon" />
              <input
                id="fullName"
                type="text"
                className={`form-input ${errors.fullName ? 'has-error' : ''}`}
                placeholder="Nhập họ và tên của bạn"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.fullName && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.fullName}</span>}
          </div>

          <div className="grid-2" style={{ gap: '0px 1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className={`form-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Số điện thoại</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="phone"
                  type="tel"
                  className={`form-input ${errors.phoneNumber ? 'has-error' : ''}`}
                  placeholder="09xx..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.phoneNumber && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'has-error' : ''}`}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Nhập lại mật khẩu</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.confirmPassword ? 'has-error' : ''}`}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Bạn đã có tài khoản?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
