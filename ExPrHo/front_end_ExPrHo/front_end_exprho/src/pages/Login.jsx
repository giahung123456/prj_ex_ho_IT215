import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  // Determine where to redirect after login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Lỗi nhập liệu', 'Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu', 'warning');
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 400);
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(username.trim(), password);
      showToast(
        'Đăng nhập thành công',
        `Chào mừng ${user.full_name || user.username} (${user.role}) trở lại!`,
        'success'
      );
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 400);
      
      const errorMsg = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
      showToast('Đăng nhập thất bại', errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-circle auth-circle-1"></div>
      <div className="auth-circle auth-circle-2"></div>

      <div className={`auth-card animate-slideup ${errorShake ? 'animate-shake' : ''}`}>
        <div className="auth-header">
          <div className="auth-logo">
            <LogIn size={26} />
          </div>
          <h1 className="auth-title">Đăng Nhập</h1>
          <p className="auth-subtitle">Nhập thông tin tài khoản của bạn để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Tên đăng nhập / Username</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Nhập username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mật khẩu / Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="form-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="rememberMe" style={{ cursor: 'pointer' }} />
              <label htmlFor="rememberMe" style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--text-secondary)' }}>
                Nhớ mật khẩu
              </label>
            </div>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Bạn chưa có tài khoản?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Đăng ký khách hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
