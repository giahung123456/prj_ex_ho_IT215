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
      const response = await api.post('/auth/register', payload);
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
      const response = await api.post('/auth/forgot-password/otp', { email });
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
      const response = await api.post('/auth/forgot-password/reset', { email, otp, newPassword });
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
      // The backend only exposes updating an employee's role via put /admin/employees/{id}/role
      const response = await api.put(`/admin/employees/${id}/role`, { role: payload.role });
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

export default api;
