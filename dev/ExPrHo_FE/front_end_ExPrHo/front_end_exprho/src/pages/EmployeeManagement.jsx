import React, { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  Search, 
  UserCog, 
  Lock, 
  Unlock, 
  Edit, 
  X, 
  Mail, 
  Phone, 
  User, 
  UserCheck, 
  Key,
  Copy,
  Check
} from 'lucide-react';

const EmployeeManagement = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowOverlay(true), 250);
    } else {
      setShowOverlay(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Form inputs
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('SALES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Created employee temporary credentials display
  const [tempCredentials, setTempCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Custom Status Toggle Confirm state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [employeeToToggle, setEmployeeToToggle] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeeService.getAll({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setEmployees(data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi dữ liệu', 'Không thể lấy danh sách nhân viên.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleOpenAddModal = () => {
    setModalType('add');
    setSelectedEmp(null);
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('SALES');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setModalType('edit');
    setSelectedEmp(emp);
    setFormUsername(emp.username);
    setFormFullName(emp.full_name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormRole(emp.role);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTempCredentials(null);
  };

  const validateForm = () => {
    const errors = {};
    if (modalType === 'add' && !formUsername.trim()) {
      errors.username = 'Tên đăng nhập không được trống';
    }
    if (!formFullName.trim()) errors.fullName = 'Họ tên không được trống';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formEmail.trim()) {
      errors.email = 'Email không được trống';
    } else if (!emailRegex.test(formEmail)) {
      errors.email = 'Email không đúng định dạng';
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!formPhone.trim()) {
      errors.phone = 'Số điện thoại không được trống';
    } else if (!phoneRegex.test(formPhone.replace(/\s+/g, ''))) {
      errors.phone = 'Số điện thoại phải gồm 10-11 chữ số';
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
        const res = await employeeService.create({
          username: formUsername.trim(),
          full_name: formFullName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole,
        });

        showToast('Tạo thành công', 'Tài khoản nhân viên mới đã được tạo', 'success');
        
        // Save temp credentials to show in UI
        if (res.tempPassword) {
          setTempCredentials({
            username: formUsername.trim(),
            password: res.tempPassword,
            email: formEmail.trim(),
          });
        } else {
          setModalOpen(false);
        }
      } else {
        await employeeService.update(selectedEmp.id, {
          full_name: formFullName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole,
        });
        showToast('Cập nhật thành công', 'Thông tin nhân viên đã được thay đổi', 'success');
        setModalOpen(false);
      }
      fetchEmployees();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Không thể lưu thông tin nhân viên.';
      showToast('Thao tác thất bại', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (emp) => {
    setEmployeeToToggle(emp);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!employeeToToggle) return;
    setIsSubmitting(true);
    try {
      const res = await employeeService.toggleStatus(employeeToToggle.id, employeeToToggle.status);
      showToast(
        'Đã thay đổi trạng thái', 
        `Nhân viên ${employeeToToggle.username} hiện đang ở trạng thái: ${res.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}`, 
        'success'
      );
      setConfirmModalOpen(false);
      setEmployeeToToggle(null);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống', 'Không thể thay đổi trạng thái tài khoản.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Đã sao chép', 'Mật khẩu tạm thời đã lưu vào khay nhớ tạm', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slideup">
      {/* Search and Filters Bar */}
      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-input-wrapper">
            <Search size={18} className="search-input-wrapper" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm nhân viên (Tên, SĐT, Email)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="STOREKEEPER">Thủ kho (Storekeeper)</option>
            <option value="SALES">Bán hàng (Sales)</option>
          </select>

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="LOCKED">Bị khóa (Locked)</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ width: 'auto' }}>
          <Plus size={18} />
          Thêm nhân viên
        </button>
      </div>

      {/* Employees List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
        {showOverlay && employees.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            backdropFilter: 'blur(1px)',
            transition: 'opacity 0.2s ease',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Đang cập nhật danh sách...</span>
            </div>
          </div>
        )}
        <div className="table-responsive" style={{ opacity: showOverlay && employees.length > 0 ? 0.6 : 1, pointerEvents: showOverlay && employees.length > 0 ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên đăng nhập</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {showOverlay && employees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '5rem' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Đang tải danh sách...</span>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Không tìm thấy nhân viên nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.stt}</td>
                    <td style={{ fontWeight: 600 }}>{emp.username}</td>
                    <td>{emp.full_name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone}</td>
                    <td>
                      <span className={`badge badge-${emp.role.toLowerCase()}`}>
                        <span className="badge-dot" />
                        {emp.role === 'STOREKEEPER' ? 'Thủ kho' : 'Bán hàng'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-active' : 'badge-locked'}`}>
                        <span className="badge-dot" />
                        {emp.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleOpenEditModal(emp)}
                          title="Sửa thông tin"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className={`btn btn-xs ${emp.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(emp)}
                          style={{
                            background: emp.status === 'ACTIVE' ? '' : 'var(--success)',
                            boxShadow: 'none'
                          }}
                          title={emp.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {emp.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
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

      {/* POPUP MODAL: ADD / EDIT EMPLOYEE */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title">
                {modalType === 'add' ? 'Thêm Mới Nhân Viên' : 'Chỉnh Sửa Thông Tin Nhân Viên'}
              </span>
              <button className="modal-close-btn" onClick={handleCloseModal} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {tempCredentials ? (
                /* SUCCESS CREATED VIEW */
                <div className="animate-slideup" style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', marginBottom: '1rem' }}>
                    <UserCheck size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Tạo Tài Khoản Thành Công!
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Mật khẩu đăng nhập tạm thời đã được tạo ngẫu nhiên. Vui lòng sao chép lại:
                  </p>

                  <div 
                    style={{
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      textAlign: 'left',
                      marginBottom: '1.5rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <strong>Username:</strong> <code style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{tempCredentials.username}</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <div>
                        <strong>Mật khẩu tạm thời:</strong> <code style={{ fontSize: '0.9rem', color: 'var(--error)', fontWeight: 700 }}>{tempCredentials.password}</code>
                      </div>
                      <button 
                        className="btn btn-secondary btn-xs"
                        onClick={() => copyToClipboard(tempCredentials.password)}
                        style={{ boxShadow: 'none' }}
                      >
                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    * Hệ thống đã mô phỏng gửi email mật khẩu này đến hòm thư: {tempCredentials.email}
                  </p>
                </div>
              ) : (
                /* FORM INPUT VIEW */
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="empUsername">Tên đăng nhập / Username</label>
                    <div className="input-wrapper">
                      <User size={18} className="input-icon" />
                      <input
                        id="empUsername"
                        type="text"
                        className={`form-input ${formErrors.username ? 'has-error' : ''}`}
                        placeholder="Nhập username"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        disabled={modalType === 'edit' || isSubmitting}
                        style={modalType === 'edit' ? { backgroundColor: 'var(--background)', cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    {formErrors.username && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.username}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="empFullName">Họ và tên nhân viên</label>
                    <div className="input-wrapper">
                      <UserCheck size={18} className="input-icon" />
                      <input
                        id="empFullName"
                        type="text"
                        className={`form-input ${formErrors.fullName ? 'has-error' : ''}`}
                        placeholder="Nhập họ và tên đầy đủ"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {formErrors.fullName && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="empEmail">Địa chỉ Email</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input
                        id="empEmail"
                        type="email"
                        className={`form-input ${formErrors.email ? 'has-error' : ''}`}
                        placeholder="name@company.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {formErrors.email && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="empPhone">Số điện thoại</label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input
                        id="empPhone"
                        type="tel"
                        className={`form-input ${formErrors.phone ? 'has-error' : ''}`}
                        placeholder="Nhập số điện thoại liên hệ"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    {formErrors.phone && <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="empRole">Vai trò vận hành (Role)</label>
                    <div className="input-wrapper">
                      <UserCog size={18} className="input-icon" />
                      <select
                        id="empRole"
                        className="form-input"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        disabled={isSubmitting}
                        style={{ paddingLeft: '2.75rem', cursor: 'pointer' }}
                      >
                        <option value="STOREKEEPER">Thủ kho (Storekeeper)</option>
                        <option value="SALES">Nhân viên bán hàng (Sales)</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              {tempCredentials ? (
                <button className="btn btn-primary" onClick={handleCloseModal} style={{ width: 'auto' }}>
                  Hoàn tất
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={handleCloseModal} disabled={isSubmitting} style={{ width: 'auto' }}>
                    Hủy bỏ
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting} style={{ width: 'auto' }}>
                    {isSubmitting ? 'Đang xử lý...' : (modalType === 'add' ? 'Lưu tài khoản' : 'Cập nhật')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM TOGGLE STATUS MODAL */}
      {confirmModalOpen && employeeToToggle && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: employeeToToggle.status === 'ACTIVE' ? 'var(--error)' : 'var(--success)' }}>
                {employeeToToggle.status === 'ACTIVE' ? (
                  <>
                    <Lock size={22} className="text-danger" />
                    Xác Nhận Khóa Tài Khoản
                  </>
                ) : (
                  <>
                    <Unlock size={22} className="text-success" style={{ color: 'var(--success)' }} />
                    Xác Nhận Mở Khóa Tài Khoản
                  </>
                )}
              </span>
              <button className="modal-close-btn" onClick={() => setConfirmModalOpen(false)} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                {employeeToToggle.status === 'ACTIVE' ? (
                  <>
                    Bạn có chắc chắn muốn khóa tài khoản của nhân viên <strong style={{ color: 'var(--error)' }}>"{employeeToToggle.full_name || employeeToToggle.username}"</strong> không? Nhân viên này sẽ không thể đăng nhập vào hệ thống.
                  </>
                ) : (
                  <>
                    Bạn có chắc chắn muốn mở khóa tài khoản của nhân viên <strong style={{ color: 'var(--success)' }}>"{employeeToToggle.full_name || employeeToToggle.username}"</strong> không? Nhân viên này sẽ có thể đăng nhập lại vào hệ thống.
                  </>
                )}
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={isSubmitting}
                  style={{ width: 'auto' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmToggleStatus}
                  disabled={isSubmitting}
                  style={{ 
                    width: 'auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    backgroundColor: employeeToToggle.status === 'ACTIVE' ? 'var(--error)' : 'var(--success)', 
                    border: 'none', 
                    color: '#fff' 
                  }}
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
                    employeeToToggle.status === 'ACTIVE' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
