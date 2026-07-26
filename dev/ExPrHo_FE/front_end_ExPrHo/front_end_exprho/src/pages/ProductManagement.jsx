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

  // Local input states for debouncing
  const [searchInput, setSearchInput] = useState(filters.search);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice);
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

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [base64Image, setBase64Image] = useState(null);

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

  // Sync local input states with filters state (e.g. when filters are cleared)
  useEffect(() => {
    setSearchInput(filters.search);
    setMinPriceInput(filters.minPrice);
    setMaxPriceInput(filters.maxPrice);
  }, [filters.search, filters.minPrice, filters.maxPrice]);

  // Debounce API calls for text/number filters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        searchInput !== filters.search ||
        minPriceInput !== filters.minPrice ||
        maxPriceInput !== filters.maxPrice
      ) {
        setFilters(prev => ({
          ...prev,
          search: searchInput,
          minPrice: minPriceInput,
          maxPrice: maxPriceInput,
          page: 0
        }));
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput, minPriceInput, maxPriceInput, filters.search, filters.minPrice, filters.maxPrice]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'search') {
      setSearchInput(value);
    } else if (name === 'minPrice') {
      setMinPriceInput(value);
    } else if (name === 'maxPrice') {
      setMaxPriceInput(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        page: 0 // Reset to first page on filter change
      }));
    }
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
    setImagePreview(null);
    setBase64Image(null);
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
    
    // Load saved image from localStorage
    const savedImg = localStorage.getItem(`product_image_${product.sku}`);
    if (savedImg) {
      setImagePreview(savedImg);
      setBase64Image(savedImg);
    } else {
      setImagePreview(null);
      setBase64Image(null);
    }
    
    setShowProductModal(true);
  };

  // Open read-only details modal
  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  // Handle image upload change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ảnh quá lớn', 'Kích thước ảnh tối đa là 2MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setBase64Image(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image input
  const handleClearImage = () => {
    setImagePreview(null);
    setBase64Image(null);
    const fileInput = document.getElementById('productImage');
    if (fileInput) fileInput.value = '';
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
      let finalSku = productForm.sku.trim();
      if (!finalSku) {
        finalSku = `PROD-${Date.now().toString().slice(-6)}`;
      }
      finalSku = finalSku.toUpperCase();

      const payload = {
        sku: finalSku,
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

      // Save/remove image from localStorage
      if (base64Image) {
        localStorage.setItem(`product_image_${finalSku}`, base64Image);
      } else {
        localStorage.removeItem(`product_image_${finalSku}`);
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

  const getProductImagePlaceholder = (id, catName) => {
    const gradients = [
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
      'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
      'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)'
    ];
    const grad = gradients[(id || 0) % gradients.length];
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          background: grad, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          padding: '1rem',
          textAlign: 'center',
          minHeight: '120px'
        }}
      >
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
          {catName}
        </span>
      </div>
    );
  };

  const getProductImage = (sku, id, catName) => {
    const localImg = localStorage.getItem(`product_image_${sku}`);
    if (localImg) {
      return <img src={localImg} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }
    return getProductImagePlaceholder(id, catName);
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
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: 'auto' }}>
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
              value={searchInput}
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
            value={minPriceInput}
            onChange={handleFilterChange}
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            type="number" 
            name="maxPrice" 
            className="form-input" 
            placeholder="Giá tối đa" 
            style={{ maxWidth: '140px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }} 
            value={maxPriceInput}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Products Table Card */}
      <div className="card" style={{ position: 'relative', minHeight: '300px' }}>
        {showOverlay && products.length > 0 && (
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

        {showOverlay && products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <div><span className="text-secondary" style={{ fontWeight: 500 }}>Đang tải danh sách sản phẩm...</span></div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <AlertCircle size={40} className="text-muted" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy sản phẩm nào phù hợp bộ lọc.</p>
          </div>
        ) : (
          <div style={{ opacity: showOverlay ? 0.6 : 1, pointerEvents: showOverlay ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
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
                    <th style={{ textAlign: 'center', width: '260px' }}>Hành động</th>
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleOpenDetails(p)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            title="Xem chi tiết sản phẩm"
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                          </button>
                          {isStaffPrivileged && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
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
          </div>
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

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="productImage">Ảnh sản phẩm (File Upload)</label>
                  <input 
                    type="file" 
                    id="productImage" 
                    className="form-input" 
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ padding: '0.35rem' }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                      <button type="button" className="btn btn-secondary text-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={handleClearImage}>
                        Xóa ảnh
                      </button>
                    </div>
                  )}
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

      {/* MODAL 3: PRODUCT DETAILS (XEM CHI TIẾT) */}
      {showDetailsModal && selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Thông Tin Chi Tiết Sản Phẩm</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Product preview and core info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.25rem' }}>
                <div style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getProductImage(selectedProduct.sku, selectedProduct.id, selectedProduct.categoryName)}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                      {selectedProduct.categoryName}
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0.5rem 0', color: 'var(--text-main)' }}>
                      {selectedProduct.name}
                    </h2>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                      Mã SKU: {selectedProduct.sku}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Giá bán lẻ:</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>
                          {formatPrice(selectedProduct.price)}
                        </div>
                      </div>
                      
                      {/* Hide costPrice from Sales role */}
                      {isStaffPrivileged && selectedProduct.costPrice !== undefined && (
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Giá vốn nhập:</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
                            {formatPrice(selectedProduct.costPrice)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Metadata table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--surface-hover)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Số lượng tồn kho:</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedProduct.stockQuantity} sản phẩm</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trạng thái bán:</span>
                  <div style={{ marginTop: '0.15rem' }}>{getStatusBadge(selectedProduct.status)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ngày tạo:</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString('vi-VN') : '-'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cập nhật cuối:</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleString('vi-VN') : '-'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Mô tả chi tiết</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, backgroundColor: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', margin: 0, whiteSpace: 'pre-line' }}>
                  {selectedProduct.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
                </p>
              </div>

            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductManagement;
