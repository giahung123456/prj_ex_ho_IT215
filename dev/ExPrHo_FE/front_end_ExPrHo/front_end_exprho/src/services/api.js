import axios from 'axios';

// Toggle between using real backend APIs or local storage mock endpoints
const USE_MOCK = false;

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

/* ==========================================
   HIGH-FIDELITY MOCK LAYER FOR OFFLINE TESTING
   ========================================== */

const MOCK_DB_VERSION = '1.0';

const initMockDatabase = () => {
  if (localStorage.getItem('mock_db_version') === MOCK_DB_VERSION) {
    return;
  }

  // Prepopulate initial users database
  const initialUsers = [
    {
      id: 'u-1',
      username: 'admin',
      password: 'password123', // stored in plain text for simple mock matching
      email: 'admin@company.com',
      phone: '0987654321',
      full_name: 'Nguyễn Văn Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      id: 'u-2',
      username: 'keeper',
      password: 'password123',
      email: 'keeper@company.com',
      phone: '0912345678',
      full_name: 'Trần Thủ Kho',
      role: 'STOREKEEPER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      id: 'u-3',
      username: 'sales',
      password: 'password123',
      email: 'sales@company.com',
      phone: '0934567890',
      full_name: 'Lê Thị Bán Hàng',
      role: 'SALES',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    },
    {
      id: 'u-4',
      username: 'customer',
      password: 'password123',
      email: 'customer@gmail.com',
      phone: '0909090909',
      full_name: 'Phạm Khách Hàng',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    }
  ];

  localStorage.setItem('mock_users', JSON.stringify(initialUsers));
  localStorage.setItem('mock_db_version', MOCK_DB_VERSION);
  localStorage.setItem('mock_otps', JSON.stringify({}));

  const initialCategories = [
    {
      id: 1,
      name: 'Điện thoại',
      description: 'Các dòng điện thoại thông minh',
      status: 'ACTIVE',
      productCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Laptop',
      description: 'Máy tính xách tay văn phòng và gaming',
      status: 'ACTIVE',
      productCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Phụ kiện',
      description: 'Tai nghe, cáp sạc, chuột, bàn phím',
      status: 'ACTIVE',
      productCount: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  localStorage.setItem('mock_categories', JSON.stringify(initialCategories));

  const initialCustomers = [
    {
      id: 1,
      customerCode: 'KH0001',
      username: 'customer1',
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      email: 'nva@gmail.com',
      address: '123 Đường Láng, Hà Nội',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      customerCode: 'KH0002',
      username: 'customer2',
      fullName: 'Trần Thị B',
      phone: '0987654321',
      email: 'ttb@gmail.com',
      address: '456 Lê Lợi, TP HCM',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      customerCode: 'KH0003',
      username: 'customer3',
      fullName: 'Lê Văn C',
      phone: '0905123456',
      email: 'lvc@gmail.com',
      address: '789 Nguyễn Hữu Thọ, Đà Nẵng',
      status: 'INACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  localStorage.setItem('mock_customers', JSON.stringify(initialCustomers));

  // Initialize mock products
  const initialProducts = [
    {
      id: 1,
      sku: 'DT-IPHONE15P',
      name: 'iPhone 15 Pro Max 256GB',
      description: 'Điện thoại di động iPhone 15 Pro Max 256GB Titanium tự nhiên chính hãng Apple Việt Nam.',
      price: 32990000,
      costPrice: 27500000,
      stockQuantity: 15,
      status: 'ACTIVE',
      categoryId: 1,
      categoryName: 'Điện thoại',
      createdAt: new Date(Date.now() - 5*24*3600*1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      sku: 'DT-SAMS24U',
      name: 'Samsung Galaxy S24 Ultra 5G',
      description: 'Điện thoại thông minh tích hợp trí tuệ nhân tạo Galaxy AI, camera 200MP zoom quang học 10x.',
      price: 29990000,
      costPrice: 24000000,
      stockQuantity: 8,
      status: 'ACTIVE',
      categoryId: 1,
      categoryName: 'Điện thoại',
      createdAt: new Date(Date.now() - 4*24*3600*1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      sku: 'LT-MACAIRM3',
      name: 'Apple MacBook Air 13 inch M3 2024',
      description: 'Laptop mỏng nhẹ nhất thế giới chip Apple M3 siêu mạnh mẽ, RAM 8GB SSD 256GB màn hình Liquid Retina.',
      price: 27990000,
      costPrice: 23500000,
      stockQuantity: 12,
      status: 'ACTIVE',
      categoryId: 2,
      categoryName: 'Laptop',
      createdAt: new Date(Date.now() - 3*24*3600*1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      sku: 'LT-DELLXPS13',
      name: 'Dell XPS 13 Plus 9320 Core i7',
      description: 'Dòng máy tính xách tay cao cấp dành cho doanh nhân, thiết kế đột phá, màn hình OLED cảm ứng 3.5K.',
      price: 45990000,
      costPrice: 38000000,
      stockQuantity: 4,
      status: 'ACTIVE',
      categoryId: 2,
      categoryName: 'Laptop',
      createdAt: new Date(Date.now() - 3*24*3600*1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 5,
      sku: 'PK-AIRPRO2',
      name: 'Tai nghe Bluetooth Apple AirPods Pro 2 USB-C',
      description: 'Tai nghe chống ồn chủ động ANC thế hệ 2 mới nhất từ Apple với chân sạc USB-C phổ biến.',
      price: 5990000,
      costPrice: 4500000,
      stockQuantity: 45,
      status: 'ACTIVE',
      categoryId: 3,
      categoryName: 'Phụ kiện',
      createdAt: new Date(Date.now() - 2*24*3600*1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 6,
      sku: 'PK-KEYCHRONK2',
      name: 'Bàn phím cơ không dây Keychron K2 V2',
      description: 'Bàn phím cơ layout 75% gọn nhẹ, kết nối Bluetooth đa thiết bị, switch Gateron bền bỉ.',
      price: 1890000,
      costPrice: 1350000,
      stockQuantity: 0,
      status: 'OUT_OF_STOCK',
      categoryId: 3,
      categoryName: 'Phụ kiện',
      createdAt: new Date(Date.now() - 1*24*3600*1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  localStorage.setItem('mock_products', JSON.stringify(initialProducts));

  // Initialize mock stock logs
  const initialStockLogs = [
    {
      id: 1,
      productId: 1,
      productSku: 'DT-IPHONE15P',
      productName: 'iPhone 15 Pro Max 256GB',
      changeQuantity: 15,
      type: 'IMPORT',
      reason: 'Khởi tạo tồn kho ban đầu',
      createdByUsername: 'admin',
      createdByFullName: 'Nguyễn Văn Admin',
      stockAfterChange: 15,
      createdAt: new Date(Date.now() - 5*24*3600*1000).toISOString()
    },
    {
      id: 2,
      productId: 2,
      productSku: 'DT-SAMS24U',
      productName: 'Samsung Galaxy S24 Ultra 5G',
      changeQuantity: 8,
      type: 'IMPORT',
      reason: 'Khởi tạo tồn kho ban đầu',
      createdByUsername: 'keeper',
      createdByFullName: 'Trần Thủ Kho',
      stockAfterChange: 8,
      createdAt: new Date(Date.now() - 4*24*3600*1000).toISOString()
    },
    {
      id: 3,
      productId: 3,
      productSku: 'LT-MACAIRM3',
      productName: 'Apple MacBook Air 13 inch M3 2024',
      changeQuantity: 12,
      type: 'IMPORT',
      reason: 'Khởi tạo tồn kho ban đầu',
      createdByUsername: 'keeper',
      createdByFullName: 'Trần Thủ Kho',
      stockAfterChange: 12,
      createdAt: new Date(Date.now() - 3*24*3600*1000).toISOString()
    },
    {
      id: 4,
      productId: 4,
      productSku: 'LT-DELLXPS13',
      productName: 'Dell XPS 13 Plus 9320 Core i7',
      changeQuantity: 4,
      type: 'IMPORT',
      reason: 'Nhập hàng lô mới',
      createdByUsername: 'keeper',
      createdByFullName: 'Trần Thủ Kho',
      stockAfterChange: 4,
      createdAt: new Date(Date.now() - 3*24*3600*1000).toISOString()
    },
    {
      id: 5,
      productId: 5,
      productSku: 'PK-AIRPRO2',
      productName: 'Tai nghe Bluetooth Apple AirPods Pro 2 USB-C',
      changeQuantity: 50,
      type: 'IMPORT',
      reason: 'Khởi tạo tồn kho ban đầu',
      createdByUsername: 'admin',
      createdByFullName: 'Nguyễn Văn Admin',
      stockAfterChange: 50,
      createdAt: new Date(Date.now() - 2*24*3600*1000).toISOString()
    },
    {
      id: 6,
      productId: 5,
      productSku: 'PK-AIRPRO2',
      productName: 'Tai nghe Bluetooth Apple AirPods Pro 2 USB-C',
      changeQuantity: -5,
      type: 'EXPORT',
      reason: 'Xuất kho lỗi bảo hành trả hãng',
      createdByUsername: 'keeper',
      createdByFullName: 'Trần Thủ Kho',
      stockAfterChange: 45,
      createdAt: new Date(Date.now() - 1*24*3600*1000).toISOString()
    }
  ];
  localStorage.setItem('mock_stock_logs', JSON.stringify(initialStockLogs));

  // Initialize mock cart and orders
  localStorage.setItem('mock_cart', JSON.stringify([]));
  localStorage.setItem('mock_orders', JSON.stringify([]));
};

initMockDatabase();

// Helper functions for mock DB manipulation
const getMockUsers = () => JSON.parse(localStorage.getItem('mock_users') || '[]');
const setMockUsers = (users) => localStorage.setItem('mock_users', JSON.stringify(users));

// Helper for delays to simulate network requests
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/* ==========================================
   AUTHENTICATION & PROFILE SERVICES
   ========================================== */

export const authService = {
  login: async (username, password) => {
    if (!USE_MOCK) {
      const response = await api.post('/auth/login', { username, password });
      const { token, role } = response.data;
      
      // Temporarily store token so the profile request is authorized
      localStorage.setItem('auth_token', token);
      
      // Fetch user profile details from backend
      const profileResponse = await api.get('/profile');
      const profile = profileResponse.data;
      
      return {
        token,
        user: {
          username: profile.username,
          email: profile.email,
          full_name: profile.fullName,
          phone: profile.phone,
          role: role || (profile.roles && profile.roles[0]) || 'CUSTOMER',
          status: profile.status,
        }
      };
    }

    await delay(600);
    const users = getMockUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      throw { response: { status: 400, data: { code: 'ERR_AUTH_01', message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' } } };
    }

    if (user.status === 'LOCKED') {
      throw { response: { status: 403, data: { code: 'ERR_AUTH_03', message: 'Tài khoản đã bị khóa do nhập sai quá nhiều lần hoặc theo yêu cầu quản trị.' } } };
    }

    if (user.password !== password) {
      throw { response: { status: 400, data: { code: 'ERR_AUTH_01', message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' } } };
    }

    // Mock successful login returning a JWT token structure
    const token = `mock-jwt-token-for-${user.username}-${user.role}`;
    return {
      token,
      user: {
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    };
  },

  registerCustomer: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.post('/auth/register', {
        username: payload.username,
        password: payload.password,
        confirmPassword: payload.confirmPassword || payload.password,
        email: payload.email,
        phone: payload.phone,
        fullName: payload.fullName || payload.full_name
      });
      return response.data;
    }

    await delay(600);
    const users = getMockUsers();
    
    // Check duplicates
    if (users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_02', message: 'Tên đăng nhập đã tồn tại trên hệ thống.' } } };
    }
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_02', message: 'Email đã được đăng ký sử dụng.' } } };
    }
    if (users.some((u) => u.phone === payload.phone)) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_02', message: 'Số điện thoại đã được đăng ký sử dụng.' } } };
    }

    const newUser = {
      id: `u-${Date.now()}`,
      username: payload.username,
      password: payload.password,
      email: payload.email,
      phone: payload.phone,
      full_name: payload.full_name,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    setMockUsers(users);

    return {
      success: true,
      message: 'Đăng ký tài khoản khách hàng thành công.',
    };
  },

  sendOTP: async (email) => {
    if (!USE_MOCK) {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    }

    await delay(500);
    const users = getMockUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw { response: { status: 404, data: { code: 'ERR_AUTH_04', message: 'Email không tồn tại trong hệ thống.' } } };
    }

    // Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to OTP list in localStorage
    const otps = JSON.parse(localStorage.getItem('mock_otps') || '{}');
    otps[email.toLowerCase()] = {
      otp,
      expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    };
    localStorage.setItem('mock_otps', JSON.stringify(otps));

    // For debugging/demo purposes, we print the OTP to console and alert
    console.log(`[MOCK OTP for ${email}]: ${otp}`);
    
    return {
      success: true,
      otp, // we send this back in mock mode so frontend can display it in a toast for ease of testing!
      message: 'Mã xác thực OTP đã được gửi về email của bạn.',
    };
  },

  resetPassword: async (email, otp, newPassword) => {
    if (!USE_MOCK) {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
        confirmPassword: newPassword
      });
      return response.data;
    }

    await delay(600);
    const otps = JSON.parse(localStorage.getItem('mock_otps') || '{}');
    const record = otps[email.toLowerCase()];

    if (!record || record.otp !== otp || Date.now() > record.expires_at) {
      throw { response: { status: 400, data: { code: 'ERR_AUTH_05', message: 'Mã OTP không chính xác hoặc đã hết hạn sử dụng.' } } };
    }

    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw { response: { status: 404, data: { code: 'ERR_AUTH_04', message: 'Email không tồn tại trong hệ thống.' } } };
    }

    users[userIndex].password = newPassword;
    setMockUsers(users);

    // Clear used OTP
    delete otps[email.toLowerCase()];
    localStorage.setItem('mock_otps', JSON.stringify(otps));

    return {
      success: true,
      message: 'Mật khẩu mới đã được cập nhật thành công.',
    };
  },

  getProfile: async () => {
    if (!USE_MOCK) {
      const response = await api.get('/profile');
      return response.data;
    }

    await delay(300);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const users = getMockUsers();
    const user = users.find((u) => u.username === cachedUser.username);

    if (!user) {
      throw { response: { status: 401, data: { message: 'Unauthorized' } } };
    }

    return {
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  },

  updateProfile: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.put('/profile', payload);
      return response.data;
    }

    await delay(500);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.username === cachedUser.username);

    if (userIndex === -1) {
      throw { response: { status: 401, data: { message: 'Unauthorized' } } };
    }

    users[userIndex].full_name = payload.full_name;
    users[userIndex].phone = payload.phone;
    setMockUsers(users);

    // Update session storage
    const updatedUser = {
      ...cachedUser,
      full_name: payload.full_name,
      phone: payload.phone,
    };
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));

    return {
      success: true,
      user: updatedUser,
      message: 'Hồ sơ cá nhân đã được cập nhật thành công.',
    };
  },

  changePassword: async (currentPassword, newPassword) => {
    if (!USE_MOCK) {
      const response = await api.put('/profile/change-password', { currentPassword, newPassword });
      return response.data;
    }

    await delay(500);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.username === cachedUser.username);

    if (userIndex === -1) {
      throw { response: { status: 401, data: { message: 'Unauthorized' } } };
    }

    if (users[userIndex].password !== currentPassword) {
      throw { response: { status: 400, data: { message: 'Mật khẩu hiện tại không chính xác.' } } };
    }

    users[userIndex].password = newPassword;
    setMockUsers(users);

    return {
      success: true,
      message: 'Cập nhật mật khẩu thành công.',
    };
  },
};

/* ==========================================
   ADMIN EMPLOYEE CRUD SERVICES
   ========================================== */

export const employeeService = {
  getAll: async (filters = {}) => {
    if (!USE_MOCK) {
      // Map filters to parameters. Note: Spring page is 0-indexed.
      const params = {
        search: filters.search || '',
        role: filters.role || '',
        status: filters.status || '',
        page: filters.page !== undefined ? filters.page : 0,
        size: filters.size !== undefined ? filters.size : 100
      };
      const response = await api.get('/admin/employees', { params });
      const data = response.data;
      
      if (data && Array.isArray(data.content)) {
        return data.content.map((u, index) => ({
          stt: index + 1,
          id: u.id,
          username: u.username,
          email: u.email,
          full_name: u.fullName || '',
          phone: u.phone || '',
          role: (u.roles && u.roles[0]) || 'SALES',
          status: u.status || 'ACTIVE',
        }));
      }
      return Array.isArray(data) ? data : [];
    }

    await delay(500);
    let users = getMockUsers();
    
    // Filters: Filter out customers, show only employees (ADMIN, STOREKEEPER, SALES)
    users = users.filter((u) => u.role !== 'CUSTOMER');

    // Filter out currently logged in employee
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (cachedUser && cachedUser.username) {
      users = users.filter((u) => u.username !== cachedUser.username);
    }

    // Search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.full_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone.includes(query)
      );
    }

    // Role filter
    if (filters.role) {
      users = users.filter((u) => u.role === filters.role);
    }

    // Status filter
    if (filters.status) {
      users = users.filter((u) => u.status === filters.status);
    }

    return users.map((u, index) => ({
      stt: index + 1,
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
    }));
  },

  create: async (payload) => {
    if (!USE_MOCK) {
      const backendPayload = {
        username: payload.username,
        email: payload.email,
        fullName: payload.full_name,
        phone: payload.phone,
        role: payload.role,
      };
      const response = await api.post('/admin/employees', backendPayload);
      return response.data;
    }

    await delay(600);
    const users = getMockUsers();

    if (users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_02', message: 'Tên đăng nhập này đã được sử dụng.' } } };
    }

    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_02', message: 'Địa chỉ Email này đã được sử dụng.' } } };
    }

    // Generate random temporary password
    const tempPassword = Math.random().toString(36).substring(2, 10);
    
    const newEmployee = {
      id: `u-${Date.now()}`,
      username: payload.username,
      password: tempPassword, // save temporary password
      email: payload.email,
      phone: payload.phone,
      full_name: payload.full_name,
      role: payload.role, // STOREKEEPER or SALES
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    users.push(newEmployee);
    setMockUsers(users);

    console.log(`[MOCK EMAIL SENT to ${newEmployee.email}]: Chào mừng ${newEmployee.full_name}! Mật khẩu tạm thời là: ${tempPassword}`);

    return {
      success: true,
      tempPassword, // we pass this back in mock mode to display to the admin in a success message card!
      message: `Tài khoản nhân viên được tạo thành công. Đã gửi thông báo mật khẩu tạm thời đến email.`,
    };
  },

  update: async (id, payload) => {
    if (!USE_MOCK) {
      const response = await api.put(`/admin/employees/${id}`, {
        fullName: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role
      });
      return response.data;
    }

    await delay(500);
    const users = getMockUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw { response: { status: 404, data: { message: 'Không tìm thấy nhân viên.' } } };
    }

    // Check duplicate email
    if (users.some((u) => u.id !== id && u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_02', message: 'Địa chỉ Email này đã được sử dụng bởi người dùng khác.' } } };
    }

    users[index].full_name = payload.full_name;
    users[index].email = payload.email;
    users[index].phone = payload.phone;
    users[index].role = payload.role;
    setMockUsers(users);

    return {
      success: true,
      message: 'Cập nhật thông tin nhân viên thành công.',
    };
  },

  toggleStatus: async (id, currentStatus) => {
    if (!USE_MOCK) {
      const response = await api.put(`/admin/employees/${id}/toggle-status`);
      const nextStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
      return {
        ...response.data,
        status: nextStatus,
      };
    }

    await delay(400);
    const users = getMockUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw { response: { status: 404, data: { message: 'Không tìm thấy tài khoản nhân viên.' } } };
    }

    const currentStatusVal = users[index].status;
    const nextStatus = currentStatusVal === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    users[index].status = nextStatus;
    setMockUsers(users);

    return {
      success: true,
      status: nextStatus,
      message: `Tài khoản đã được ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} thành công.`,
    };
  },
};

export const categoryService = {
  getAll: async (params) => {
    if (!USE_MOCK) {
      const response = await api.get('/categories', { params });
      return response.data.content.map((item, idx) => ({
        ...item,
        stt: idx + 1 + (response.data.number * response.data.size),
      }));
    }

    await delay(400);
    let categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
    
    if (params?.search) {
      const q = params.search.toLowerCase();
      categories = categories.filter(c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
    }
    
    if (params?.status) {
      categories = categories.filter(c => c.status === params.status);
    }

    return categories.map((c, idx) => ({
      ...c,
      stt: idx + 1,
    }));
  },

  create: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.post('/categories', payload);
      return response.data;
    }

    await delay(400);
    const categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
    if (categories.some(c => c.name.toLowerCase() === payload.name.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_04', message: 'Tên danh mục đã tồn tại trong hệ thống.' } } };
    }

    const newCat = {
      id: Date.now(),
      name: payload.name,
      description: payload.description,
      status: payload.status || 'ACTIVE',
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    categories.push(newCat);
    localStorage.setItem('mock_categories', JSON.stringify(categories));
    return { success: true, message: 'Tạo mới danh mục sản phẩm thành công!' };
  },

  update: async (id, payload) => {
    if (!USE_MOCK) {
      const response = await api.put(`/categories/${id}`, payload);
      return response.data;
    }

    await delay(400);
    const categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
    const index = categories.findIndex(c => c.id == id);
    if (index === -1) {
      throw { response: { status: 404, data: { message: 'Không tìm thấy danh mục.' } } };
    }

    if (categories.some(c => c.id != id && c.name.toLowerCase() === payload.name.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_04', message: 'Tên danh mục đã tồn tại trong hệ thống.' } } };
    }

    categories[index].name = payload.name;
    categories[index].description = payload.description;
    categories[index].status = payload.status;
    categories[index].updatedAt = new Date().toISOString();

    localStorage.setItem('mock_categories', JSON.stringify(categories));
    return { success: true, message: 'Cập nhật danh mục sản phẩm thành công!' };
  },

  delete: async (id) => {
    if (!USE_MOCK) {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    }

    await delay(400);
    const categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
    const cat = categories.find(c => c.id == id);
    if (!cat) {
      throw { response: { status: 404, data: { message: 'Không tìm thấy danh mục.' } } };
    }

    if (cat.productCount > 0) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_04', message: 'Không thể xóa danh mục đang có sản phẩm liên kết.' } } };
    }

    const filtered = categories.filter(c => c.id != id);
    localStorage.setItem('mock_categories', JSON.stringify(filtered));
    return { success: true, message: 'Xóa danh mục sản phẩm thành công!' };
  }
};

export const customerService = {
  getAll: async (params) => {
    if (!USE_MOCK) {
      const response = await api.get('/customers', { params });
      return response.data.content.map((item, idx) => ({
        ...item,
        stt: idx + 1 + (response.data.number * response.data.size),
        id: item.id,
        full_name: item.fullName,
      }));
    }

    await delay(450);
    let list = JSON.parse(localStorage.getItem('mock_customers') || '[]');
    
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.customerCode.toLowerCase().includes(q)
      );
    }

    if (params?.status) {
      list = list.filter(c => c.status === params.status);
    }

    return list.map((c, idx) => ({
      ...c,
      stt: idx + 1,
      full_name: c.fullName,
    }));
  },

  create: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.post('/customers', payload);
      return response.data;
    }

    await delay(450);
    const list = JSON.parse(localStorage.getItem('mock_customers') || '[]');
    
    if (list.some(c => c.username.toLowerCase() === payload.username.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_06', message: 'Tên đăng nhập đã tồn tại trong hệ thống.' } } };
    }
    if (list.some(c => c.phone === payload.phone)) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_06', message: 'Số điện thoại đã tồn tại trên hệ thống.' } } };
    }
    if (payload.email && list.some(c => c.email && c.email.toLowerCase() === payload.email.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_06', message: 'Email đã tồn tại trên hệ thống.' } } };
    }

    const nextId = list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1;
    const nextCode = `KH${String(nextId).padStart(4, '0')}`;

    const newCustomer = {
      id: nextId,
      customerCode: nextCode,
      username: payload.username,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      status: payload.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newCustomer);
    localStorage.setItem('mock_customers', JSON.stringify(list));
    return { success: true, message: 'Thêm mới khách hàng thành công!' };
  },

  update: async (id, payload) => {
    if (!USE_MOCK) {
      const response = await api.put(`/customers/${id}`, payload);
      return response.data;
    }

    await delay(450);
    const list = JSON.parse(localStorage.getItem('mock_customers') || '[]');
    const index = list.findIndex(c => c.id == id);
    if (index === -1) {
      throw { response: { status: 404, data: { message: 'Khách hàng không tồn tại.' } } };
    }

    if (list.some(c => c.id != id && c.phone === payload.phone)) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_06', message: 'Số điện thoại đã tồn tại trên hệ thống.' } } };
    }
    if (payload.email && list.some(c => c.id != id && c.email && c.email.toLowerCase() === payload.email.toLowerCase())) {
      throw { response: { status: 400, data: { code: 'ERR_VAL_06', message: 'Email đã tồn tại trên hệ thống.' } } };
    }

    list[index].fullName = payload.fullName;
    list[index].phone = payload.phone;
    list[index].email = payload.email;
    list[index].address = payload.address;
    list[index].status = payload.status;
    list[index].updatedAt = new Date().toISOString();

    localStorage.setItem('mock_customers', JSON.stringify(list));
    return { success: true, message: 'Cập nhật thông tin khách hàng thành công.' };
  },

  delete: async (id) => {
    if (!USE_MOCK) {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    }

    await delay(400);
    const list = JSON.parse(localStorage.getItem('mock_customers') || '[]');
    const filtered = list.filter(c => c.id != id);
    localStorage.setItem('mock_customers', JSON.stringify(filtered));
    return { success: true, message: 'Xóa khách hàng thành công!' };
  }
};

/* ==========================================
   PRODUCT MANAGEMENT SERVICES
   ========================================== */

export const productService = {
  getAll: async (params = {}) => {
    if (!USE_MOCK) {
      const response = await api.get('/products', { params });
      return response.data; // Spring Page structure
    }

    await delay(500);
    let list = JSON.parse(localStorage.getItem('mock_products') || '[]');
    
    // Filters
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params.categoryId) {
      list = list.filter(p => p.categoryId == params.categoryId);
    }
    if (params.status) {
      list = list.filter(p => p.status === params.status);
    }
    if (params.minPrice !== undefined && params.minPrice !== '') {
      list = list.filter(p => p.price >= Number(params.minPrice));
    }
    if (params.maxPrice !== undefined && params.maxPrice !== '') {
      list = list.filter(p => p.price <= Number(params.maxPrice));
    }

    // Role filtration (Sales / Customer shouldn't see costPrice)
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isSalesOrCustomer = cachedUser.role === 'SALES' || cachedUser.role === 'CUSTOMER';

    const processedList = list.map(p => {
      const copy = { ...p };
      if (isSalesOrCustomer) {
        delete copy.costPrice;
      }
      return copy;
    });

    const page = params.page || 0;
    const size = params.size || 10;
    const paginated = processedList.slice(page * size, (page + 1) * size);

    return {
      content: paginated,
      totalElements: processedList.length,
      totalPages: Math.ceil(processedList.length / size),
      number: page,
      size: size
    };
  },

  getById: async (id) => {
    if (!USE_MOCK) {
      const response = await api.get(`/products/${id}`);
      return response.data;
    }

    await delay(300);
    const list = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const product = list.find(p => p.id == id);
    if (!product) {
      throw { response: { status: 404, data: { message: 'Sản phẩm không tồn tại.' } } };
    }

    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isSalesOrCustomer = cachedUser.role === 'SALES' || cachedUser.role === 'CUSTOMER';
    
    const copy = { ...product };
    if (isSalesOrCustomer) {
      delete copy.costPrice;
    }
    return copy;
  },

  create: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.post('/products', payload);
      return response.data;
    }

    await delay(500);
    const list = JSON.parse(localStorage.getItem('mock_products') || '[]');
    
    let sku = payload.sku ? payload.sku.trim() : '';
    if (sku && sku.contains && sku.contains(' ')) {
      throw { response: { status: 400, data: { message: 'Mã SKU không chứa khoảng trắng.' } } };
    }
    if (sku && list.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
      throw { response: { status: 400, data: { message: 'Mã SKU đã tồn tại trên hệ thống. Vui lòng nhập mã khác.' } } };
    }
    if (!sku) {
      sku = `PROD-${Date.now().toString().slice(-6)}`;
    }

    if (payload.price < payload.costPrice) {
      throw { response: { status: 400, data: { message: 'Giá bán không được nhỏ hơn giá vốn. Vui lòng kiểm tra lại.' } } };
    }

    const categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
    const cat = categories.find(c => c.id == payload.categoryId);
    const catName = cat ? cat.name : 'Danh mục khác';

    const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
    const newProduct = {
      id: newId,
      sku: sku.toUpperCase(),
      name: payload.name.trim(),
      description: payload.description ? payload.description.trim() : '',
      price: Number(payload.price),
      costPrice: Number(payload.costPrice),
      stockQuantity: Number(payload.stockQuantity || 0),
      status: payload.status || (Number(payload.stockQuantity) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
      categoryId: Number(payload.categoryId),
      categoryName: catName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.push(newProduct);
    localStorage.setItem('mock_products', JSON.stringify(list));

    // Record initial stock log
    const logs = JSON.parse(localStorage.getItem('mock_stock_logs') || '[]');
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const newLog = {
      id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
      productId: newProduct.id,
      productSku: newProduct.sku,
      productName: newProduct.name,
      changeQuantity: newProduct.stockQuantity,
      type: 'IMPORT',
      reason: 'Khởi tạo tồn kho ban đầu',
      createdByUsername: cachedUser.username || 'admin',
      createdByFullName: cachedUser.full_name || 'Nguyễn Văn Admin',
      stockAfterChange: newProduct.stockQuantity,
      createdAt: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('mock_stock_logs', JSON.stringify(logs));

    return { success: true, message: 'Thêm mới sản phẩm thành công!' };
  },

  update: async (id, payload) => {
    if (!USE_MOCK) {
      const response = await api.put(`/products/${id}`, payload);
      return response.data;
    }

    await delay(500);
    const list = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const index = list.findIndex(p => p.id == id);
    if (index === -1) {
      throw { response: { status: 404, data: { message: 'Sản phẩm không tồn tại.' } } };
    }

    let sku = payload.sku ? payload.sku.trim() : '';
    if (sku && list.some(p => p.id != id && p.sku.toLowerCase() === sku.toLowerCase())) {
      throw { response: { status: 400, data: { message: 'Mã SKU đã tồn tại trên hệ thống. Vui lòng nhập mã khác.' } } };
    }

    if (payload.price < payload.costPrice) {
      throw { response: { status: 400, data: { message: 'Giá bán không được nhỏ hơn giá vốn. Vui lòng kiểm tra lại.' } } };
    }

    const categories = JSON.parse(localStorage.getItem('mock_categories') || '[]');
    const cat = categories.find(c => c.id == payload.categoryId);
    const catName = cat ? cat.name : list[index].categoryName;

    list[index].sku = sku ? sku.toUpperCase() : list[index].sku;
    list[index].name = payload.name.trim();
    list[index].description = payload.description ? payload.description.trim() : '';
    list[index].price = Number(payload.price);
    list[index].costPrice = Number(payload.costPrice);
    list[index].status = payload.status;
    list[index].categoryId = Number(payload.categoryId);
    list[index].categoryName = catName;
    list[index].updatedAt = new Date().toISOString();

    localStorage.setItem('mock_products', JSON.stringify(list));
    return { success: true, message: 'Cập nhật thông tin sản phẩm thành công.' };
  },

  adjustStock: async (id, payload) => {
    if (!USE_MOCK) {
      const response = await api.post(`/products/${id}/adjust`, payload);
      return response.data;
    }

    await delay(450);
    const list = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const index = list.findIndex(p => p.id == id);
    if (index === -1) {
      throw { response: { status: 404, data: { message: 'Sản phẩm không tồn tại.' } } };
    }

    const type = payload.type; // IMPORT, EXPORT, ADJUST
    const quantity = Number(payload.quantity);
    const reason = payload.reason ? payload.reason.trim() : '';

    if (!reason) {
      throw { response: { status: 400, data: { message: 'Lý do điều chỉnh không được để trống.' } } };
    }

    const currentStock = list[index].stockQuantity;
    let newStock = currentStock;
    let changeQuantity = 0;

    if (type === 'IMPORT') {
      if (quantity < 0) throw { response: { status: 400, data: { message: 'Số lượng nhập thêm không được nhỏ hơn 0.' } } };
      newStock = currentStock + quantity;
      changeQuantity = quantity;
    } else if (type === 'EXPORT') {
      if (quantity < 0) throw { response: { status: 400, data: { message: 'Số lượng xuất kho không được nhỏ hơn 0.' } } };
      newStock = currentStock - quantity;
      changeQuantity = -quantity;
    } else if (type === 'ADJUST') {
      if (quantity < 0) throw { response: { status: 400, data: { message: 'Số lượng tồn thực tế không được nhỏ hơn 0.' } } };
      newStock = quantity;
      changeQuantity = newStock - currentStock;
    } else {
      throw { response: { status: 400, data: { message: 'Loại điều chỉnh không hợp lệ.' } } };
    }

    if (newStock < 0) {
      throw { response: { status: 400, data: { message: 'Số lượng tồn kho sau điều chỉnh không thể nhỏ hơn 0.' } } };
    }

    // Auto status transition
    if (newStock === 0 && list[index].status === 'ACTIVE') {
      list[index].status = 'OUT_OF_STOCK';
    } else if (newStock > 0 && list[index].status === 'OUT_OF_STOCK') {
      list[index].status = 'ACTIVE';
    }

    list[index].stockQuantity = newStock;
    list[index].updatedAt = new Date().toISOString();
    localStorage.setItem('mock_products', JSON.stringify(list));

    // Record stock log
    const logs = JSON.parse(localStorage.getItem('mock_stock_logs') || '[]');
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const newLog = {
      id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
      productId: list[index].id,
      productSku: list[index].sku,
      productName: list[index].name,
      changeQuantity: changeQuantity,
      type: type,
      reason: reason,
      createdByUsername: cachedUser.username || 'keeper',
      createdByFullName: cachedUser.full_name || 'Trần Thủ Kho',
      stockAfterChange: newStock,
      createdAt: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('mock_stock_logs', JSON.stringify(logs));

    return { success: true, message: 'Điều chỉnh tồn kho sản phẩm thành công.' };
  }
};

/* ==========================================
   STOCK LOG SERVICES
   ========================================== */

export const stockLogService = {
  getAll: async (params = {}) => {
    if (!USE_MOCK) {
      const response = await api.get('/stock-logs', { params });
      return response.data;
    }

    await delay(450);
    let list = JSON.parse(localStorage.getItem('mock_stock_logs') || '[]');
    
    // Sort logs descending by date
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter
    if (params.productId) {
      list = list.filter(l => l.productId == params.productId);
    }
    if (params.type) {
      list = list.filter(l => l.type === params.type);
    }
    if (params.createdByUsername) {
      list = list.filter(l => l.createdByUsername.toLowerCase() === params.createdByUsername.toLowerCase());
    }
    if (params.startDate) {
      const start = new Date(params.startDate);
      list = list.filter(l => new Date(l.createdAt) >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(l => new Date(l.createdAt) <= end);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(l => l.productName.toLowerCase().includes(q) || l.productSku.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q));
    }

    const page = params.page || 0;
    const size = params.size || 10;
    const paginated = list.slice(page * size, (page + 1) * size);

    return {
      content: paginated,
      totalElements: list.length,
      totalPages: Math.ceil(list.length / size),
      number: page,
      size: size
    };
  }
};

/* ==========================================
   CUSTOMER CART SERVICES
   ========================================== */

const normalizeCart = (backendCart) => {
  if (!backendCart) return null;
  return {
    id: backendCart.id,
    customerId: backendCart.customerId,
    totalPrice: backendCart.totalAmount || 0,
    items: (backendCart.items || []).map(item => ({
      id: item.id,
      quantity: item.quantity,
      subTotal: item.itemTotal || 0,
      product: {
        id: item.productId,
        sku: item.productSku || '',
        name: item.productName || '',
        price: item.productPrice || 0,
        categoryName: ''
      }
    }))
  };
};

export const cartService = {
  get: async () => {
    if (!USE_MOCK) {
      const response = await api.get('/cart');
      return normalizeCart(response.data);
    }

    await delay(300);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';
    
    const carts = JSON.parse(localStorage.getItem('mock_cart') || '[]');
    let userCart = carts.find(c => c.username === username);
    
    if (!userCart) {
      userCart = { username, items: [], totalPrice: 0 };
      carts.push(userCart);
      localStorage.setItem('mock_cart', JSON.stringify(carts));
    }

    return userCart;
  },

  addItem: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.post('/cart/items', payload);
      return normalizeCart(response.data.cart);
    }

    await delay(400);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';
    
    const productId = Number(payload.productId);
    const quantity = Number(payload.quantity);

    // Validate stock
    const products = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const product = products.find(p => p.id == productId);
    if (!product) {
      throw { response: { status: 404, data: { message: 'Sản phẩm không tồn tại.' } } };
    }
    if (product.status !== 'ACTIVE' || product.stockQuantity < quantity) {
      throw { response: { status: 400, data: { message: `Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} sản phẩm trong kho.` } } };
    }

    const carts = JSON.parse(localStorage.getItem('mock_cart') || '[]');
    let userCartIdx = carts.findIndex(c => c.username === username);
    if (userCartIdx === -1) {
      carts.push({ username, items: [], totalPrice: 0 });
      userCartIdx = carts.length - 1;
    }

    const items = carts[userCartIdx].items;
    const existingItemIdx = items.findIndex(item => item.product.id == productId);

    if (existingItemIdx !== -1) {
      const newQty = items[existingItemIdx].quantity + quantity;
      if (product.stockQuantity < newQty) {
        throw { response: { status: 400, data: { message: `Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} sản phẩm trong kho. Bạn đã có ${items[existingItemIdx].quantity} trong giỏ.` } } };
      }
      items[existingItemIdx].quantity = newQty;
      items[existingItemIdx].subTotal = newQty * product.price;
    } else {
      items.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          status: product.status,
          categoryName: product.categoryName
        },
        quantity: quantity,
        subTotal: quantity * product.price
      });
    }

    // Recompute total price
    carts[userCartIdx].totalPrice = items.reduce((acc, item) => acc + item.subTotal, 0);
    localStorage.setItem('mock_cart', JSON.stringify(carts));

    return carts[userCartIdx];
  },

  updateQuantity: async (itemId, payload) => {
    if (!USE_MOCK) {
      const response = await api.put(`/cart/items/${itemId}`, payload);
      return normalizeCart(response.data.cart);
    }

    await delay(300);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';
    const quantity = Number(payload.quantity);

    if (quantity <= 0) {
      return cartService.removeItem(itemId);
    }

    const carts = JSON.parse(localStorage.getItem('mock_cart') || '[]');
    const userCartIdx = carts.findIndex(c => c.username === username);
    if (userCartIdx === -1) {
      throw { response: { status: 404, data: { message: 'Giỏ hàng rỗng.' } } };
    }

    const items = carts[userCartIdx].items;
    const itemIdx = items.findIndex(item => item.id == itemId);
    if (itemIdx === -1) {
      throw { response: { status: 404, data: { message: 'Không tìm thấy sản phẩm trong giỏ hàng.' } } };
    }

    const productId = items[itemIdx].product.id;
    const products = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const product = products.find(p => p.id == productId);

    if (product.stockQuantity < quantity) {
      throw { response: { status: 400, data: { message: `Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} sản phẩm trong kho.` } } };
    }

    items[itemIdx].quantity = quantity;
    items[itemIdx].subTotal = quantity * items[itemIdx].product.price;
    carts[userCartIdx].totalPrice = items.reduce((acc, item) => acc + item.subTotal, 0);
    
    localStorage.setItem('mock_cart', JSON.stringify(carts));
    return carts[userCartIdx];
  },

  removeItem: async (itemId) => {
    if (!USE_MOCK) {
      const response = await api.delete(`/cart/items/${itemId}`);
      return normalizeCart(response.data.cart);
    }

    await delay(300);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';

    const carts = JSON.parse(localStorage.getItem('mock_cart') || '[]');
    const userCartIdx = carts.findIndex(c => c.username === username);
    if (userCartIdx !== -1) {
      carts[userCartIdx].items = carts[userCartIdx].items.filter(item => item.id != itemId);
      carts[userCartIdx].totalPrice = carts[userCartIdx].items.reduce((acc, item) => acc + item.subTotal, 0);
      localStorage.setItem('mock_cart', JSON.stringify(carts));
      return carts[userCartIdx];
    }
    return { username, items: [], totalPrice: 0 };
  },

  clear: async () => {
    if (!USE_MOCK) {
      const response = await api.delete('/cart/clear');
      return response.data;
    }

    await delay(300);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';

    const carts = JSON.parse(localStorage.getItem('mock_cart') || '[]');
    const userCartIdx = carts.findIndex(c => c.username === username);
    if (userCartIdx !== -1) {
      carts[userCartIdx].items = [];
      carts[userCartIdx].totalPrice = 0;
      localStorage.setItem('mock_cart', JSON.stringify(carts));
    }
    return { success: true };
  }
};

const normalizeOrder = (backendOrder) => {
  if (!backendOrder) return null;
  return {
    id: backendOrder.id,
    orderCode: backendOrder.orderCode,
    username: backendOrder.username,
    shippingAddress: backendOrder.shippingAddress,
    shippingPhone: backendOrder.shippingPhone,
    totalAmount: backendOrder.totalAmount,
    status: backendOrder.status,
    createdAt: backendOrder.createdAt,
    updatedAt: backendOrder.updatedAt,
    orderItems: (backendOrder.items || []).map(item => ({
      id: item.id,
      productId: item.productId,
      productSku: item.productSku || '',
      productName: item.productName || '',
      price: item.productPrice || 0,
      quantity: item.quantity || 0,
      subTotal: item.itemTotal || 0
    }))
  };
};

export const orderService = {
  checkout: async (payload) => {
    if (!USE_MOCK) {
      const response = await api.post('/orders/checkout', payload);
      if (response.data && response.data.order) {
        response.data.order = normalizeOrder(response.data.order);
      }
      return response.data;
    }

    await delay(600);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';

    const carts = JSON.parse(localStorage.getItem('mock_cart') || '[]');
    const userCart = carts.find(c => c.username === username);
    if (!userCart || userCart.items.length === 0) {
      throw { response: { status: 400, data: { message: 'Giỏ hàng trống, không thể thanh toán.' } } };
    }

    // Validate stock and locking simulation
    const products = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const logs = JSON.parse(localStorage.getItem('mock_stock_logs') || '[]');

    for (const item of userCart.items) {
      const pIndex = products.findIndex(p => p.id == item.product.id);
      if (pIndex === -1) {
        throw { response: { status: 404, data: { message: `Sản phẩm ${item.product.name} không tồn tại.` } } };
      }
      if (products[pIndex].stockQuantity < item.quantity) {
        throw { response: { status: 400, data: { message: `Sản phẩm ${item.product.name} chỉ còn ${products[pIndex].stockQuantity} trong kho, không đủ số lượng đặt.` } } };
      }
    }

    // Deduct stock and log
    const orderId = Date.now();
    const orderCode = `DH-${orderId.toString().slice(-6).toUpperCase()}`;

    userCart.items.forEach(item => {
      const pIndex = products.findIndex(p => p.id == item.product.id);
      const currentStock = products[pIndex].stockQuantity;
      const nextStock = currentStock - item.quantity;
      
      products[pIndex].stockQuantity = nextStock;
      if (nextStock === 0 && products[pIndex].status === 'ACTIVE') {
        products[pIndex].status = 'OUT_OF_STOCK';
      }

      // Add Stock Log
      logs.push({
        id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
        productId: products[pIndex].id,
        productSku: products[pIndex].sku,
        productName: products[pIndex].name,
        changeQuantity: -item.quantity,
        type: 'EXPORT',
        reason: `Xuất kho bán lẻ theo đơn hàng ${orderCode}`,
        createdByUsername: username,
        createdByFullName: cachedUser.full_name || 'Khách Hàng',
        stockAfterChange: nextStock,
        createdAt: new Date().toISOString()
      });
    });

    localStorage.setItem('mock_products', JSON.stringify(products));
    localStorage.setItem('mock_stock_logs', JSON.stringify(logs));

    // Create Order
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const newOrder = {
      id: orderId,
      orderCode: orderCode,
      username: username,
      shippingAddress: payload.shippingAddress,
      shippingPhone: payload.shippingPhone,
      totalAmount: userCart.totalPrice,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      orderItems: userCart.items.map(item => ({
        id: item.id,
        productId: item.product.id,
        productSku: item.product.sku,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subTotal: item.subTotal
      }))
    };

    orders.push(newOrder);
    localStorage.setItem('mock_orders', JSON.stringify(orders));

    // Clear cart
    userCart.items = [];
    userCart.totalPrice = 0;
    localStorage.setItem('mock_cart', JSON.stringify(carts));

    return { order: newOrder };
  },

  getMyOrders: async (params = {}) => {
    if (!USE_MOCK) {
      const response = await api.get('/orders', { params });
      if (response.data && response.data.content) {
        response.data.content = response.data.content.map(normalizeOrder);
      }
      return response.data;
    }

    await delay(450);
    const cachedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const username = cachedUser.username || 'customer';
    
    let list = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    list = list.filter(o => o.username === username);
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = params.page || 0;
    const size = params.size || 10;
    const paginated = list.slice(page * size, (page + 1) * size);

    return {
      content: paginated,
      totalElements: list.length,
      totalPages: Math.ceil(list.length / size),
      number: page,
      size: size
    };
  },

  getAll: async (params = {}) => {
    if (!USE_MOCK) {
      const response = await api.get('/orders/admin', { params });
      if (response.data && response.data.content) {
        response.data.content = response.data.content.map(normalizeOrder);
      }
      return response.data;
    }

    await delay(500);
    let list = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = params.page || 0;
    const size = params.size || 10;
    const paginated = list.slice(page * size, (page + 1) * size);

    return {
      content: paginated,
      totalElements: list.length,
      totalPages: Math.ceil(list.length / size),
      number: page,
      size: size
    };
  },

  updateStatus: async (id, payload) => {
    if (!USE_MOCK) {
      const response = await api.put(`/orders/${id}/status`, payload);
      if (response.data && response.data.order) {
        response.data.order = normalizeOrder(response.data.order);
      }
      return response.data;
    }

    await delay(450);
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const idx = orders.findIndex(o => o.id == id);
    if (idx === -1) {
      throw { response: { status: 404, data: { message: 'Đơn hàng không tồn tại.' } } };
    }

    const nextStatus = payload.status; // PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED
    
    // Validate order state transitions if necessary, here we simply update
    orders[idx].status = nextStatus;
    localStorage.setItem('mock_orders', JSON.stringify(orders));

    return { order: orders[idx] };
  }
};

export default api;

