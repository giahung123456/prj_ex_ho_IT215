import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, categoryService, cartService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Search, 
  ShoppingCart, 
  Eye, 
  Filter, 
  AlertCircle,
  X,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Package
} from 'lucide-react';

const Storefront = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    status: 'ACTIVE', // Only active products for retail customers
    page: 0,
    size: 12
  });

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Detail Modal States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

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
      showToast('Lỗi tải sản phẩm', 'Không thể tải danh mục sản phẩm của cửa hàng.', 'error');
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
      page: 0
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      status: 'ACTIVE',
      page: 0,
      size: 12
    });
  };

  const handleAddToCart = async (product, qty = 1) => {
    setIsAdding(true);
    try {
      await cartService.addItem({
        productId: product.id,
        quantity: qty
      });
      showToast('Đã thêm vào giỏ', `Đã thêm ${qty} sản phẩm ${product.name} vào giỏ hàng thành công!`, 'success');
      
      // Notify layout to refresh cart count
      window.dispatchEvent(new Event('cart-updated'));
      
      if (showDetailModal) {
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng.';
      showToast('Giỏ hàng lỗi', msg, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setBuyQty(1);
    setShowDetailModal(true);
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Generate generic abstract SVGs/Gradients placeholders for products for WOW aesthetic effect
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
          textAlign: 'center'
        }}
      >
        <Package size={48} style={{ strokeWidth: 1.5, marginBottom: '0.5rem' }} />
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

  return (
    <div className="animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Storefront Banner Hero */}
      <div className="storefront-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fffbeb', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          <Sparkles size={16} />
          <span>Khám phá sản phẩm công nghệ hot nhất</span>
        </div>
        <h1 className="storefront-title">Mua Sắm Đồ Công Nghệ Cao Cấp</h1>
        <p className="storefront-subtitle">
          Tìm kiếm những thiết bị điện tử, laptop và phụ kiện thông minh đỉnh cao nhất với mức giá chiết khấu ưu đãi hấp dẫn.
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className="card">
        <div className="storefront-controls">
          <div className="input-wrapper">
            <Search size={18} className="input-icon" />
            <input 
              type="text" 
              name="search"
              className="form-input" 
              placeholder="Bạn đang tìm kiếm thiết bị nào hôm nay?..." 
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

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="number" 
              name="minPrice" 
              className="form-input" 
              placeholder="Giá từ" 
              style={{ maxWidth: '120px' }}
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input 
              type="number" 
              name="maxPrice" 
              className="form-input" 
              placeholder="Đến" 
              style={{ maxWidth: '120px' }}
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>

          <button onClick={handleClearFilters} className="btn btn-secondary">
            Xóa lọc
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <span className="text-secondary" style={{ fontSize: '1rem', fontWeight: 600 }}>Đang chuẩn bị sản phẩm lên kệ hàng...</span>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <AlertCircle size={44} className="text-muted" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 500 }}>Rất tiếc! Cửa hàng tạm thời chưa có mặt hàng này.</p>
        </div>
      ) : (
        <>
          <div className="product-grid-retail">
            {products.map((p) => {
              const isOutOfStock = p.stockQuantity === 0;
              return (
                <div key={p.id} className="product-card-retail">
                  <div className="product-card-img-wrapper">
                    {getProductImage(p.sku, p.id, p.categoryName)}
                    <span className="product-card-badge">
                      {isOutOfStock ? (
                        <span className="badge badge-customer">HẾT HÀNG</span>
                      ) : (
                        <span className="badge badge-sales">CÒN HÀNG</span>
                      )}
                    </span>
                  </div>

                  <div className="product-card-content">
                    <span className="product-card-cat">{p.categoryName}</span>
                    <h3 className="product-card-title" title={p.name}>{p.name}</h3>
                    
                    <div className="product-card-price-row">
                      <span className="product-card-price">{formatPrice(p.price)}</span>
                      <span className="product-card-stock">
                        {isOutOfStock ? (
                          <span className="product-card-stock-out">Tạm hết</span>
                        ) : (
                          <span>Còn: <strong>{p.stockQuantity}</strong>sp</span>
                        )}
                      </span>
                    </div>

                    <div className="product-card-footer">
                      <button 
                        onClick={() => handleOpenDetail(p)}
                        className="btn btn-secondary product-card-btn-detail"
                        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                      >
                        <Eye size={16} />
                        <span>Chi tiết</span>
                      </button>

                      <button 
                        onClick={() => handleAddToCart(p, 1)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={isOutOfStock || isAdding}
                        title="Thêm nhanh vào giỏ hàng"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
              <button 
                disabled={filters.page === 0} 
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setFilters(prev => ({ ...prev, page: i }))}
                  className={`btn ${filters.page === i ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', minWidth: '40px' }}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                disabled={filters.page === totalPages - 1} 
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slideup" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Thông Tin Chi Tiết Sản Phẩm</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
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
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      {formatPrice(selectedProduct.price)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Tình trạng tồn kho: {' '}
                      {selectedProduct.stockQuantity === 0 ? (
                        <strong style={{ color: 'var(--error)' }}>Tạm hết hàng</strong>
                      ) : (
                        <span>Còn lại <strong style={{ color: 'var(--success)' }}>{selectedProduct.stockQuantity}</strong> sản phẩm</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Mô tả sản phẩm</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, backgroundColor: 'var(--background)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  {selectedProduct.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
                </p>
              </div>

              {/* Quantity Picker & Add to Cart button */}
              {selectedProduct.stockQuantity > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Số lượng đặt mua:</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="cart-qty-control">
                      <button 
                        type="button" 
                        className="cart-qty-btn"
                        onClick={() => setBuyQty(p => Math.max(1, p - 1))}
                        disabled={buyQty <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="text" 
                        className="cart-qty-input" 
                        value={buyQty} 
                        readOnly 
                      />
                      <button 
                        type="button" 
                        className="cart-qty-btn"
                        onClick={() => setBuyQty(p => Math.min(selectedProduct.stockQuantity, p + 1))}
                        disabled={buyQty >= selectedProduct.stockQuantity}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleAddToCart(selectedProduct, buyQty)}
                      className="btn btn-primary"
                      style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      disabled={isAdding}
                    >
                      <ShoppingCart size={16} />
                      <span>Thêm Vào Giỏ Hàng</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Storefront;
