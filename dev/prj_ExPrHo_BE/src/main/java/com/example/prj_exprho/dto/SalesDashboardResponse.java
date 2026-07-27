package com.example.prj_exprho.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesDashboardResponse {
    private BigDecimal totalRevenue;
    private Long ordersCount;
    private Map<String, Long> ordersByStatus;
    private List<ProductResponse> lowStockProducts;
    private List<AdminDashboardResponse.TopProductItem> topProducts;
}
