package com.example.prj_exprho.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemRequest {
    @NotNull(message = "Mã sản phẩm không được để trống.")
    private Long productId;

    @Min(value = 1, message = "Số lượng phải lớn hơn 0.")
    private Integer quantity;
}
