package com.example.prj_exprho.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorekeeperDashboardResponse {
    private Long totalProducts;
    private Long outOfStockCount;
    private Long lowStockCount;
    private Map<String, Long> categoryStockAllocation;
    private List<ProductResponse> lowestStockProducts;
    private Long dailyImportCount;
    private Long dailyExportCount;
    private Long dailyAdjustCount;
    private Long dailyTotalChangeQuantity;
}
