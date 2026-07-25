import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { productService, categoryService } from '../services/api';
import { 
  Plus, 
  Search, 
  Edit3, 
  Sliders, 
  AlertCircle,
  Eye, 
  Layers, 
  Filter, 
  X,
  PlusCircle,
  MinusCircle,
  ClipboardList
} from 'lucide-react';

const ProductManagement = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const isStaffPrivileged = currentUser?.role === 'ADMIN' || currentUser?.role === 'STOREKEEPER';

  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    status: '',
    page: 0,
    size: 8
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  
  // Active editing product
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form States (Product)
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    costPrice: '',
    stockQuantity: '0',
    categoryId: '',
    status: 'ACTIVE'
  });

  // Form States (Stock Adjustment)
  const [adjustForm, setAdjustForm] = useState({
    type: 'IMPORT', // IMPORT, EXPORT, ADJUST
    quantity: '',
    reason: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Load Categories & Products
  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAll({ status: 'ACTIVE' });
      setCategories(cats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll(filters);
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải dữ liệu', 'Không thể lấy danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 0 // Reset to first page on filter change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      status: '',
      page: 0,
      size: 8
    });
  };

  // Open creation modal
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setProductForm({
      sku: '',
      name: '',
      description: '',
      price: '',
      costPrice: '',
      stockQuantity: '0',
      categoryId: categories[0]?.id || '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setShowProductModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      costPrice: String(product.costPrice || 0),
      stockQuantity: String(product.stockQuantity),
      categoryId: String(product.categoryId),
      status: product.status
    });
    setFormErrors({});
    setShowProductModal(true);
  };

  // Open stock adjustment modal
  const handleOpenAdjust = (product) => {
    setSelectedProduct(product);
    setAdjustForm({
      type: 'IMPORT',
      quantity: '',
      reason: ''
    });
    setFormErrors({});
    setShowAdjustModal(true);
  };

  // Validate product form
  const validateProductForm = () => {
    const errors = {};
    if (!productForm.name.trim()) errors.name = 'Tên sản phẩm không được trống';
    if (!productForm.price || Number(productForm.price) < 0) errors.price = 'Giá bán phải >= 0';
    
    if (isStaffPrivileged) {
      if (!productForm.costPrice || Number(productForm.costPrice) < 0) errors.costPrice = 'Giá vốn phải >= 0';
      if (Number(productForm.price) < Number(productForm.costPrice)) {
        errors.price = 'Giá bán không được nhỏ hơn giá vốn';
      }
    }

    if (!selectedProduct && (!productForm.stockQuantity || Number(productForm.stockQuantity) < 0)) {
      errors.stockQuantity = 'Số lượng tồn kho ban đầu >= 0';
    }
    if (!productForm.categoryId) errors.categoryId = 'Vui lòng chọn danh mục';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save product (Create/Edit)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    try {
      const payload = {
        sku: productForm.sku,
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice),
        stockQuantity: Number(productForm.stockQuantity),
        categoryId: Number(productForm.categoryId),
        status: productForm.status
      };

      if (selectedProduct) {
        await productService.update(selectedProduct.id, payload);
        showToast('Thành công', 'Đã cập nhật thông tin sản phẩm.', 'success');
      } else {
        await productService.create(payload);
        showToast('Thành công', 'Đã thêm mới sản phẩm và tạo tồn ban đầu.', 'success');
      }

      setShowProductModal(false);
      loadProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm.';
      showToast('Lỗi lưu dữ liệu', msg, 'error');
    }
  };

  // Process stock adjustment
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
      errors.quantity = 'Số lượng điều chỉnh phải lớn hơn 0';
    }
    if (!adjustForm.reason.trim()) {
      errors.reason = 'Vui lòng nhập lý do điều chỉnh';
    }
    
    if (adjustForm.type === 'EXPORT' && Number(adjustForm.quantity) > selectedProduct.stockQuantity) {
      errors.quantity = `Số lượng xuất vượt quá tồn kho hiện có (${selectedProduct.stockQuantity})`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await productService.adjustStock(selectedProduct.id, {
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason.trim()
      });

      showToast('Thành công', 'Đã cập nhật số lượng tồn kho sản phẩm.', 'success');
      setShowAdjustModal(false);
      loadProducts();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể thực hiện điều chỉnh tồn kho.';
      showToast('Lỗi kiểm kho', msg, 'error');
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-sales">CÒN HÀNG</span>;
      case 'OUT_OF_STOCK': return <span className="badge badge-customer">HẾT HÀNG</span>;
      case 'INACTIVE': return <span className="badge badge-admin">NGỪNG BÁN</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Filter bar */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            <Filter size={18} />
            <span>Bộ lọc tra cứu sản phẩm</span>
          </h3>
          {isStaffPrivileged && (
            <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Plus size={16} />
              <span>Thêm Sản Phẩm Mới</span>
            </button>
          )}
        </div>

        <div className="storefront-controls">
          <div className="input-wrapper">
            <Search size={18} className="input-icon" />
            <input 
              type="text" 
              name="search"
              className="form-input" 
              placeholder="Tìm kiếm theo Tên hoặc SKU..." 
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <select 
            name="categoryId" 
            className="form-input" 
            style={{ minWidth: '180px' }}
            value={filters.categoryId}
            onChange={handleFilterChange}
          >
            <option value="">-- Tất cả danh mục --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            name="status" 
            className="form-input" 
            style={{ minWidth: '150px' }}
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">-- Trạng thái bán --</option>
            <option value="ACTIVE">Còn hàng</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
            <option value="INACTIVE">Ngừng bán</option>
          </select>

          <button onClick={handleClearFilters} className="btn btn-secondary">
            Xóa bộ lọc
          </button>
        </div>

        {/* Range Prices Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Khoảng giá (đ):</span>
          <input 
            type="number" 
            name="minPrice" 
            className="form-input" 
            placeholder="Giá tối thiểu" 
            style={{ maxWidth: '140px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} 
            value={filters.minPrice}
            onChange={handleFilterChange}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            type="number" 
            name="maxPrice" 
            className="form-input" 
            placeholder="Giá tối đa" 
            style={{ maxWidth: '140px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} 
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Products Table Card */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="text-secondary">Đang tải danh sách sản phẩm...</span>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <AlertCircle size={40} className="text-muted" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy sản phẩm nào phù hợp bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>STT</th>
                    <th>Mã SKU</th>
                    <th>Tên Sản Phẩm</th>
                    <th>Danh mục</th>
                    <th style={{ textAlign: 'right' }}>Giá Bán</th>
                    {isStaffPrivileged && <th style={{ textAlign: 'right' }}>Giá Vốn</th>}
                    <th style={{ textAlign: 'center' }}>Tồn kho</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    {isStaffPrivileged && <th style={{ textAlign: 'center', width: '220px' }}>Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{filters.page * filters.size + idx + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</td>
                      <td>{p.categoryName}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(p.price)}</td>
                      {isStaffPrivileged && <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatPrice(p.costPrice)}</td>}
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span style={{ color: p.stockQuantity === 0 ? 'var(--error)' : p.stockQuantity < 10 ? 'var(--warning)' : 'var(--text-main)' }}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{getStatusBadge(p.status)}</td>
                      {isStaffPrivileged && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleOpenEdit(p)} 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              title="Sửa thông tin sản phẩm"
                            >
                              <Edit3 size={12} />
                              <span>Sửa</span>
                            </button>
                            <button 
                              onClick={() => handleOpenAdjust(p)} 
                              className="btn btn-primary" 
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              title="Điều chỉnh số lượng kho hàng"
                            >
                              <Sliders size={12} />
                              <span>Kiểm kho</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị {products.length}/{totalElements} sản phẩm
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

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slideup" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Mới Sản Phẩm'}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="sku">Mã SKU (để trống tự sinh)</label>
                    <input 
                      type="text" 
                      id="sku" 
                      className="form-input" 
                      placeholder="Ví dụ: DT-IP15P"
                      value={productForm.sku}
                      onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value.trim().toUpperCase() }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="categoryId">Danh mục *</label>
                    <select 
                      id="categoryId" 
                      className={`form-input ${formErrors.categoryId ? 'is-invalid' : ''}`}
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {formErrors.categoryId && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.categoryId}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="name">Tên sản phẩm *</label>
                  <input 
                    type="text" 
                    id="name" 
                    className={`form-input ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="Nhập tên sản phẩm..."
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  {formErrors.name && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="description">Mô tả sản phẩm</label>
                  <textarea 
                    id="description" 
                    className="form-input" 
                    rows="3" 
                    placeholder="Mô tả thông số chi tiết của sản phẩm..."
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="price">Giá bán lẻ (đ) *</label>
                    <input 
                      type="number" 
                      id="price" 
                      className={`form-input ${formErrors.price ? 'is-invalid' : ''}`}
                      placeholder="Ví dụ: 30000000"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                    {formErrors.price && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.price}</span>}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="costPrice">Giá vốn nhập (đ) *</label>
                    <input 
                      type="number" 
                      id="costPrice" 
                      className={`form-input ${formErrors.costPrice ? 'is-invalid' : ''}`}
                      placeholder="Ví dụ: 25000000"
                      value={productForm.costPrice}
                      onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
                      required
                    />
                    {formErrors.costPrice && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.costPrice}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {!selectedProduct && (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="stockQuantity">Số lượng tồn kho ban đầu *</label>
                      <input 
                        type="number" 
                        id="stockQuantity" 
                        className={`form-input ${formErrors.stockQuantity ? 'is-invalid' : ''}`}
                        placeholder="Ví dụ: 10"
                        value={productForm.stockQuantity}
                        onChange={(e) => setProductForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                        required
                      />
                      {formErrors.stockQuantity && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.stockQuantity}</span>}
                    </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor="status">Trạng thái bán</label>
                    <select 
                      id="status" 
                      className="form-input"
                      value={productForm.status}
                      onChange={(e) => setProductForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="ACTIVE">Còn hàng (Đang kinh doanh)</option>
                      <option value="OUT_OF_STOCK">Hết hàng (Tạm thời)</option>
                      <option value="INACTIVE">Ngừng bán (Khóa hiển thị)</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT (KIỂM KHO) */}
      {showAdjustModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slideup" style={{ maxWidth: '450px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Điều Chỉnh Kho: {selectedProduct?.sku}</h3>
              <button className="modal-close" onClick={() => setShowAdjustModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div 
                  style={{
                    backgroundColor: 'var(--surface-hover)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div>Tên sản phẩm: <strong>{selectedProduct?.name}</strong></div>
                  <div>Tồn kho hiện tại: <strong style={{ color: 'var(--primary)' }}>{selectedProduct?.stockQuantity} cái</strong></div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Loại điều chỉnh</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.35rem',
                        border: '1px solid var(--border)', 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        backgroundColor: adjustForm.type === 'IMPORT' ? 'var(--primary-light)' : 'none',
                        borderColor: adjustForm.type === 'IMPORT' ? 'var(--primary)' : 'var(--border)',
                        color: adjustForm.type === 'IMPORT' ? 'var(--primary)' : 'inherit'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="adjustType" 
                        checked={adjustForm.type === 'IMPORT'} 
                        onChange={() => setAdjustForm(p => ({ ...p, type: 'IMPORT' }))}
                        style={{ display: 'none' }}
                      />
                      <PlusCircle size={14} />
                      Nhập Kho
                    </label>

                    <label 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.35rem',
                        border: '1px solid var(--border)', 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        backgroundColor: adjustForm.type === 'EXPORT' ? '#fee2e2' : 'none',
                        borderColor: adjustForm.type === 'EXPORT' ? '#ef4444' : 'var(--border)',
                        color: adjustForm.type === 'EXPORT' ? '#ef4444' : 'inherit'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="adjustType" 
                        checked={adjustForm.type === 'EXPORT'} 
                        onChange={() => setAdjustForm(p => ({ ...p, type: 'EXPORT' }))}
                        style={{ display: 'none' }}
                      />
                      <MinusCircle size={14} />
                      Xuất Kho
                    </label>

                    <label 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.35rem',
                        border: '1px solid var(--border)', 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        backgroundColor: adjustForm.type === 'ADJUST' ? '#fef3c7' : 'none',
                        borderColor: adjustForm.type === 'ADJUST' ? '#f59e0b' : 'var(--border)',
                        color: adjustForm.type === 'ADJUST' ? '#f59e0b' : 'inherit'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="adjustType" 
                        checked={adjustForm.type === 'ADJUST'} 
                        onChange={() => setAdjustForm(p => ({ ...p, type: 'ADJUST' }))}
                        style={{ display: 'none' }}
                      />
                      <ClipboardList size={14} />
                      Kiểm Kho
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="quantity">
                    {adjustForm.type === 'IMPORT' && 'Số lượng nhập thêm *'}
                    {adjustForm.type === 'EXPORT' && 'Số lượng xuất kho *'}
                    {adjustForm.type === 'ADJUST' && 'Số lượng tồn kho thực tế mới *'}
                  </label>
                  <input 
                    type="number" 
                    id="quantity" 
                    className={`form-input ${formErrors.quantity ? 'is-invalid' : ''}`}
                    placeholder="Nhập số lượng..."
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                  {formErrors.quantity && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.quantity}</span>}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="reason">Lý do điều chỉnh (bắt buộc) *</label>
                  <textarea 
                    id="reason" 
                    className={`form-input ${formErrors.reason ? 'is-invalid' : ''}`}
                    rows="3" 
                    placeholder="Ví dụ: Nhập hàng container mới, Bán lẻ hỏng vỡ, Phát hiện chênh lệch do kiểm hàng tháng..."
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                    required
                  />
                  {formErrors.reason && <span className="invalid-feedback" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{formErrors.reason}</span>}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác nhận điều chỉnh</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductManagement;
