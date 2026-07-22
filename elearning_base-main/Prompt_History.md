# Lịch sử các câu lệnh (Prompt History)

Tài liệu này lưu lại các bước thực hiện và các tương tác với AI trong quá trình hoàn thành dự án.

## 1. Khởi động và Phân tích (Nhiệm vụ 1: Phân tích & Đặc tả Yêu cầu)
- **Prompt ban đầu**: Nhận đề bài từ người dùng, yêu cầu thực hiện phân tích nghiệp vụ, lập trình tính năng Giỏ hàng và Voucher nâng cao (Black Friday), xử lý lỗi và kiểm thử.
- **Hành động**:
  - Truy vấn cấu trúc dự án Base Code bằng công cụ `list_dir`.
  - Tìm kiếm toàn bộ các lớp Java bằng `grep_search`.
  - Đọc và phân tích các lớp thực thể (`User.java`, `Course.java`), cấu hình bảo mật (`SecurityConfig.java`, `JwtAuthenticationFilter.java`), và các Exception (`BusinessException.java`, `GlobalExceptionHandler.java`).
  - Biên dịch thử dự án Base Code bằng `.\gradlew.bat compileJava` để đảm bảo dự án gốc không có lỗi. Kết quả: `BUILD SUCCESSFUL`.
  - Viết tài liệu đặc tả yêu cầu nghiệp vụ và giải thuật tính tiền **`SRS.md`** tại thư mục gốc của dự án.
  - Thiết kế cấu trúc dữ liệu cho hai bảng mới `discount_codes` (`DiscountCode`) và `carts` (`Cart`).
  - Thiết kế quy trình tính toán tiền 5 bước có chặn trần tối đa (500,000 VNĐ) và kiểm tra điều kiện tối thiểu 2 khóa học.
  - Viết tài liệu Kế hoạch thực hiện `implementation_plan.md`.

## 2. Phát triển tính năng (Nhiệm vụ 2: Lập trình tính năng bổ sung)
- **Prompt thực thi**: Sau khi kế hoạch được phê duyệt tự động, thực hiện cài đặt các Entity, Repository, Service, Controller và Seed dữ liệu.
- **Hành động**:
  - Thay đổi thực thể [Course.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/entities/Course.java) để thêm trường `price` (Double) phục vụ tính toán.
  - Tạo mới thực thể [DiscountCode.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/entities/DiscountCode.java) định nghĩa cấu trúc của Voucher.
  - Tạo mới thực thể [Cart.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/entities/Cart.java) mô hình hóa giỏ hàng của học viên (mối quan hệ 1-1 với User, Many-to-Many với Course, và Many-to-One với DiscountCode).
  - Tạo các repository tương ứng [CartRepository.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/repositories/CartRepository.java) và [DiscountCodeRepository.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/repositories/DiscountCodeRepository.java).
  - Tạo DTO phản hồi giá trị giỏ hàng [CartPriceResponse.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/dto/CartPriceResponse.java).
  - Xây dựng tầng logic nghiệp vụ [CartService.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/models/services/CartService.java) thực hiện thuật toán tính tiền: tính tổng giá gốc, kiểm tra số lượng khóa học tối thiểu (ném `BusinessException(400)` nếu không đủ 2 khóa), tính giảm giá 20% và áp dụng mức chặn trần tối đa 500,000 VNĐ.
  - Xây dựng tầng API [CartController.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/controllers/CartController.java) cung cấp các endpoint thêm khóa học, áp dụng mã giảm giá, tính tiền và xóa giỏ hàng dựa trên người dùng đã đăng nhập (JWT).
  - Xây dựng [DataInitializer.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/java/com/elearning/config/DataInitializer.java) tự động khởi tạo dữ liệu mẫu bao gồm: tài khoản student/instructor, 3 khóa học với giá tiền thực tế và mã voucher `BLACKFRIDAY`.

## 3. Kiểm thử & Khắc phục lỗi (Nhiệm vụ 3: Tối ưu và Xử lý ngoại lệ)
- **Prompt kiểm thử & xử lý sự cố**: Chạy kiểm thử tự động, khắc phục sự cố kết nối database, chạy thử ứng dụng và ghi nhận kết quả.
- **Hành động**:
  - Tạo lớp kiểm thử [CartServiceTest.java](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/test/java/com/elearning/elearning_base/CartServiceTest.java) chứa 4 kịch bản kiểm thử toàn diện:
    1. Tính tiền không có voucher.
    2. Ném lỗi ngoại lệ BusinessException (400) khi áp dụng voucher với 1 khóa học.
    3. Áp dụng voucher cho 2 khóa học với tổng tiền lớn, kiểm tra chặn trần giảm giá đúng 500,000 VNĐ.
    4. Áp dụng voucher cho 2 khóa học với tổng tiền nhỏ, kiểm tra giảm giá đúng 20% (không chạm trần).
  - Chạy `.\gradlew.bat test`. Gặp lỗi kết nối database do MySQL cục bộ của môi trường không hoạt động ở cổng `3307` mặc định của Base code.
  - Thêm thư viện H2 database vào [build.gradle](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/build.gradle) làm runtime dependency.
  - Tạo cấu hình [application.properties](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/test/resources/application.properties) cho test runner chạy trên H2 in-memory MySQL mode.
  - Chạy lại `.\gradlew.bat test` thành công (`BUILD SUCCESSFUL`, toàn bộ 5 test case đều Pass).
  - Quét cổng mạng và phát hiện cổng MySQL trên máy đang chạy là `3306`. Cập nhật file cấu hình chính [application.properties](file:///c:/Users/OS/Downloads/elearning_base-main/elearning_base-main/src/main/resources/application.properties) sử dụng cổng `3306`.
  - Chạy thử ứng dụng bằng lệnh `.\gradlew.bat bootRun`. Ứng dụng khởi động thành công, tự động cập nhật Database Schema, chèn dữ liệu seed thành công mà không gặp bất kỳ lỗi import hay stack-trace nào.
  - Hoàn thiện tài liệu walkthrough và cập nhật task list.
