import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, KeyRound, Eye, EyeOff, Key, ArrowLeft, RefreshCw } from 'lucide-react';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: Input Email, Step 2: Input OTP & New Pass
  const [email, setEmail] = useState('');
  const [otpVal, setOtpVal] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mockOtpCode, setMockOtpCode] = useState(''); // helper to show generated OTP in UI for mock testing
  
  const otpRefs = useRef([]);

  // Clear focus pointers on step change
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Lỗi nhập liệu', 'Vui lòng điền địa chỉ email của bạn', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.sendOTP(email.trim());
      showToast('Mã OTP đã gửi', 'Vui lòng kiểm tra email (hoặc xem ô gợi ý màu tím bên dưới)', 'success');
      
      if (res.otp) {
        setMockOtpCode(res.otp);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Email không tồn tại trên hệ thống.';
      showToast('Lỗi khôi phục', errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otpVal];
    newOtp[index] = element.value;
    setOtpVal(newOtp);

    // Auto focus next input
    if (element.value !== '' && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Handle backspace back-focus
    if (e.key === 'Backspace' && !otpVal[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const finalOtp = otpVal.join('');

    if (finalOtp.length !== 6) {
      showToast('Lỗi nhập liệu', 'Vui lòng điền đầy đủ 6 chữ số OTP', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu yếu', 'Mật khẩu mới phải có tối thiểu 6 ký tự', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu không khớp', 'Mật khẩu xác nhận mới không khớp', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email.trim(), finalOtp, newPassword);
      showToast('Khôi phục thành công', 'Mật khẩu của bạn đã được thay đổi. Hãy đăng nhập lại!', 'success');
      navigate('/login');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn.';
      showToast('Khôi phục thất bại', errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-circle auth-circle-1"></div>
      <div className="auth-circle auth-circle-2"></div>

      <div className="auth-card animate-slideup" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <KeyRound size={26} />
          </div>
          <h1 className="auth-title">Quên Mật Khẩu</h1>
          <p className="auth-subtitle">
            {step === 1 
              ? 'Nhập email để nhận mã OTP khôi phục mật khẩu' 
              : 'Xác thực mã OTP và thiết lập mật khẩu mới'
            }
          </p>
        </div>

        {step === 1 ? (
          /* STEP 1 FORM */
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email tài khoản</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="Nhập địa chỉ email đăng ký"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLoading ? 'Đang gửi mã...' : 'Gửi mã xác nhận OTP'}
            </button>
          </form>
        ) : (
          /* STEP 2 FORM */
          <form onSubmit={handleResetPassword}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Mã xác thực OTP (6 ô số)</label>
              <div className="otp-container">
                {otpVal.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="otp-input"
                    value={data}
                    ref={(el) => (otpRefs.current[index] = el)}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">Mật khẩu mới</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
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
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLoading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep(1);
                setMockOtpCode('');
                setOtpVal(['', '', '', '', '', '']);
              }}
              style={{ marginTop: '0.75rem' }}
              disabled={isLoading}
            >
              <RefreshCw size={16} />
              Quay lại bước 1
            </button>
          </form>
        )}

        {/* DEMO / TEST ASSISTANT WIDGET */}
        {step === 2 && mockOtpCode && (
          <div 
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px dashed var(--primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'var(--primary)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>🔑 Trình hỗ trợ kiểm thử giao diện</div>
            Mã OTP gửi đến email <span style={{ textDecoration: 'underline' }}>{email}</span> là: <strong>{mockOtpCode}</strong>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} />
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
