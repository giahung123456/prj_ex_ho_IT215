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
public class AdminDashboardResponse {
    private BigDecimal totalRevenue;
    private Long ordersCount;
    private Long productsCount;
    private Long customersCount;
    private Map<String, Long> ordersByStatus;
    private List<TrendItem> revenueTrend;
    private List<TopProductItem> topProducts;
    private List<OrderResponse> recentOrders;
    private List<ProductResponse> lowStockProducts;
    private List<CategoryRevenueItem> categoryRevenue;
    private Long lowStockCount;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendItem {
        private String date; // yyyy-MM-dd
        private BigDecimal revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProductItem {
        private Long productId;
        private String productName;
        private String sku;
        private Long quantitySold;
        private BigDecimal revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryRevenueItem {
        private String categoryName;
        private BigDecimal revenue;
    }
}
