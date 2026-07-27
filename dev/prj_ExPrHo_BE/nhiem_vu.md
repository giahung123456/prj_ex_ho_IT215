# NHIỆM VỤ PHÁT TRIỂN DỰ ÁN (FRONTEND & BACKEND)
**DỰ ÁN: QUẢN LÝ SẢN PHẨM**

Tài liệu này phân chia nhiệm vụ chi tiết giữa đội ngũ phát triển **Frontend** và **Backend** dựa trên các yêu cầu nghiệp vụ đã bóc tách trong tài liệu đặc tả hệ thống.

---

## 1. PHÂN HỆ XÁC THỰC, PHÂN QUYỀN, ĐĂNG KÝ & QUẢN LÝ TÀI KHOẢN

### 1.1 Nhiệm vụ Frontend
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế trang **Đăng nhập**: các trường nhập username, password, nút đăng nhập, và link "Quên mật khẩu".
  - Thiết kế trang **Đăng ký tài khoản (Khách hàng)**: Form nhập Username, Mật khẩu, Nhập lại mật khẩu, Email, Số điện thoại, Họ tên, nút đăng ký và link chuyển sang trang Đăng nhập.
  - Thiết kế trang **Quên mật khẩu**: Form 1 nhập Email nhận OTP; Form 2 nhập OTP (6 ô số riêng biệt), Mật khẩu mới và Xác nhận mật khẩu mới.
  - Thiết kế trang **Hồ sơ cá nhân**: Form chỉnh sửa Họ tên, Số điện thoại và Form đổi mật khẩu.
  - Thiết kế trang **Quản lý tài khoản (Admin)**: Bảng (Table) danh sách nhân viên (STT, Username, Email, Họ tên, SĐT, Vai trò, Trạng thái hoạt động), bộ lọc trạng thái/vai trò, thanh tìm kiếm, và modal thêm mới/chỉnh sửa thông tin nhân viên.
- **Xử lý Logic & Tích hợp**:
  - Lưu JWT Token vào LocalStorage hoặc HTTP-only Cookie sau khi đăng nhập thành công.
  - Cấu hình HTTP Client (Axios/Fetch) để tự động đính kèm Token xác thực (`Authorization: Bearer <Token>`) vào mọi request gửi đi.
  - Viết bộ định tuyến bảo vệ (Route Guards/Middleware) ở Client để chặn người dùng chưa đăng nhập truy cập các trang nội bộ.
  - Xử lý ẩn/hiện các thành phần giao diện dựa trên vai trò (ví dụ: Sales không nhìn thấy menu "Quản lý nhân viên", không thấy cột "Giá vốn" trên bảng sản phẩm).
  - Tích hợp gọi các API: Đăng ký tài khoản, Đăng nhập, Đăng xuất, Khôi phục mật khẩu (gửi OTP & đặt lại pass), Xem/Cập nhật hồ sơ, CRUD nhân viên, Khóa/Mở khóa tài khoản.

### 1.2 Nhiệm vụ Backend
- **Cơ sở dữ liệu (Database Schema)**:
  - Thiết kế cấu trúc bảng: `USER`, `ROLE`, `PERMISSION`, `USER_ROLE`, `ROLE_PERMISSION`, `ACTION_LOG` với các ràng buộc khóa ngoại và chỉ mục cần thiết.
- **Xây dựng API**:
  - **API Đăng ký (Khách hàng)**: Tiếp nhận credentials và thông tin cá nhân của khách hàng, kiểm tra trùng lặp username, email, số điện thoại. Validate định dạng dữ liệu đầu vào. Mã hóa mật khẩu bằng bcrypt, lưu tài khoản mới vào bảng `users` với vai trò `CUSTOMER` và tự động tạo hồ sơ khách hàng tương ứng ở bảng `customers` (sinh mã khách hàng `KHxxxx`) trong một Transaction duy nhất.
  - **API Đăng nhập**: Tiếp nhận credentials, kiểm tra sự tồn tại tài khoản, kiểm tra trạng thái hoạt động, so khớp bcrypt password hash, tạo JWT token chứa vai trò (claims) gửi về client. Tăng số lần nhập sai nếu thất bại, reset về 0 nếu thành công.
  - **API Đăng xuất**: Thực hiện thu hồi hoặc đưa token hiện tại vào danh sách vô hiệu hóa (blacklist).
  - **API Quên mật khẩu**: Nhận email, kiểm tra tồn tại, tạo mã OTP 6 chữ số ngẫu nhiên gửi qua Mail Service, validate OTP và cập nhật mật khẩu mới đã mã hóa.
  - **API Hồ sơ cá nhân**: API lấy thông tin tài khoản hiện tại, API cập nhật thông tin cá nhân, và API đổi mật khẩu (yêu cầu so khớp mật khẩu cũ).
  - **API CRUD Nhân viên (Chỉ Admin)**: Xem danh sách (phân trang, lọc, tìm kiếm), Thêm mới nhân viên (tạo mật khẩu tạm ngẫu nhiên, gửi mail cho nhân viên mới), Sửa vai trò, Khóa/Mở khóa tài khoản nhân viên.
- **Bảo mật & Middleware**:
  - Viết Middleware Authentication để giải mã và kiểm tra tính hợp lệ của JWT Token.
  - Viết Middleware Authorization (RBAC) để chặn truy cập ở mức API đối với các tài khoản không có quyền hạn tương ứng.
  - Viết API ghi nhận logs lịch sử hoạt động hệ thống (`ACTION_LOG`) cho mỗi thao tác nhạy cảm.

---

## 2. PHÂN HỆ QUẢN LÝ DANH MỤC SẢN PHẨM

### 2.1 Nhiệm vụ Frontend
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế màn hình **Quản lý danh mục** (chỉ Admin truy cập): Bảng danh mục (STT, Tên danh mục, Mô tả, Số sản phẩm liên kết, Trạng thái hoạt động, Hành động).
  - Thiết kế Modal thêm mới và cập nhật danh mục sản phẩm.
- **Xử lý Logic & Tích hợp**:
  - Tích hợp gọi các API: Lấy danh sách danh mục (phục vụ bảng quản lý và dropdown trên form sản phẩm), Thêm mới danh mục, Cập nhật danh mục, Xóa danh mục.
  - Hiển thị Toast thông báo lỗi chi tiết khi tạo trùng tên danh mục hoặc xóa danh mục đang có sản phẩm.

### 2.2 Nhiệm vụ Backend
- **Cơ sở dữ liệu (Database Schema)**:
  - Thiết kế cấu trúc bảng `CATEGORY`.
- **Xây dựng API (Chỉ vai trò ADMIN được thao tác ghi)**:
  - **API Xem danh sách danh mục**: Hỗ trợ bộ lọc trạng thái, tìm kiếm tên danh mục, và đếm số lượng sản phẩm liên kết.
  - **API Thêm mới danh mục**: Validate tên danh mục bắt buộc và duy nhất trong DB.
  - **API Cập nhật danh mục**: Cho phép sửa tên, mô tả, trạng thái danh mục.
  - **API Xóa danh mục**: Kiểm tra ràng buộc nghiệp vụ (nếu danh mục đang có chứa sản phẩm, chặn thao tác và trả về lỗi `ERR_VAL_04`).

---

## 3. PHÂN HỆ QUẢN LÝ SẢN PHẨM & TỒN KHO

### 3.1 Nhiệm vụ Frontend
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế trang **Danh sách sản phẩm**: Thanh bộ lọc (Tìm kiếm từ khóa, Lọc danh mục, Lọc trạng thái, Lọc khoảng giá), Bảng danh sách sản phẩm, thanh phân trang.
  - Thiết kế trang **Chi tiết sản phẩm**: Hiển thị thông số chi tiết, mô tả dài, ảnh sản phẩm, số lượng tồn kho hiện tại.
  - Thiết kế trang **Thêm mới / Chỉnh sửa sản phẩm**: Form nhập liệu (SKU, Tên, Danh mục, Giá bán, Giá vốn, Số lượng tồn kho ban đầu, Ảnh sản phẩm, Mô tả).
  - Thiết kế Modal **Điều chỉnh tồn kho**: Hiển thị số lượng tồn hiện tại, Form nhập số lượng thay đổi,Dropdown chọn loại điều chỉnh (Nhập/Xuất/Kiểm kho), và ô nhập lý do (bắt buộc).
  - Thiết kế trang **Lịch sử biến động kho**: Bảng lịch sử giao dịch kho (Thời gian, SKU, Tên sản phẩm, Số lượng biến động dạng màu xanh `+X` hoặc đỏ `-X`, Số lượng tồn sau thay đổi, Loại điều chỉnh, Người thực hiện, Lý do).
- **Xử lý Logic & Tích hợp**:
  - Phân quyền hiển thị trường **Giá vốn** (`cost_price`) và các nút "Thêm", "Sửa", "Điều chỉnh kho": Chỉ hiển thị cho Admin và Storekeeper; ẩn hoàn toàn đối với Sales.
  - Tích hợp các API: Xem danh sách, Tìm kiếm sản phẩm, Xem chi tiết, Thêm mới, Cập nhật thông tin, Upload ảnh sản phẩm, Điều chỉnh tồn kho, Xem logs lịch sử kho.

### 3.2 Nhiệm vụ Backend
- **Cơ sở dữ liệu (Database Schema)**:
  - Thiết kế cấu trúc bảng `PRODUCT` và bảng `STOCK_LOG` (lưu trữ lịch sử biến động kho).
- **Xây dựng API**:
  - **API Danh sách sản phẩm**: Trả về danh sách sản phẩm phân trang, lọc theo danh mục, khoảng giá, trạng thái, tìm kiếm theo tên hoặc SKU (hỗ trợ tìm kiếm không dấu).
  - **API Chi tiết sản phẩm**: Trả về thông tin chi tiết. **Kiểm tra quyền của token**: Nếu user là `SALES` thì ẩn/loại bỏ trường `cost_price` khỏi JSON kết quả trả về.
  - **API Thêm mới sản phẩm**: Validate dữ liệu (tên sản phẩm không trống, giá >= 0), validate trùng SKU (tự động sinh mã SKU theo cấu trúc nếu để trống), lưu sản phẩm mới và ghi log số lượng ban đầu vào `STOCK_LOG`.
  - **API Cập nhật sản phẩm**: Cập nhật các trường thông tin sản phẩm vào DB.
  - **API Điều chỉnh tồn kho (Kiểm kho)**: Thực hiện tính toán tồn kho mới. Validate số lượng tồn mới không được nhỏ hơn 0 (nếu < 0 trả về lỗi `ERR_VAL_03`). Cập nhật `stock_quantity` của sản phẩm và thêm mới một bản ghi log chi tiết vào bảng `STOCK_LOG` (ghi nhận người thực hiện, thời gian, loại điều chỉnh, lý do chênh lệch).
  - **API Xem lịch sử kho (`STOCK_LOG`)**: Xem toàn bộ lịch sử biến động có lọc theo khoảng thời gian, loại điều chỉnh, người thực hiện, hoặc lọc riêng theo từng sản phẩm.

---

## 4. PHÂN HỆ QUẢN LÝ KHÁCH HÀNG

### 4.1 Nhiệm vụ Frontend
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế trang **Quản lý khách hàng**: Bảng danh sách khách hàng (STT, Mã khách hàng, Họ tên, SĐT, Email, Địa chỉ, Trạng thái, Hành động), bộ lọc trạng thái, thanh tìm kiếm (theo tên/SĐT/Email), phân trang.
  - Thiết kế Modal **Thêm mới / Chỉnh sửa khách hàng**: Form nhập liệu (Họ tên, SĐT, Email, Địa chỉ, Trạng thái).
- **Xử lý Logic & Tích hợp**:
  - Tích hợp các API: Xem danh sách, Tìm kiếm khách hàng, Thêm mới, Cập nhật thông tin, Xóa khách hàng.
  - Hiển thị Toast thông báo lỗi khi trùng SĐT/Email hoặc định dạng không hợp lệ.

### 4.2 Nhiệm vụ Backend
- **Cơ sở dữ liệu (Database Schema)**:
  - Thiết kế bảng `customers` (cho cả PostgreSQL và MySQL).
- **Xây dựng API**:
  - **API Xem danh sách khách hàng**: Hỗ trợ tìm kiếm theo nhiều trường (tên, SĐT, email, mã khách hàng), lọc trạng thái, phân trang.
  - **API Thêm mới khách hàng**: Validate dữ liệu (Họ tên, SĐT bắt buộc; định dạng SĐT/Email hợp lệ; kiểm tra trùng SĐT/Email). Tự động sinh mã khách hàng theo định dạng `KH` kèm 4 số tự tăng.
  - **API Cập nhật khách hàng**: Validate trùng SĐT/Email với các khách hàng khác.
  - **API Xóa khách hàng (Chỉ Admin)**: Xóa bản ghi khách hàng khỏi DB.

---

## 5. PHÂN HỆ MUA HÀNG & GIỎ HÀNG DÀNH CHO KHÁCH HÀNG

### 5.1 Nhiệm vụ Frontend
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế trang chủ/trang danh sách sản phẩm bán lẻ (Tìm kiếm, bộ lọc danh mục, giá, nút "Thêm vào giỏ").
  - Thiết kế màn hình **Chi tiết sản phẩm** cho khách hàng (Mô tả, giá bán, nút tăng giảm số lượng, thêm vào giỏ, ẩn giá vốn).
  - Thiết kế trang **Giỏ hàng**: Danh sách sản phẩm trong giỏ (ảnh, tên, đơn giá, số lượng thay đổi bằng input, thành tiền), nút xóa, tổng tiền tạm tính, nút "Tiến hành đặt hàng".
  - Thiết kế trang **Thanh toán / Đặt hàng**: Form thông tin người nhận (Họ tên, SĐT, Địa chỉ giao hàng), danh sách sản phẩm xác nhận, tổng cộng tiền đơn hàng, nút "Xác nhận đặt hàng".
  - Thiết kế trang **Lịch sử đơn hàng**: Danh sách các đơn hàng đã đặt (Mã đơn hàng, ngày đặt, tổng tiền, trạng thái đơn hàng dưới dạng status badges).
- **Xử lý Logic & Tích hợp**:
  - Tích hợp các API: Tìm kiếm sản phẩm bán lẻ, chi tiết sản phẩm, CRUD giỏ hàng, API Checkout/Đặt hàng, xem lịch sử đơn hàng.
  - Xử lý chặn hiển thị giá vốn (`cost_price`) ở mức giao diện khách hàng.

### 5.2 Nhiệm vụ Backend
- **Cơ sở dữ liệu (Database Schema)**:
  - Thiết kế các bảng: `carts`, `cart_items`, `orders`, `order_items` với các khóa ngoại, check constraints.
- **Xây dựng API**:
  - **API tìm kiếm sản phẩm bán lẻ**: Ẩn/loại bỏ trường `cost_price` khỏi JSON trả về.
  - **API CRUD Giỏ hàng**: Lấy chi tiết giỏ hàng hiện tại của khách hàng đăng nhập, thêm/sửa/xóa sản phẩm trong giỏ.
  - **API Đặt hàng (Checkout)**: Nhận thông tin người nhận và tiến hành thanh toán trong Transaction:
    - Lock dòng sản phẩm cần đặt.
    - Validate tồn kho từng mặt hàng. Nếu thiếu hàng, ném ngoại lệ `ERR_VAL_08`.
    - Tạo bản ghi đơn hàng (`orders`) và chi tiết đơn hàng (`order_items`).
    - Cập nhật số lượng tồn kho (`stock_quantity`) của sản phẩm.
    - Thêm bản ghi biến động kho vào bảng `stock_logs` với loại `EXPORT` và lý do xuất hàng theo đơn.
    - Xóa sản phẩm khỏi giỏ hàng sau khi đặt thành công.
  - **API Lịch sử đơn hàng**: Trả về danh sách đơn hàng của khách hàng hiện tại.
  - **API Cập nhật trạng thái đơn hàng (Sales / Admin)**: Cho phép chuyển trạng thái đơn hàng (PENDING -> CONFIRMED -> SHIPPING -> COMPLETED / CANCELLED).

---

## 6. PHÂN HỆ THỐNG KÊ & BÁO CÁO (DASHBOARD) DÀNH CHO ADMIN, THỦ KHO (STOREKEEPER) & BÁN HÀNG (SALES)

### 6.1 Nhiệm vụ Frontend
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế màn hình **Dashboard Overview** có khả năng thay đổi giao diện/thống kê linh hoạt tùy thuộc vào vai trò của tài khoản đang đăng nhập:
    - **Giao diện Admin**:
      - Các thẻ tóm tắt (Cards): Tổng doanh thu (VNĐ), Tổng số đơn hàng (phân chia theo trạng thái), Tổng số sản phẩm, Tổng số khách hàng và nhân viên.
      - Biểu đồ: Doanh thu theo thời gian (ngày/tháng), Biểu đồ top 5 sản phẩm bán chạy nhất.
      - Cơ cấu doanh thu theo Danh mục sản phẩm (Revenue allocation by Category).
      - Danh sách 5 đơn hàng mới nhất trên toàn hệ thống (Recent orders).
      - Chi tiết các sản phẩm sắp hết hàng / Hết hàng (Low-stock details).
    - **Giao diện Thủ kho (Storekeeper)**:
      - Các thẻ tóm tắt (Cards): Tổng số sản phẩm trong kho, Số lượng sản phẩm đã hết hàng (Out of stock), Số lượng sản phẩm sắp hết hàng (dưới ngưỡng an toàn), Tổng số lượt nhập/xuất kho trong ngày.
      - Biểu đồ: Cơ cấu tồn kho theo danh mục sản phẩm (Category allocation).
      - Bảng liệt kê top các sản phẩm có lượng tồn kho thấp nhất cần nhập thêm.
    - **Giao diện Bán hàng (Sales)**:
      - Các thẻ tóm tắt (Cards): Doanh số cá nhân đạt được hôm nay/tháng này, Số đơn hàng cá nhân đã chốt thành công, Số đơn hàng đang chờ duyệt.
      - Biểu đồ: Doanh số cá nhân theo các ngày trong tháng.
      - Danh sách các đơn đặt hàng mới phát sinh cần xử lý gấp.
- **Xử lý Logic & Tích hợp**:
  - Tích hợp gọi các API tương ứng với từng vai trò sau khi xác định quyền hạn/vai trò từ JWT token.
  - Sử dụng các thư viện biểu đồ (ví dụ: Chart.js, Recharts) để biểu diễn trực quan dữ liệu thống kê.
  - Xử lý các khoảng thời gian lọc linh động (Hôm nay, 7 ngày qua, 30 ngày qua, Tháng này).

### 6.2 Nhiệm vụ Backend
- **Cơ sở dữ liệu & Tối ưu hóa truy vấn**:
  - Viết các truy vấn SQL hoặc JPQL tổng hợp (Aggregation), sử dụng `SUM`, `COUNT`, `GROUP BY` tối ưu trên các bảng `orders`, `order_items`, `products`, `stock_logs`.
  - Đánh chỉ mục (Index) trên các cột thời gian (`created_at`) và trạng thái đơn hàng để tối ưu hóa hiệu năng truy vấn báo cáo.
- **Xây dựng API**:
  - **API Thống kê Admin (`/api/v1/dashboard/admin`)**:
    - Trả về tổng doanh thu của các đơn hàng có trạng thái `COMPLETED`.
    - Trả về số lượng đơn hàng phân theo từng trạng thái.
    - Trả về doanh thu theo các mốc thời gian lọc (ngày/tháng).
    - Trả về danh sách top sản phẩm bán chạy nhất (tính theo số lượng bán và doanh thu thu về).
    - Trả về danh sách xếp hạng doanh số của các tài khoản `SALES`.
  - **API Thống kê Thủ kho (`/api/v1/dashboard/storekeeper`)**:
    - Trả về số lượng sản phẩm có `stock_quantity = 0`.
    - Trả về danh sách sản phẩm sắp hết hàng (ví dụ: `stock_quantity < 10`).
    - Trả về tổng số lượng và số giao dịch nhập/xuất kho trong ngày từ bảng `stock_logs`.
    - Trả về số lượng tồn kho tổng hợp theo từng danh mục.
  - **API Thống kê Bán hàng (`/api/v1/dashboard/sales`)**:
    - **Bảo mật**: Chỉ cho phép người dùng có vai trò `SALES` xem dữ liệu của chính mình dựa trên `userId` trích xuất từ JWT token (hoặc Admin được xem của tất cả).
    - Trả về tổng doanh thu do chính nhân viên đó tạo ra (tính từ các đơn hàng hoàn thành có trường `created_by` hoặc `sales_id` trùng với nhân viên đó).
    - Trả về số lượng đơn hàng do nhân viên đó phụ trách phân theo trạng thái.
    - Trả về biểu đồ doanh thu cá nhân theo thời gian.