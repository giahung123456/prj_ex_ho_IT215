# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - HỆ THỐNG MÃ GIẢM GIÁ NÂNG CAO

Tài liệu này đặc tả cấu trúc dữ liệu và thuật toán xử lý nghiệp vụ cho hệ thống Giỏ hàng và Áp dụng mã giảm giá nâng cao (Black Friday Campaign) thuộc nền tảng E-Learning.

---

## 1. Thiết kế Cấu trúc dữ liệu (Data Structure Design)

Dựa trên các Entity có sẵn trong Base Code (`User`, `Course`), chúng ta thiết kế thêm hai Entity mới là `DiscountCode` (Mã giảm giá) và `Cart` (Giỏ hàng) để lưu trữ thông tin và mô phỏng nghiệp vụ.

### 1.1. Thực thể `DiscountCode` (Mã giảm giá)
Bảng cơ sở dữ liệu tương ứng: `discount_codes`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | `PRIMARY KEY`, `AUTO_INCREMENT` | ID duy nhất của mã giảm giá |
| `code` | `String` | `UNIQUE`, `NOT NULL` | Mã code định danh (Ví dụ: `BLACKFRIDAY`) |
| `discountPercentage` | `Double` | `NOT NULL` | Phần trăm giảm giá (Ví dụ: `20.0` tương ứng 20%) |
| `maxDiscountAmount` | `Double` | `NOT NULL` | Số tiền giảm tối đa được phép (Chặn trần, ví dụ: `500000.0` VNĐ) |
| `minCoursesRequired` | `Integer` | `NOT NULL` | Số lượng khóa học tối thiểu trong giỏ hàng để áp dụng (Ví dụ: `2`) |
| `active` | `Boolean` | `NOT NULL` | Trạng thái hoạt động của mã (`true`: khả dụng, `false`: không khả dụng) |

### 1.2. Thực thể `Cart` (Giỏ hàng)
Bảng cơ sở dữ liệu tương ứng: `carts`

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | `PRIMARY KEY`, `AUTO_INCREMENT` | ID duy nhất của giỏ hàng |
| `user` | `User` | `OneToOne`, `JoinColumn(name="user_id")` | Giỏ hàng thuộc về một người dùng (Học viên) |
| `courses` | `List<Course>` | `ManyToMany`, `JoinTable(cart_courses)` | Danh sách các khóa học được thêm vào giỏ hàng |
| `discountCode` | `DiscountCode` | `ManyToOne`, `JoinColumn(nullable=true)` | Mã giảm giá đang áp dụng cho giỏ hàng này |

*Lưu ý về mối quan hệ:*
- Một học viên (`User`) có tối đa một giỏ hàng (`Cart`) đang kích hoạt.
- Một giỏ hàng (`Cart`) chứa nhiều khóa học (`Course`), và một khóa học cũng có thể được thêm vào giỏ hàng của nhiều học viên khác nhau (`@ManyToMany`).
- Một giỏ hàng (`Cart`) có thể áp dụng tối đa một mã giảm giá (`DiscountCode`), trong khi một mã giảm giá có thể được áp dụng bởi nhiều giỏ hàng khác nhau (`@ManyToOne`).

---

## 2. Đặc tả Thuật toán Tính tiền (Pricing Logic Algorithm)

Dưới đây là 5 bước chi tiết của thuật toán tính toán giá trị giỏ hàng và áp dụng mã giảm giá.

### Quy trình 5 bước tính toán & kiểm tra:

1. **Bước 1: Tính tổng giá trị gốc của giỏ hàng (Calculate Base Price)**
   - Lấy danh sách các khóa học trong giỏ hàng.
   - Duyệt qua từng khóa học, tính tổng trường `price` của tất cả các khóa học đó.
   - Công thức:
     $$\text{totalOriginalPrice} = \sum_{i=1}^{N} \text{course}_i.\text{price}$$

2. **Bước 2: Kiểm tra sự tồn tại của Mã giảm giá (Check Voucher Presence & Validity)**
   - Nếu giỏ hàng không được gán mã giảm giá (`discountCode == null`), chuyển thẳng đến **Bước 5** (không giảm giá).
   - Nếu có mã giảm giá:
     - Kiểm tra trạng thái hoạt động (`active == true`). Nếu không hoạt động hoặc không tồn tại, ném ngoại lệ `BusinessException(400, "Mã giảm giá không hợp lý hoặc đã hết hạn")`.

3. **Bước 3: Kiểm tra Điều kiện Áp dụng (Validate Promotion Rules)**
   - Đếm số lượng khóa học trong giỏ hàng: $N = \text{size of courses list}$.
   - Kiểm tra điều kiện:
     $$N < \text{discountCode}.\text{minCoursesRequired}$$
   - Nếu điều kiện trên đúng (tức là không đủ số lượng khóa học tối thiểu để áp dụng mã):
     - Ném ngoại lệ `BusinessException(400, "Phải mua ít nhất " + minCoursesRequired + " khóa học để áp dụng mã này")`.

4. **Bước 4: Tính số tiền được giảm & Áp dụng chặn trần (Calculate Discount & Cap limit)**
   - Tính số tiền giảm theo tỷ lệ phần trăm:
     $$\text{tempDiscount} = \text{totalOriginalPrice} \times \left( \frac{\text{discountCode}.\text{discountPercentage}}{100} \right)$$
   - Áp dụng mức chặn trần giảm giá tối đa (`maxDiscountAmount`):
     $$\text{discountAmount} = \min(\text{tempDiscount}, \text{discountCode}.\text{maxDiscountAmount})$$

5. **Bước 5: Tính tổng số tiền cuối cùng phải trả (Calculate Final Price)**
   - Số tiền thực tế học viên phải trả được tính bằng:
     $$\text{finalPrice} = \text{totalOriginalPrice} - \text{discountAmount}$$
   - Trả về đối tượng phản hồi DTO (`CartPriceResponse`) gồm:
     - `totalOriginalPrice`: Tổng số tiền ban đầu.
     - `discountAmount`: Số tiền được giảm sau khi đã chặn trần.
     - `finalPrice`: Số tiền cuối cùng phải thanh toán.

---

## 3. Pseudo-Code (Mã giả nghiệp vụ)

```text
FUNCTION calculateCartPrice(cartId):
    cart = findCartById(cartId)
    IF cart IS NULL THEN
        THROW BusinessException(404, "Giỏ hàng không tồn tại")
    ENDIF

    totalOriginalPrice = 0.0
    FOR EACH course IN cart.courses:
        totalOriginalPrice = totalOriginalPrice + course.price
    ENDFOR

    discountAmount = 0.0
    appliedCode = null

    IF cart.discountCode IS NOT NULL THEN
        discountCode = cart.discountCode
        appliedCode = discountCode.code
        
        // Kiểm tra số lượng khóa học tối thiểu
        IF size(cart.courses) < discountCode.minCoursesRequired THEN
            THROW BusinessException(400, "Phải mua ít nhất " + discountCode.minCoursesRequired + " khóa học để áp dụng mã này")
        ENDIF

        // Tính toán giảm giá theo phần trăm
        tempDiscount = totalOriginalPrice * (discountCode.discountPercentage / 100.0)
        
        // Áp dụng mức chặn trần
        IF tempDiscount > discountCode.maxDiscountAmount THEN
            discountAmount = discountCode.maxDiscountAmount
        ELSE
            discountAmount = tempDiscount
        ENDIF
    ENDIF

    finalPrice = totalOriginalPrice - discountAmount

    RETURN CartPriceResponse(
        totalOriginalPrice = totalOriginalPrice,
        discountAmount = discountAmount,
        finalPrice = finalPrice,
        appliedCode = appliedCode
    )
```
