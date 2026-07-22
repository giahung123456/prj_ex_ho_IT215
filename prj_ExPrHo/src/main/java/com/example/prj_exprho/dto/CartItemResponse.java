package com.example.prj_exprho.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private BigDecimal productPrice;
    private Integer quantity;
    private BigDecimal itemTotal;
}
