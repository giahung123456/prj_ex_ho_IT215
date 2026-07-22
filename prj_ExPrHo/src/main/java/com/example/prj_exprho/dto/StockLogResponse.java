package com.example.prj_exprho.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockLogResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer changeQuantity;
    private Integer stockAfterChange;
    private String type;
    private String reason;
    private String createdByUsername;
    private LocalDateTime createdAt;
}
