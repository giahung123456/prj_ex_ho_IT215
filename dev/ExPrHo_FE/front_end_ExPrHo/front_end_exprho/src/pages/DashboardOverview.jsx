import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  AlertTriangle, 
  Package, 
  Database, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  ArrowUpRight, 
  RefreshCw,
  Clock,
  DollarSign,
  TrendingDown,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { dashboardService } from '../services/api';
import Storefront from './Storefront';

const DashboardOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Period filters: 'today', '7days', '30days', 'month'
  const [period, setPeriod] = useState('30days');
  const [adminData, setAdminData] = useState(null);
  const [storekeeperData, setStorekeeperData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (currentUser?.role === 'CUSTOMER') return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (currentUser?.role === 'ADMIN') {
        const data = await dashboardService.getAdminStats({ period });
        setAdminData(data);
      } else if (currentUser?.role === 'STOREKEEPER') {
        const data = await dashboardService.getStorekeeperStats();
        setStorekeeperData(data);
      } else if (currentUser?.role === 'SALES') {
        const data = await dashboardService.getSalesStats({ period });
        setSalesData(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics", err);
      setErrorMsg('Không thể kết nối đến máy chủ để tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role, period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Redirect customer directly to storefront
  if (currentUser?.role === 'CUSTOMER') {
    return <Storefront />;
  }

  const getRoleTitle = (role) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên (Admin)';
      case 'STOREKEEPER': return 'Thủ kho (Storekeeper)';
      case 'SALES': return 'Nhân viên bán hàng (Sales)';
      default: return role;
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Beautiful SVG Chart component
  const RenderRevenueChart = ({ trendData }) => {
    if (!trendData || trendData.length === 0) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)' }}>
          Không có dữ liệu doanh thu trong khoảng thời gian này.
        </div>
      );
    }

    const maxRevenue = Math.max(...trendData.map(item => item.revenue), 1000000); // Avoid division by 0

    const width = 600;
    const height = 240;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = trendData.map((item, index) => {
      const x = paddingLeft + (index / (trendData.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (item.revenue / maxRevenue) * chartHeight;
      return { x, y, date: item.date, revenue: item.revenue };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    let areaD = '';
    if (points.length > 0) {
      areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    // Helper to format Y-axis labels
    const formatYLabel = (val) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
      return val;
    };

    return (
      <div className="chart-container" style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible', minWidth: '500px' }}>
          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartHeight * ratio;
            const value = maxRevenue * (1 - ratio);
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={paddingLeft + chartWidth} 
                  y2={y} 
                  stroke="var(--border)" 
                  strokeWidth="0.5" 
                  strokeDasharray="4,4" 
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 3} 
                  fontSize="10" 
                  fill="var(--text-secondary)" 
                  textAnchor="end"
                  fontFamily="inherit"
                >
                  {formatYLabel(value)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartAreaGrad)" />}

          {/* Path line */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Data points */}
          {points.map((p, i) => {
            const isLabelPoint = i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1;
            const hasRevenue = p.revenue > 0;
            if (!hasRevenue && !isLabelPoint) return null;
            return (
              <g key={i} className="chart-dot">
                <circle 
                  cx={p.x}
                  cy={p.y}
                  r={hasRevenue ? "5" : "3.5"}
                  fill={hasRevenue ? "var(--primary)" : "white"}
                  stroke="var(--primary)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.2s ease' }}
                />
                {hasRevenue && (
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    fontSize="9" 
                    fill="var(--text-main)" 
                    fontWeight="700" 
                    textAnchor="middle"
                  >
                    {formatYLabel(p.revenue)}
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.filter((_, idx) => idx === 0 || idx === Math.floor(points.length / 4) || idx === Math.floor(points.length / 2) || idx === Math.floor(points.length * 3 / 4) || idx === points.length - 1).map((p, i) => (
            <text 
              key={i} 
              x={p.x} 
              y={height - 15} 
              fontSize="10" 
              fill="var(--text-secondary)" 
              textAnchor="middle"
            >
              {p.date.split('-').slice(1).reverse().join('/')}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  const RenderDonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return (
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Không có dữ liệu cơ cấu.
        </div>
      );
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];
    let accumulatedPercentage = 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '1rem', width: '100%', flexWrap: 'wrap' }}>
        <svg width="150" height="150" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border)" strokeWidth="4" />
          {data.map((item, idx) => {
            const percentage = (item.value / total) * 100;
            const strokeWidth = 4;
            const color = colors[idx % colors.length];
            const dashArray = `${percentage} ${100 - percentage}`;
            const dashOffset = 100 - accumulatedPercentage + 25;
            accumulatedPercentage += percentage;

            return (
              <circle 
                key={idx}
                cx="21" 
                cy="21" 
                r="15.915" 
                fill="transparent" 
                stroke={color} 
                strokeWidth={strokeWidth} 
                strokeDasharray={dashArray} 
                strokeDashoffset={dashOffset}
                style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                title={`${item.name}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
          <g style={{ transform: 'rotate(90deg) translate(0px, -42px)' }}>
            <text x="21" y="22" textAnchor="middle" fontSize="3.5" fontWeight="800" fill="var(--text-main)">Tổng</text>
            <text x="21" y="27" textAnchor="middle" fontSize="2.8" fill="var(--text-secondary)" fontWeight="700">
              {total >= 1000000 ? (total / 1000000).toFixed(1) + 'M' : total}
            </text>
          </g>
        </svg>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '120px' }}>
          {data.map((item, idx) => {
            const percentage = (item.value / total) * 100;
            const color = colors[idx % colors.length];
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} title={item.name}>{item.name}:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const RenderBarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const width = 450;
    const height = 220;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = (chartWidth / data.length) * 0.55;
    const gap = (chartWidth / data.length) * 0.45;

    return (
      <div style={{ width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="barChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartHeight * ratio;
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={paddingLeft + chartWidth} 
                  y2={y} 
                  stroke="var(--border)" 
                  strokeWidth="0.5" 
                  strokeDasharray="4,4" 
                />
                <text x={paddingLeft - 8} y={y + 3} fontSize="9" fill="var(--text-secondary)" textAnchor="end">
                  {Math.round(maxVal * (1 - ratio))}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const x = paddingLeft + idx * (barWidth + gap) + gap / 2;
            const barHeight = (item.value / maxVal) * chartHeight;
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={idx}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#barChartGrad)"
                  rx="3"
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                />
                <text x={x + barWidth / 2} y={y - 5} fontSize="9" fontWeight="700" fill="var(--text-main)" textAnchor="middle">
                  {item.value}
                </text>
                <text 
                  x={x + barWidth / 2} 
                  y={paddingTop + chartHeight + 15} 
                  fontSize="8.5" 
                  fill="var(--text-secondary)" 
                  textAnchor="middle"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {item.label && item.label.length > 9 ? item.label.slice(0, 7) + '..' : (item.label || '')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const RenderHorizontalBarChart = ({ data }) => {
    const entries = Object.entries(data);
    const maxVal = Math.max(...entries.map(([_, v]) => v), 1);
    const colors = {
      PENDING: 'var(--warning)',
      CONFIRMED: 'var(--primary)',
      SHIPPING: 'var(--secondary)',
      COMPLETED: 'var(--success)',
      CANCELLED: 'var(--error)'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.5rem 0', width: '100%' }}>
        {entries.map(([status, count]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '85px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {status}
            </div>
            <div style={{ flex: 1, height: '18px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(count / maxVal) * 100}%`, 
                  background: colors[status] || 'var(--primary)',
                  borderRadius: '4px',
                  transition: 'width 0.8s ease'
                }} 
              />
              <span style={{ position: 'absolute', right: '8px', top: '1px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {count} đơn
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-slideup" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      
      {/* Profile Card Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.75rem', position: 'relative' }}>
        <div 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 800,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {currentUser?.full_name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            Chào mừng quay lại, {currentUser?.full_name}!
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge badge-${currentUser?.role?.toLowerCase()}`}>
              {getRoleTitle(currentUser?.role)}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              • {currentUser?.email}
            </span>
          </div>
        </div>

        {/* Refresher and Filter */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SALES') && (
            <div style={{ display: 'flex', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
              {[
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày' },
                { key: '30days', label: '30 ngày' },
                { key: 'month', label: 'Tháng này' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setPeriod(opt.key)}
                  className={`btn ${period === opt.key ? 'btn-primary' : ''}`}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    boxShadow: 'none',
                    background: period === opt.key ? 'var(--primary)' : 'transparent',
                    color: period === opt.key ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={fetchDashboardData} 
            className="btn btn-secondary" 
            style={{ 
              padding: 0, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              minWidth: '36px',
              flexShrink: 0
            }}
            title="Làm mới dữ liệu"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--error)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle className="text-error" size={20} />
          <span style={{ fontSize: '0.9rem', color: 'var(--error)', fontWeight: 500 }}>{errorMsg}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(255, 255, 255, 0.4)', 
          zIndex: 100, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(1px)'
        }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        </div>
      )}

      {/* ========================================================
          1. ADMIN DASHBOARD VIEW
          ======================================================== */}
      {currentUser?.role === 'ADMIN' && adminData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Admin Metrics Summary */}
          <div className="grid-4">
            <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 700 }}>DOANH THU ({period === 'today' ? 'HÔM NAY' : period === '7days' ? '7 NGÀY' : period === 'month' ? 'THÁNG NÀY' : '30 NGÀY'})</span>
                <DollarSign size={18} className="text-primary" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.5rem' }}>{formatPrice(adminData.totalRevenue)}</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 700 }}>TỔNG ĐƠN HÀNG</span>
                <ClipboardList size={18} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#064e3b', marginTop: '0.5rem' }}>{adminData.ordersCount} đơn</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #fefeff 0%, #f3e8ff 100%)', border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b21a8', fontWeight: 700 }}>MẶT HÀNG / KHÁCH HÀNG</span>
                <Package size={18} style={{ color: '#7c3aed' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#581c87', marginTop: '0.5rem' }}>{adminData.productsCount} sp / {adminData.customersCount} kh</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700 }}>CẢNH BÁO TỒN THẤP</span>
                <AlertTriangle size={18} className="text-warning" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#78350f', marginTop: '0.5rem' }}>{adminData.lowStockCount} sản phẩm</div>
            </div>
          </div>

          {/* Chart Row 1: Line Chart & Donut Chart */}
          <div className="grid-2">
            {/* Revenue Trend Chart */}
            <div className="card">
              <h3 className="card-title">
                <TrendingUp size={20} className="text-primary" />
                <span>Biểu đồ doanh thu theo thời gian ({period === 'today' ? 'Hôm nay' : period === '7days' ? '7 ngày qua' : period === 'month' ? 'Tháng này' : '30 ngày qua'})</span>
              </h3>
              <div style={{ marginTop: '1rem' }}>
                <RenderRevenueChart trendData={adminData.revenueTrend} />
              </div>
            </div>

            {/* Category Revenue Donut Chart */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">
                <TrendingUp size={20} className="text-primary" />
                <span>Cơ cấu doanh thu theo Danh mục</span>
              </h3>
              <div style={{ marginTop: '1rem', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                <RenderDonutChart 
                  data={adminData.categoryRevenue.map(c => ({ name: c.categoryName, value: c.revenue }))} 
                />
              </div>
            </div>
          </div>

          {/* Chart Row 2: Top Selling Products Bar Chart & Orders by Status */}
          <div className="grid-2">
            {/* Left: Top selling products (Vertical Bar Chart) */}
            <div className="card">
              <h3 className="card-title">
                <Package size={20} className="text-primary" />
                <span>Biểu đồ sản phẩm bán chạy nhất</span>
              </h3>
              <div style={{ marginTop: '1rem', minHeight: '220px', display: 'flex', alignItems: 'center' }}>
                {adminData.topProducts?.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0', width: '100%' }}>Không có sản phẩm nào bán chạy.</p>
                ) : (
                  <RenderBarChart 
                    data={adminData.topProducts.map(p => ({ label: p.sku || p.productName || 'SP', value: p.quantitySold }))} 
                  />
                )}
              </div>
            </div>

            {/* Right: Orders by Status Breakdown */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">
                <ClipboardList size={20} className="text-primary" />
                <span>Phân bổ trạng thái đơn đặt hàng</span>
              </h3>
              <div style={{ marginTop: '1rem', display: 'flex', flex: 1, alignItems: 'center', width: '100%', minHeight: '220px' }}>
                {Object.keys(adminData.ordersByStatus || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0', width: '100%' }}>Chưa phát sinh đơn hàng nào.</p>
                ) : (
                  <RenderHorizontalBarChart data={adminData.ordersByStatus} />
                )}
              </div>
            </div>
          </div>

          {/* Grid 2: Recent Orders and Low Stock alerts */}
          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            {/* Left: Recent Orders System-wide */}
            <div className="card">
              <h3 className="card-title">
                <ClipboardList size={20} className="text-primary" />
                <span>Đơn hàng mới nhất toàn hệ thống</span>
              </h3>
              {adminData.recentOrders?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Không có đơn hàng nào gần đây.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.recentOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 700 }}>{ord.orderCode}</td>
                          <td>{ord.username || 'Khách'}</td>
                          <td style={{ fontWeight: 600 }}>{formatPrice(ord.totalAmount)}</td>
                          <td>
                            <span className={`badge badge-${ord.status.toLowerCase()}`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Top 5 Highest Stock Products */}
            <div className="card">
              <h3 className="card-title">
                <Package size={20} className="text-primary" />
                <span>Top 5 sản phẩm tồn kho nhiều nhất</span>
              </h3>
              {!adminData.highestStockProducts || adminData.highestStockProducts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Không có sản phẩm nào trong kho.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Số lượng tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.highestStockProducts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700 }}>{p.sku}</td>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.categoryName}</td>
                          <td>
                            <span className="badge badge-completed">
                              {p.stockQuantity} sp
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. STOREKEEPER DASHBOARD VIEW
          ======================================================== */}
      {currentUser?.role === 'STOREKEEPER' && storekeeperData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Storekeeper Stats Summaries */}
          <div className="grid-3">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Package size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{storekeeperData.totalProducts}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tổng số mặt hàng</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: storekeeperData.outOfStockCount > 0 ? '#fee2e2' : 'var(--bg-light)', color: storekeeperData.outOfStockCount > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: storekeeperData.outOfStockCount > 0 ? '#ef4444' : 'var(--text-main)' }}>{storekeeperData.outOfStockCount}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sản phẩm đã hết hàng</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: storekeeperData.lowStockCount > 0 ? '#fef3c7' : 'var(--bg-light)', color: storekeeperData.lowStockCount > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: storekeeperData.lowStockCount > 0 ? '#f59e0b' : 'var(--text-main)' }}>{storekeeperData.lowStockCount}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sản phẩm sắp hết hàng (&lt;10)</div>
              </div>
            </div>
          </div>

          {/* Daily Stock Movements Panel */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
              <Database size={20} className="text-primary" />
              <span>Biến động kho hàng trong ngày hôm nay</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>+{storekeeperData.dailyImportCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LƯỢT NHẬP KHO THỦ CÔNG</div>
              </div>
              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--error)' }}>-{storekeeperData.dailyExportCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LƯỢT XUẤT ĐƠN HÀNG</div>
              </div>
              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{storekeeperData.dailyAdjustCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LƯỢT KIỂM KHO ĐIỀU CHỈNH</div>
              </div>
              <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{storekeeperData.dailyTotalChangeQuantity}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG BIẾN ĐỘNG SỐ LƯỢNG</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Category Stock Allocation (Donut Chart) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">
                <Database size={20} className="text-primary" />
                <span>Biểu đồ cơ cấu sản phẩm theo danh mục</span>
              </h3>
              <div style={{ marginTop: '1.25rem', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                {Object.keys(storekeeperData.categoryStockAllocation || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0', width: '100%' }}>Không có danh mục nào chứa sản phẩm.</p>
                ) : (
                  <RenderDonutChart 
                    data={Object.entries(storekeeperData.categoryStockAllocation).map(([catName, count]) => ({ name: catName, value: count }))} 
                  />
                )}
              </div>
            </div>

            {/* Lowest Stock Products Table */}
            <div className="card">
              <h3 className="card-title">
                <AlertTriangle size={20} className="text-warning" />
                <span>Top 10 sản phẩm tồn kho thấp nhất (Cần chú ý)</span>
              </h3>
              {storekeeperData.lowestStockProducts?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Kho đã được lấp đầy, không có sản phẩm nào sắp hết.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '1rem' }}>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Tồn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storekeeperData.lowestStockProducts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700 }}>{p.sku}</td>
                          <td style={{ fontWeight: 500 }}>{p.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.categoryName}</td>
                          <td>
                            <span 
                              className={`badge ${p.stockQuantity === 0 ? 'badge-cancelled' : p.stockQuantity < 10 ? 'badge-pending' : 'badge-completed'}`}
                              style={{ display: 'inline-block', minWidth: '40px', textAlign: 'center' }}
                            >
                              {p.stockQuantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. SALES DASHBOARD VIEW
          ======================================================== */}
      {currentUser?.role === 'SALES' && salesData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Sales Stats Summaries */}
          <div className="grid-2">
            <div className="card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 700 }}>ĐƠN CHỐT THÀNH CÔNG (HỆ THỐNG)</span>
                <ClipboardList size={18} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#064e3b', marginTop: '0.5rem' }}>{salesData.ordersByStatus?.COMPLETED || 0} đơn</div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700 }}>ĐƠN CHỜ DUYỆT (HỆ THỐNG)</span>
                <Clock size={18} className="text-warning" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#78350f', marginTop: '0.5rem' }}>{salesData.ordersByStatus?.PENDING || 0} đơn</div>
            </div>
          </div>

          {/* Charts Row for Sales */}
          <div className="grid-2">
            {/* Top 5 Highest Priced Orders for Sales */}
            <div className="card">
              <h3 className="card-title">
                <ClipboardList size={20} className="text-primary" />
                <span>Top 5 đơn hàng có giá cao nhất</span>
              </h3>
              {salesData.highestPricedOrders?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Không có đơn hàng nào.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.highestPricedOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 700 }}>{ord.orderCode}</td>
                          <td>{ord.username || 'Khách'}</td>
                          <td style={{ fontWeight: 600 }}>{formatPrice(ord.totalAmount)}</td>
                          <td>
                            <span className={`badge badge-${ord.status.toLowerCase()}`}>
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Orders Status breakdown for Sales */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">
                <ClipboardList size={20} className="text-primary" />
                <span>Phân bổ trạng thái đơn đặt hàng (Hệ thống)</span>
              </h3>
              <div style={{ marginTop: '1rem', display: 'flex', flex: 1, alignItems: 'center', width: '100%', minHeight: '220px' }}>
                {Object.keys(salesData.ordersByStatus || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0', width: '100%' }}>Chưa phát sinh đơn hàng nào.</p>
                ) : (
                  <RenderHorizontalBarChart data={salesData.ordersByStatus} />
                )}
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Left: Role Navigation Shortcuts */}
            <div className="card">
              <h3 className="card-title">
                <Shield size={20} className="text-primary" />
                <span>Chức năng Bán hàng</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Là nhân viên <strong>Bán Hàng</strong>, bạn có nhiệm vụ hỗ trợ khách hàng và điều chuyển trạng thái đơn hàng từ lúc đặt cho tới khi giao nhận thành công. Bạn <strong>không được xem</strong> trường Giá vốn của sản phẩm.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => navigate('/orders')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Duyệt & Quản lý đơn hàng</span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate('/admin/customers')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Quản lý danh sách khách hàng</span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => navigate('/products')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span>Tra cứu bảng giá bán lẻ</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Right: Top Selling Products List */}
            <div className="card">
              <h3 className="card-title">
                <Package size={20} className="text-primary" />
                <span>Top 5 sản phẩm bán chạy nhất hệ thống</span>
              </h3>
              {salesData.topProducts?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Không có sản phẩm nào bán chạy.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Mã SKU</th>
                        <th>Số lượng</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.topProducts.map((p) => (
                        <tr key={p.productId}>
                          <td style={{ fontWeight: 600 }}>{p.productName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.sku || '-'}</td>
                          <td style={{ fontWeight: 700 }}>{p.quantitySold}</td>
                          <td style={{ fontWeight: 600 }}>{formatPrice(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
