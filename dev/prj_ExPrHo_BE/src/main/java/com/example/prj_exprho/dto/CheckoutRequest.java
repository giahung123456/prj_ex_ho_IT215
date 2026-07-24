package com.example.prj_exprho.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {
    @NotBlank(message = "Địa chỉ nhận hàng không được để trống.")
    private String shippingAddress;

    @NotBlank(message = "Số điện thoại nhận hàng không được để trống.")
    private String shippingPhone;
}
