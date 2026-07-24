-- =========================================================================
-- FILE CẤU HÌNH TẠO BẢNG CƠ SỞ DỮ LIỆU (DDL)
-- DỰ ÁN: QUẢN LÝ SẢN PHẨM
-- TÀI LIỆU ĐẶC TẢ: SRS_PRD_PRODUCT_01 (tai_lieu_dac_ta.md)
-- Hỗ trợ: PostgreSQL (Khuyên dùng cho UUID) & MySQL (Định dạng phổ thông)
-- =========================================================================

-- =========================================================================
-- PHẦN I: KỊCH BẢN DÀNH CHO POSTGRESQL (NATIVE UUID & TIMEZONE SUPPORT)
-- =========================================================================

/* 
-- Nhấp bỏ comment khối này nếu muốn chạy trên PostgreSQL
-- Kích hoạt extension sinh UUID ngẫu nhiên nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng ROLE (Vai trò)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);
COMMENT ON TABLE roles IS 'Bảng vai trò người dùng (ADMIN, STOREKEEPER, SALES)';

-- 2. Bảng PERMISSION (Quyền hạn)
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);
COMMENT ON TABLE permissions IS 'Bảng định nghĩa danh sách quyền chi tiết';

-- 3. Bảng USER (Người dùng/Nhân viên)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'LOCKED', 'DELETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE users IS 'Thông tin tài khoản nhân viên hệ thống';

-- 4. Bảng liên kết USER_ROLE (Người dùng - Vai trò)
CREATE TABLE user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
COMMENT ON TABLE user_roles IS 'Bảng trung gian liên kết Người dùng và Vai trò (RBAC)';

-- 5. Bảng liên kết ROLE_PERMISSION (Vai trò - Quyền hạn)
CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
COMMENT ON TABLE role_permissions IS 'Bảng trung gian phân quyền cho từng Vai trò';

-- 6. Bảng ACTION_LOG (Nhật ký hoạt động hệ thống)
CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE action_logs IS 'Lưu lịch sử hoạt động, thao tác của người dùng';

-- 7. Bảng CATEGORY (Danh mục sản phẩm)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_category_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE categories IS 'Danh mục phân loại sản phẩm';

-- 8. Bảng PRODUCT (Sản phẩm)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 
        CONSTRAINT chk_product_price CHECK (price >= 0),
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 
        CONSTRAINT chk_product_cost_price CHECK (cost_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 
        CONSTRAINT chk_product_stock_quantity CHECK (stock_quantity >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_product_status CHECK (status IN ('ACTIVE', 'OUT_OF_STOCK', 'INACTIVE')),
    category_id INT REFERENCES categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Quy tắc nghiệp vụ ERR_VAL_02: Giá bán không được nhỏ hơn giá vốn
    CONSTRAINT chk_price_vs_cost CHECK (price >= cost_price)
);
COMMENT ON TABLE products IS 'Thông tin sản phẩm trong kho hàng';

-- 10. Bảng CUSTOMER (Khách hàng)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE customers IS 'Thông tin khách hàng';

-- 11. Bảng CART (Giỏ hàng)
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE carts IS 'Giỏ hàng của khách hàng';

-- 12. Bảng CART_ITEM (Chi tiết giỏ hàng)
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CONSTRAINT chk_cart_item_qty CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
);
COMMENT ON TABLE cart_items IS 'Chi tiết các sản phẩm trong giỏ hàng';

-- 13. Bảng ORDER (Đơn hàng)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED')),
    shipping_address VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE orders IS 'Đơn đặt hàng mua sản phẩm';

-- 14. Bảng ORDER_ITEM (Chi tiết đơn hàng)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    price NUMERIC(15, 2) NOT NULL CONSTRAINT chk_order_item_price CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE order_items IS 'Chi tiết các mặt hàng trong đơn đặt hàng';

-- 9. Bảng STOCK_LOG (Lịch sử biến động tồn kho)
CREATE TABLE stock_logs (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    change_quantity INT NOT NULL,
    type VARCHAR(20) NOT NULL 
        CONSTRAINT chk_stock_log_type CHECK (type IN ('IMPORT', 'EXPORT', 'ADJUST')),
    reason TEXT NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE stock_logs IS 'Lịch sử thay đổi tồn kho (nhập, xuất, điều chỉnh)';
*/


-- =========================================================================
-- PHẦN II: KỊCH BẢN DÀNH CHO MYSQL (PHIÊN BẢN HỖ TRỢ >= 8.0.13 CHO DEFAULT UUID)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS product_management_db;
USE product_management_db;

-- 1. Bảng ROLE (Vai trò)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
) COMMENT 'Bảng vai trò người dùng (ADMIN, STOREKEEPER, SALES)';

-- 2. Bảng PERMISSION (Quyền hạn)
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
) COMMENT 'Bảng định nghĩa danh sách quyền chi tiết';

-- 3. Bảng USER (Người dùng/Nhân viên)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'LOCKED', 'DELETED'))
) COMMENT 'Thông tin tài khoản nhân viên hệ thống';

-- 4. Bảng liên kết USER_ROLE (Người dùng - Vai trò)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) COMMENT 'Bảng trung gian liên kết Người dùng và Vai trò (RBAC)';

-- 5. Bảng liên kết ROLE_PERMISSION (Vai trò - Quyền hạn)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) COMMENT 'Bảng trung gian phân quyền cho từng Vai trò';

-- 6. Bảng ACTION_LOG (Nhật ký hoạt động hệ thống)
CREATE TABLE IF NOT EXISTS action_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT 'Lưu lịch sử hoạt động, thao tác của người dùng';

-- 7. Bảng CATEGORY (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_category_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) COMMENT 'Danh mục phân loại sản phẩm';

-- 8. Bảng PRODUCT (Sản phẩm)
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_product_price CHECK (price >= 0),
    CONSTRAINT chk_product_cost_price CHECK (cost_price >= 0),
    CONSTRAINT chk_product_stock_quantity CHECK (stock_quantity >= 0),
    CONSTRAINT chk_product_status CHECK (status IN ('ACTIVE', 'OUT_OF_STOCK', 'INACTIVE')),
    CONSTRAINT chk_price_vs_cost CHECK (price >= cost_price)
) COMMENT 'Thông tin sản phẩm trong kho hàng';

-- 10. Bảng CUSTOMER (Khách hàng)
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) COMMENT 'Thông tin khách hàng';

-- 11. Bảng CART (Giỏ hàng)
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) COMMENT 'Giỏ hàng của khách hàng';

-- 12. Bảng CART_ITEM (Chi tiết giỏ hàng)
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_item_qty CHECK (quantity > 0),
    CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id)
) COMMENT 'Chi tiết sản phẩm trong giỏ hàng';

-- 13. Bảng ORDER (Đơn hàng)
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    shipping_address VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_total CHECK (total_amount >= 0),
    CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'))
) COMMENT 'Đơn hàng mua sản phẩm';

-- 14. Bảng ORDER_ITEM (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    quantity INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_order_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_order_item_price CHECK (price >= 0)
) COMMENT 'Chi tiết các sản phẩm trong đơn hàng';

-- 9. Bảng STOCK_LOG (Lịch sử biến động tồn kho)
CREATE TABLE IF NOT EXISTS stock_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT,
    change_quantity INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_stock_log_type CHECK (type IN ('IMPORT', 'EXPORT', 'ADJUST'))
) COMMENT 'Lịch sử thay đổi tồn kho (nhập, xuất, điều chỉnh)';
