import React, { useState, useEffect } from 'react';
import { stockLogService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Database, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle
} from 'lucide-react';

const StockLogs = () => {
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
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

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    startDate: '',
    endDate: '',
    page: 0,
    size: 10
  });

  // Local input state for debouncing
  const [searchInput, setSearchInput] = useState(filters.search);

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadStockLogs = async () => {
    setLoading(true);
    try {
      const data = await stockLogService.getAll(filters);
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải nhật ký', 'Không thể lấy dữ liệu lịch sử kho.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockLogs();
  }, [filters]);

  // Sync local input state with filters state (e.g. when filters are cleared)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Debounce API calls for text search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({
          ...prev,
          search: searchInput,
          page: 0
        }));
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'search') {
      setSearchInput(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        page: 0
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: '',
      startDate: '',
      endDate: '',
      page: 0,
      size: 10
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN');
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'IMPORT': return <span className="badge badge-sales">NHẬP KHO</span>;
      case 'EXPORT': return <span className="badge badge-customer">XUẤT KHO</span>;
      case 'ADJUST': return <span className="badge badge-admin">KIỂM KHO</span>;
      default: return <span className="badge">{type}</span>;
    }
  };

  return (
    <div className="animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Filters Card */}
      <div className="card">
        <h3 className="card-title">
          <Filter size={18} />
          <span>Bộ lọc tra cứu lịch sử kho</span>
        </h3>

        <div className="storefront-controls" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto' }}>
          <div className="input-wrapper">
            <Search size={18} className="input-icon" />
            <input 
              type="text" 
              name="search"
              className="form-input" 
              placeholder="Tìm theo SKU, tên sản phẩm, lý do..." 
              value={searchInput}
              onChange={handleFilterChange}
            />
          </div>

          <select 
            name="type" 
            className="form-input"
            value={filters.type}
            onChange={handleFilterChange}
          >
            <option value="">-- Loại điều chỉnh --</option>
            <option value="IMPORT">Nhập kho (IMPORT)</option>
            <option value="EXPORT">Xuất kho (EXPORT)</option>
            <option value="ADJUST">Kiểm kho (ADJUST)</option>
          </select>

          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input 
              type="date" 
              name="startDate"
              className="form-input" 
              title="Từ ngày"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input 
              type="date" 
              name="endDate"
              className="form-input" 
              title="Đến ngày"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <button onClick={handleClearFilters} className="btn btn-secondary">
            Xóa lọc
          </button>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="card" style={{ position: 'relative', minHeight: '300px' }}>
        <h3 className="card-title">
          <Database size={18} className="text-primary" />
          <span>Nhật ký chi tiết lịch sử kho hàng</span>
        </h3>

        {showOverlay && logs.length > 0 && (
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

        {showOverlay && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <div><span className="text-secondary" style={{ fontWeight: 500 }}>Đang tải nhật ký lịch sử kho...</span></div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <AlertCircle size={40} className="text-muted" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy dữ liệu nhật ký kho phù hợp.</p>
          </div>
        ) : (
          <div style={{ opacity: showOverlay ? 0.6 : 1, pointerEvents: showOverlay ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>STT</th>
                    <th>Thời gian</th>
                    <th>Mã SKU</th>
                    <th>Tên Sản Phẩm</th>
                    <th style={{ textAlign: 'center' }}>Biến động</th>
                    <th style={{ textAlign: 'center' }}>Tồn sau thay đổi</th>
                    <th style={{ textAlign: 'center' }}>Loại GD</th>
                    <th>Người thực hiện</th>
                    <th>Lý do biến động</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log.id}>
                      <td>{filters.page * filters.size + idx + 1}</td>
                      <td>{formatDateTime(log.createdAt)}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>{log.productSku}</td>
                      <td style={{ fontWeight: 600 }}>{log.productName}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: log.changeQuantity > 0 ? 'var(--success)' : log.changeQuantity < 0 ? 'var(--error)' : 'inherit' }}>
                        {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{log.stockAfterChange}</td>
                      <td style={{ textAlign: 'center' }}>{getTypeBadge(log.type)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{log.createdByFullName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{log.createdByUsername}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', wordBreak: 'break-word', whiteSpace: 'normal' }}>{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị {logs.length}/{totalElements} giao dịch kho
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

    </div>
  );
};

export default StockLogs;
