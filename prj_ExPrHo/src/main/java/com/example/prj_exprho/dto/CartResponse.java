package com.example.prj_exprho.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponse {
    private Long id;
    private Long customerId;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
}
