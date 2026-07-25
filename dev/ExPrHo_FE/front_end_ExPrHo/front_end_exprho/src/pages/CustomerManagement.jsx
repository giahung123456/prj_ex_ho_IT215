import React, { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Edit, 
  Trash2,
  X, 
  Activity,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';

const CustomerManagement = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Delete confirm modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Form inputs
  const [formUsername, setFormUsername] = useState(''); // required by backend for creation
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll({
        search,
        status: statusFilter,
      });
      setCustomers(data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi dữ liệu', 'Không thể lấy danh sách khách hàng.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenAddModal = () => {
    setModalType('add');
    setSelectedCustomer(null);
    setFormUsername('');
    setFormFullName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormStatus('ACTIVE');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setModalType('edit');
    setSelectedCustomer(cust);
    setFormUsername(cust.username || '');
    setFormFullName(cust.fullName || cust.full_name || '');
    setFormPhone(cust.phone || '');
    setFormEmail(cust.email || '');
    setFormAddress(cust.address || '');
    setFormStatus(cust.status || 'ACTIVE');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (modalType === 'add' && !formUsername.trim()) {
      errors.username = 'Tên đăng nhập không được để trống';
    }
    if (!formFullName.trim()) {
      errors.fullName = 'Họ tên không được để trống';
    }

    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!formPhone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!phoneRegex.test(formPhone.replace(/\s+/g, ''))) {
      errors.phone = 'Số điện thoại phải từ 10 đến 11 số (dạng 0xxx hoặc +84xxx)';
    }

    if (formEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail)) {
        errors.email = 'Email không đúng định dạng';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalType === 'add') {
        await customerService.create({
          username: formUsername.trim(),
          fullName: formFullName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          status: formStatus,
        });
        showToast('Thành công', 'Thêm mới khách hàng thành công!', 'success');
      } else {
        await customerService.update(selectedCustomer.id, {
          fullName: formFullName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          status: formStatus,
        });
        showToast('Thành công', 'Cập nhật thông tin khách hàng thành công!', 'success');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Không thể lưu thông tin khách hàng.';
      showToast('Thao tác thất bại', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = (cust) => {
    setCustomerToDelete(cust);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsSubmitting(true);
    try {
      await customerService.delete(customerToDelete.id);
      showToast('Xóa thành công', 'Khách hàng đã được xóa khỏi hệ thống.', 'success');
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Không thể xóa khách hàng này.';
      showToast('Lỗi hệ thống', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slideup">
      {/* Search and Filters Bar */}
      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-input-wrapper" style={{ position: 'relative' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '0.85rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm khách hàng (Tên, SĐT, Email, Mã)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ width: 'auto' }}>
          <Plus size={18} />
          Thêm khách hàng
        </button>
      </div>

      {/* Customers List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>STT</th>
                <th>Mã khách hàng</th>
                <th>Họ và tên</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center', width: '150px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div 
                      style={{ 
                        display: 'inline-block', 
                        width: '24px', 
                        height: '24px', 
                        border: '3px solid var(--border)', 
                        borderTopColor: 'var(--primary)', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }} 
                    />
                    <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)' }}>Đang tải danh sách...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Không tìm thấy khách hàng nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id}>
                    <td>{cust.stt}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{cust.customerCode}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cust.fullName || cust.full_name}</td>
                    <td>{cust.phone}</td>
                    <td>{cust.email || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có</span>}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cust.address}>
                      {cust.address || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                    </td>
                    <td>
                      <span className={`badge ${cust.status === 'ACTIVE' ? 'badge-active' : 'badge-locked'}`}>
                        <span className="badge-dot" />
                        {cust.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleOpenEditModal(cust)}
                          title="Sửa thông tin"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-outline btn-xs text-danger"
                          onClick={() => handleDeleteCustomer(cust)}
                          style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}
                          title="Xóa khách hàng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: ADD / EDIT CUSTOMER */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} className="text-primary" />
                {modalType === 'add' ? 'Thêm Mới Khách Hàng' : 'Chỉnh Sửa Thông Tin Khách Hàng'}
              </span>
              <button className="modal-close-btn" onClick={handleCloseModal} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {modalType === 'add' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="custUsername">Tên đăng nhập / Username <span className="text-danger">*</span></label>
                    <div className="input-wrapper">
                      <User size={18} className="input-icon" />
                      <input
                        id="custUsername"
                        type="text"
                        className={`form-input ${formErrors.username ? 'has-error' : ''}`}
                        placeholder="Nhập tên đăng nhập cho khách hàng"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    {formErrors.username && (
                      <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                        {formErrors.username}
                      </span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="custFullName">Họ và tên khách hàng <span className="text-danger">*</span></label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      id="custFullName"
                      type="text"
                      className={`form-input ${formErrors.fullName ? 'has-error' : ''}`}
                      placeholder="Ví dụ: Nguyễn Văn A..."
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {formErrors.fullName && (
                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                      {formErrors.fullName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="custPhone">Số điện thoại <span className="text-danger">*</span></label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      id="custPhone"
                      type="text"
                      className={`form-input ${formErrors.phone ? 'has-error' : ''}`}
                      placeholder="Ví dụ: 0912345678"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {formErrors.phone && (
                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="custEmail">Địa chỉ Email</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="custEmail"
                      type="email"
                      className={`form-input ${formErrors.email ? 'has-error' : ''}`}
                      placeholder="Ví dụ: customer@gmail.com (Không bắt buộc)"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {formErrors.email && (
                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="custAddress">Địa chỉ liên hệ</label>
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <input
                      id="custAddress"
                      type="text"
                      className="form-input"
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="custStatus">Trạng thái hoạt động</label>
                  <div className="input-wrapper">
                    <Activity size={18} className="input-icon" />
                    <select
                      id="custStatus"
                      className="form-input"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      disabled={isSubmitting}
                      style={{ paddingLeft: '2.5rem' }}
                    >
                      <option value="ACTIVE">Hoạt động (Active)</option>
                      <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    style={{ width: 'auto' }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isSubmitting ? (
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          border: '2px solid rgba(255,255,255,0.3)', 
                          borderTopColor: '#fff', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite' 
                        }} 
                      />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Lưu thông tin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteConfirmOpen && customerToDelete && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="modal-title text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
                <XCircle size={22} />
                Xác Nhận Xóa Khách Hàng
              </span>
              <button className="modal-close-btn" onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa tài khoản khách hàng <strong style={{ color: 'var(--error)' }}>"{customerToDelete.fullName || customerToDelete.full_name}"</strong> ({customerToDelete.customerCode}) không? Hành động này không thể hoàn tác.
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isSubmitting}
                  style={{ width: 'auto' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={confirmDeleteCustomer}
                  disabled={isSubmitting}
                  style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--error)', border: 'none', color: '#fff' }}
                >
                  {isSubmitting ? (
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid rgba(255,255,255,0.3)', 
                        borderTopColor: '#fff', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }} 
                    />
                  ) : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
