package com.example.prj_exprho.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemUpdateRequest {
    @NotNull(message = "Số lượng không được để trống.")
    private Integer quantity;
}
