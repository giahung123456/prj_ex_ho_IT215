package com.example.prj_exprho.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductUpdateRequest {
    @Size(max = 50, message = "Mã SKU không được quá 50 ký tự")
    private String sku;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 150, message = "Tên sản phẩm không được quá 150 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.00", message = "Giá bán phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotNull(message = "Giá vốn không được để trống")
    @DecimalMin(value = "0.00", message = "Giá vốn phải lớn hơn hoặc bằng 0")
    private BigDecimal costPrice;

    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // ACTIVE, OUT_OF_STOCK, INACTIVE

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;
}
