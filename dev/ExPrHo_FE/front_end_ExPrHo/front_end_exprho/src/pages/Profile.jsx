import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Phone, Lock, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Profile fields state
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Lỗi nhập liệu', 'Vui lòng không bỏ trống Họ tên và Số điện thoại', 'warning');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      showToast('Cập nhật thành công', 'Thông tin cá nhân đã được lưu trữ', 'success');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.';
      showToast('Cập nhật thất bại', errorMsg, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Lỗi nhập liệu', 'Vui lòng nhập đầy đủ các thông tin mật khẩu', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu quá ngắn', 'Mật khẩu mới phải từ 6 ký tự trở lên', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu không khớp', 'Mật khẩu mới và mật khẩu xác nhận không giống nhau', 'warning');
      return;
    }

    setIsChangingPass(true);
    try {
      const { changePassword } = await import('../services/api').then(m => m.authService);
      await changePassword(currentPassword, newPassword);
      showToast('Thay đổi thành công', 'Mật khẩu đã được thay đổi thành công', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.';
      showToast('Lỗi cập nhật', errorMsg, 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="animate-slideup">
      {/* Overview user info banner */}
      <div 
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          color: 'white',
          border: 'none',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        
        <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', zIndex: 1 }}>
          Xin chào, {currentUser?.full_name}!
        </h2>
        <p style={{ opacity: 0.85, fontSize: '0.95rem', zIndex: 1 }}>
          Quản lý thông tin tài khoản của bạn và điều khiển bảo mật hệ thống
        </p>
      </div>

      <div className="grid-2">
        {/* CARD 1: UPDATE PROFILE */}
        <div className="card">
          <h3 className="card-title">
            <User size={20} className="text-primary" />
            <span>Thông tin cá nhân</span>
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Tên tài khoản (Username)</label>
              <input
                type="text"
                className="form-input"
                value={currentUser?.username || ''}
                readOnly
                style={{ backgroundColor: 'var(--background)', cursor: 'not-allowed', color: 'var(--text-secondary)', paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ Email</label>
              <input
                type="text"
                className="form-input"
                value={currentUser?.email || ''}
                readOnly
                style={{ backgroundColor: 'var(--background)', cursor: 'not-allowed', color: 'var(--text-secondary)', paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vai trò tài khoản (Role)</label>
              <input
                type="text"
                className="form-input"
                value={currentUser?.role || ''}
                readOnly
                style={{ backgroundColor: 'var(--background)', cursor: 'not-allowed', color: 'var(--text-secondary)', paddingLeft: '1rem', textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Họ và tên</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isUpdatingProfile}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Số điện thoại</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isUpdatingProfile}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isUpdatingProfile} style={{ width: 'auto', display: 'flex', float: 'right' }}>
              <Save size={18} />
              Lưu thay đổi
            </button>
            <div style={{ clear: 'both' }} />
          </form>
        </div>

        {/* CARD 2: CHANGE PASSWORD */}
        <div className="card">
          <h3 className="card-title">
            <Lock size={20} className="text-primary" />
            <span>Thay đổi mật khẩu</span>
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập mật khẩu đang sử dụng"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPass}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isChangingPass}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPass}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Nhập lại mật khẩu mới</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Xác nhận lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPass}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isChangingPass} style={{ width: 'auto', display: 'flex', float: 'right' }}>
              <CheckCircle2 size={18} />
              Cập nhật mật khẩu
            </button>
            <div style={{ clear: 'both' }} />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
