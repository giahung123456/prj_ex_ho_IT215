các thành phần và chức năng chi tiết:

1. Đăng nhập, đăng xuất, thông tin tài khoản, phân quyền, quản lý tài khoản (admin)
   - F1.1: Đăng nhập hệ thống (Xác thực tài khoản và cấp JWT Token)
   - F1.2: Đăng xuất hệ thống (Hủy bỏ session/token)
   - F1.3: Khôi phục mật khẩu (Quên mật khẩu, gửi mã OTP qua Email)
   - F1.4: Xem và cập nhật thông tin tài khoản cá nhân (Hồ sơ cá nhân: họ tên, số điện thoại)
   - F1.5: Đổi mật khẩu tài khoản
   - F1.6: Quản lý tài khoản người dùng (Admin CRUD: Xem danh sách, tìm kiếm nhân viên, thêm mới tài khoản và phân vai trò, sửa thông tin nhân viên, khóa/mở khóa tài khoản)
   - F1.7: Phân quyền vai trò hệ thống (Kiểm soát truy cập dựa trên vai trò - RBAC: Admin, Thủ kho, Nhân viên bán hàng)

2. Quản lý danh mục
   - F2.1: Xem danh sách & Tìm kiếm danh mục sản phẩm
   - F2.2: Thêm mới danh mục sản phẩm (Validate trùng tên danh mục)
   - F2.3: Cập nhật thông tin danh mục sản phẩm (Tên, mô tả, trạng thái hoạt động)
   - F2.4: Xóa danh mục sản phẩm (Kiểm tra ràng buộc không cho xóa nếu có sản phẩm liên kết)

3. Quản lý sản phẩm
   - F3.1: Xem danh sách & Tìm kiếm sản phẩm (Lọc theo danh mục, khoảng giá, trạng thái, SKU, phân trang)
   - F3.2: Xem chi tiết thông tin và tồn kho sản phẩm (Ẩn giá vốn đối với nhân viên bán hàng)
   - F3.3: Thêm mới sản phẩm (Validate trùng SKU, tự sinh SKU nếu để trống, validate giá bán >= giá vốn, số lượng tồn kho ban đầu, danh mục)
   - F3.4: Cập nhật thông tin sản phẩm (Chỉnh sửa thông số sản phẩm, giá bán, giá vốn, ảnh đại diện)
   - F3.5: Ngừng hoạt động / Xóa sản phẩm
   - F3.6: Điều chỉnh tồn kho (Kiểm kho: tăng/giảm tồn kho, cập nhật stock_quantity, lưu lịch sử STOCK_LOG)
   - F3.7: Xem lịch sử biến động tồn kho (Stock Log: theo dõi lịch sử nhập xuất, người thực hiện, lý do điều chỉnh)

4. Quản lý khách hàng
   - F4.1: Xem danh sách & Tìm kiếm thông tin khách hàng (Lọc theo trạng thái, tìm kiếm theo tên, số điện thoại, email, mã khách hàng, phân trang)
   - F4.2: Thêm mới khách hàng (Validate họ tên, số điện thoại bắt buộc, định dạng email/SĐT, kiểm tra trùng lặp SĐT/Email, tự động sinh mã khách hàng KHxxxx)
   - F4.3: Cập nhật thông tin khách hàng (Họ tên, số điện thoại, email, địa chỉ, trạng thái hoạt động)
   - F4.4: Xóa khách hàng (Chỉ dành cho Admin)

5. Tính năng dành cho Khách hàng (Mua hàng)
   - F5.1: Tìm kiếm & Xem chi tiết sản phẩm bán lẻ (Ẩn giá vốn)
   - F5.2: Thêm sản phẩm vào giỏ hàng & Cập nhật giỏ hàng (CRUD Cart & Cart Items)
   - F5.3: Đặt hàng & Mua sản phẩm (Thông tin nhận hàng, kiểm kho, trừ kho, lưu lịch sử STOCK_LOG, xóa giỏ hàng)
   - F5.4: Lịch sử đơn hàng (Xem danh sách đơn hàng đã mua và trạng thái đơn hàng)
   - F5.5: Đăng ký tài khoản (Tự đăng ký tài khoản khách hàng, tạo tài khoản users và thông tin customers)