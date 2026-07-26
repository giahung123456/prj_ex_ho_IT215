import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  Search, 
  Layers, 
  FolderOpen, 
  FolderPlus,
  Edit, 
  Trash2,
  X, 
  FileText,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

const CategoryManagement = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
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
  const [selectedCat, setSelectedCat] = useState(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Custom Delete Confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll({
        search,
        status: statusFilter,
      });
      setCategories(data);
    } catch (err) {
      console.error(err);
      showToast('Lỗi dữ liệu', 'Không thể lấy danh sách danh mục.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAddModal = () => {
    setModalType('add');
    setSelectedCat(null);
    setFormName('');
    setFormDescription('');
    setFormStatus('ACTIVE');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setModalType('edit');
    setSelectedCat(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormStatus(cat.status);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) {
      errors.name = 'Tên danh mục không được để trống';
    } else if (formName.trim().length > 100) {
      errors.name = 'Tên danh mục không được vượt quá 100 ký tự';
    }

    if (formDescription.trim().length > 255) {
      errors.description = 'Mô tả không được vượt quá 255 ký tự';
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
        await categoryService.create({
          name: formName.trim(),
          description: formDescription.trim(),
          status: formStatus,
        });
        showToast('Tạo thành công', 'Danh mục mới đã được tạo', 'success');
      } else {
        await categoryService.update(selectedCat.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          status: formStatus,
        });
        showToast('Cập nhật thành công', 'Thông tin danh mục đã được cập nhật', 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục.';
      showToast('Thao tác thất bại', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (cat) => {
    if (cat.productCount > 0) {
      showToast('Không thể xóa', `Danh mục "${cat.name}" đang có ${cat.productCount} sản phẩm liên kết. Không thể xóa!`, 'error');
      return;
    }
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsSubmitting(true);
    try {
      await categoryService.delete(categoryToDelete.id);
      showToast('Xóa thành công', 'Danh mục sản phẩm đã được xóa khỏi hệ thống.', 'success');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Không thể xóa danh mục này.';
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
              placeholder="Tìm kiếm danh mục (Tên, mô tả)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (Active)</option>
            <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ width: 'auto' }}>
          <Plus size={18} />
          Thêm danh mục
        </button>
      </div>

      {/* Categories List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
        {showOverlay && categories.length > 0 && (
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
        <div className="table-responsive" style={{ opacity: showOverlay && categories.length > 0 ? 0.6 : 1, pointerEvents: showOverlay && categories.length > 0 ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>STT</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th style={{ textAlign: 'center' }}>Số sản phẩm liên kết</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center', width: '150px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {showOverlay && categories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '5rem' }}>
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
                    <span style={{ marginLeft: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Đang tải danh sách...</span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Không tìm thấy danh mục sản phẩm nào khớp với bộ lọc
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.stt}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cat.description}>
                      {cat.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có mô tả</span>}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      <span className="badge badge-info" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none' }}>
                        {cat.productCount} sản phẩm
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cat.status === 'ACTIVE' ? 'badge-active' : 'badge-locked'}`}>
                        <span className="badge-dot" />
                        {cat.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleOpenEditModal(cat)}
                          title="Sửa thông tin"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-outline btn-xs text-danger"
                          onClick={() => handleDeleteCategory(cat)}
                          style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}
                          title="Xóa danh mục"
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

      {/* POPUP MODAL: ADD / EDIT CATEGORY */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} className="text-primary" />
                {modalType === 'add' ? 'Thêm Mới Danh Mục Sản Phẩm' : 'Chỉnh Sửa Danh Mục Sản Phẩm'}
              </span>
              <button className="modal-close-btn" onClick={handleCloseModal} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="catName">Tên danh mục <span className="text-danger">*</span></label>
                  <div className="input-wrapper">
                    <FolderOpen size={18} className="input-icon" />
                    <input
                      id="catName"
                      type="text"
                      className={`form-input ${formErrors.name ? 'has-error' : ''}`}
                      placeholder="Ví dụ: Điện thoại, Laptop, Phụ kiện..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {formErrors.name && (
                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="catDescription">Mô tả ngắn</label>
                  <div className="input-wrapper" style={{ alignItems: 'flex-start' }}>
                    <FileText size={18} className="input-icon" style={{ marginTop: '0.65rem' }} />
                    <textarea
                      id="catDescription"
                      className={`form-input ${formErrors.description ? 'has-error' : ''}`}
                      placeholder="Mô tả tóm tắt về loại sản phẩm trong danh mục..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                      style={{ padding: '0.5rem 0.5rem 0.5rem 2.5rem', resize: 'vertical', minHeight: '80px' }}
                    />
                  </div>
                  {formErrors.description && (
                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                      {formErrors.description}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="catStatus">Trạng thái hoạt động</label>
                  <div className="input-wrapper">
                    <Activity size={18} className="input-icon" />
                    <select
                      id="catStatus"
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
                      modalType === 'add' ? <FolderPlus size={16} /> : <CheckCircle size={16} />
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
      {deleteConfirmOpen && categoryToDelete && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="modal-title text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
                <XCircle size={22} />
                Xác Nhận Xóa Danh Mục
              </span>
              <button className="modal-close-btn" onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ paddingTop: '1rem' }}>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa danh mục <strong style={{ color: 'var(--error)' }}>"{categoryToDelete.name}"</strong> không? Hành động này không thể hoàn tác.
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
                  onClick={confirmDeleteCategory}
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

export default CategoryManagement;
