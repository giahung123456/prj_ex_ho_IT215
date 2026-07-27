package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.entity.*;
import com.example.prj_exprho.repository.*;
import com.example.prj_exprho.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StockLogRepository stockLogRepository;

    @Autowired
    private ActionLogRepository actionLogRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminStats(String period) {
        LocalDateTime startDate = getStartDateForPeriod(period);

        BigDecimal totalRevenue = orderRepository.sumTotalRevenueFrom(startDate);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        // Count products and customers
        long productsCount = productRepository.count();
        long customersCount = customerRepository.count();

        // Orders count & stats in the period
        List<Object[]> statusCounts = orderRepository.countOrdersByStatusFrom(startDate);
        Map<String, Long> ordersByStatus = new HashMap<>();
        ordersByStatus.put("PENDING", 0L);
        ordersByStatus.put("CONFIRMED", 0L);
        ordersByStatus.put("SHIPPING", 0L);
        ordersByStatus.put("COMPLETED", 0L);
        ordersByStatus.put("CANCELLED", 0L);

        long totalOrders = 0;
        for (Object[] obj : statusCounts) {
            String status = (String) obj[0];
            long count = ((Number) obj[1]).longValue();
            ordersByStatus.put(status, count);
            totalOrders += count;
        }

        // Low stock count
        long lowStockCount = productRepository.countLowStockProducts();

        // Revenue trend (completed orders in the period)
        List<Order> completedOrders = orderRepository.findCompletedOrdersFrom(startDate);
        Map<String, BigDecimal> trendMap = new TreeMap<>(); // tree map to keep sorted by date string
        
        // Pre-populate all days in the period with 0 to avoid empty data gaps
        LocalDateTime temp = startDate;
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        while (temp.isBefore(now) || temp.toLocalDate().isEqual(now.toLocalDate())) {
            trendMap.put(temp.format(dtf), BigDecimal.ZERO);
            temp = temp.plusDays(1);
        }

        for (Order order : completedOrders) {
            String day = order.getCreatedAt().format(dtf);
            BigDecimal current = trendMap.getOrDefault(day, BigDecimal.ZERO);
            trendMap.put(day, current.add(order.getTotalAmount()));
        }

        List<AdminDashboardResponse.TrendItem> revenueTrend = trendMap.entrySet().stream()
                .map(entry -> new AdminDashboardResponse.TrendItem(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // Top Selling Products
        List<Object[]> topProductObjs = orderRepository.findTopSellingProductsFrom(startDate, PageRequest.of(0, 5));
        List<AdminDashboardResponse.TopProductItem> topProducts = topProductObjs.stream()
                .map(obj -> AdminDashboardResponse.TopProductItem.builder()
                        .productId((Long) obj[0])
                        .productName((String) obj[1])
                        .sku((String) obj[2])
                        .quantitySold(((Number) obj[3]).longValue())
                        .revenue((BigDecimal) obj[4])
                        .build())
                .collect(Collectors.toList());

        // 1. Category Revenue Breakdown
        List<Object[]> catRevObjs = orderRepository.findCategoryRevenueFrom(startDate);
        List<AdminDashboardResponse.CategoryRevenueItem> categoryRevenue = catRevObjs.stream()
                .map(obj -> AdminDashboardResponse.CategoryRevenueItem.builder()
                        .categoryName((String) obj[0])
                        .revenue((BigDecimal) obj[1])
                        .build())
                .collect(Collectors.toList());

        // 2. Recent 5 Orders overall
        List<Order> recentOrdersList = orderRepository.findTop5ByOrderByCreatedAtDesc();
        List<OrderResponse> recentOrders = recentOrdersList.stream()
                .map(order -> OrderResponse.builder()
                        .id(order.getId())
                        .orderCode(order.getOrderCode())
                        .totalAmount(order.getTotalAmount())
                        .status(order.getStatus())
                        .shippingAddress(order.getShippingAddress())
                        .shippingPhone(order.getShippingPhone())
                        .createdAt(order.getCreatedAt())
                        .updatedAt(order.getUpdatedAt())
                        .salesUsername(order.getSales() != null ? order.getSales().getUsername() : null)
                        .username(order.getCustomer() != null ? order.getCustomer().getUsername() : null)
                        .build())
                .collect(Collectors.toList());

        // 3. Top 5 Lowest Stock Products (Low stock alerts)
        List<Product> lowStockProdsList = productRepository.findLowestStockProducts(PageRequest.of(0, 5));
        List<ProductResponse> lowStockProducts = lowStockProdsList.stream()
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .sku(product.getSku())
                        .name(product.getName())
                        .price(product.getPrice())
                        .costPrice(product.getCostPrice())
                        .stockQuantity(product.getStockQuantity())
                        .status(product.getStatus())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                        .build())
                .collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .ordersCount(totalOrders)
                .productsCount(productsCount)
                .customersCount(customersCount)
                .ordersByStatus(ordersByStatus)
                .revenueTrend(revenueTrend)
                .topProducts(topProducts)
                .recentOrders(recentOrders)
                .lowStockProducts(lowStockProducts)
                .categoryRevenue(categoryRevenue)
                .lowStockCount(lowStockCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StorekeeperDashboardResponse getStorekeeperStats() {
        long totalProducts = productRepository.count();
        long outOfStockCount = productRepository.countOutOfStockProducts();
        long lowStockCount = productRepository.countLowStockProducts();

        // Product category allocation
        List<Object[]> catAllocObjs = productRepository.countProductsByCategory();
        Map<String, Long> categoryStockAllocation = new HashMap<>();
        for (Object[] obj : catAllocObjs) {
            categoryStockAllocation.put((String) obj[0], ((Number) obj[1]).longValue());
        }

        // Lowest stock products (top 10)
        List<Product> products = productRepository.findLowestStockProducts(PageRequest.of(0, 10));
        List<ProductResponse> lowestStockProducts = products.stream()
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .sku(product.getSku())
                        .name(product.getName())
                        .description(product.getDescription())
                        .price(product.getPrice())
                        .costPrice(product.getCostPrice())
                        .stockQuantity(product.getStockQuantity())
                        .status(product.getStatus())
                        .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                        .createdAt(product.getCreatedAt())
                        .updatedAt(product.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        // Daily logs summaries (from start of today)
        LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<Object[]> stockSummaryObjs = stockLogRepository.findDailyStockLogSummaryFrom(startOfToday);
        long dailyImportCount = 0;
        long dailyExportCount = 0;
        long dailyAdjustCount = 0;
        long dailyTotalChangeQuantity = 0;

        for (Object[] obj : stockSummaryObjs) {
            String type = (String) obj[0];
            long count = ((Number) obj[1]).longValue();
            long sumQty = ((Number) obj[2]).longValue();
            if ("IMPORT".equalsIgnoreCase(type)) {
                dailyImportCount = count;
            } else if ("EXPORT".equalsIgnoreCase(type)) {
                dailyExportCount = count;
            } else if ("ADJUST".equalsIgnoreCase(type)) {
                dailyAdjustCount = count;
            }
            dailyTotalChangeQuantity += sumQty;
        }

        return StorekeeperDashboardResponse.builder()
                .totalProducts(totalProducts)
                .outOfStockCount(outOfStockCount)
                .lowStockCount(lowStockCount)
                .categoryStockAllocation(categoryStockAllocation)
                .lowestStockProducts(lowestStockProducts)
                .dailyImportCount(dailyImportCount)
                .dailyExportCount(dailyExportCount)
                .dailyAdjustCount(dailyAdjustCount)
                .dailyTotalChangeQuantity(dailyTotalChangeQuantity)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SalesDashboardResponse getSalesStats(String period, String salesUsername) {
        LocalDateTime startDate = getStartDateForPeriod(period);

        BigDecimal totalRevenue = orderRepository.sumTotalRevenueBySalesFrom(salesUsername, startDate);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        // Orders count by status for entire system (system-wide status distribution)
        List<Object[]> statusCounts = orderRepository.countOrdersByStatusFrom(startDate);
        Map<String, Long> ordersByStatus = new HashMap<>();
        ordersByStatus.put("PENDING", 0L);
        ordersByStatus.put("CONFIRMED", 0L);
        ordersByStatus.put("SHIPPING", 0L);
        ordersByStatus.put("COMPLETED", 0L);
        ordersByStatus.put("CANCELLED", 0L);

        long totalOrders = 0;
        for (Object[] obj : statusCounts) {
            String status = (String) obj[0];
            long count = ((Number) obj[1]).longValue();
            ordersByStatus.put(status, count);
            totalOrders += count;
        }

        // Top 5 Lowest Stock Products (Low stock alerts)
        List<Product> lowStockProdsList = productRepository.findLowestStockProducts(PageRequest.of(0, 5));
        List<ProductResponse> lowStockProducts = lowStockProdsList.stream()
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .sku(product.getSku())
                        .name(product.getName())
                        .price(product.getPrice())
                        .costPrice(null) // Security constraint: Sales role cannot view cost price
                        .stockQuantity(product.getStockQuantity())
                        .status(product.getStatus())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                        .build())
                .collect(Collectors.toList());

        // Top Selling Products of system
        List<Object[]> topProductObjs = orderRepository.findTopSellingProductsFrom(startDate, PageRequest.of(0, 5));
        List<AdminDashboardResponse.TopProductItem> topProducts = topProductObjs.stream()
                .map(obj -> AdminDashboardResponse.TopProductItem.builder()
                        .productId((Long) obj[0])
                        .productName((String) obj[1])
                        .sku((String) obj[2])
                        .quantitySold(((Number) obj[3]).longValue())
                        .revenue((BigDecimal) obj[4])
                        .build())
                .collect(Collectors.toList());

        return SalesDashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .ordersCount(totalOrders)
                .ordersByStatus(ordersByStatus)
                .lowStockProducts(lowStockProducts)
                .topProducts(topProducts)
                .build();
    }

    private LocalDateTime getStartDateForPeriod(String period) {
        LocalDateTime now = LocalDateTime.now();
        if ("today".equalsIgnoreCase(period)) {
            return now.toLocalDate().atStartOfDay();
        } else if ("7days".equalsIgnoreCase(period)) {
            return now.minusDays(7).toLocalDate().atStartOfDay();
        } else if ("30days".equalsIgnoreCase(period)) {
            return now.minusDays(30).toLocalDate().atStartOfDay();
        } else if ("month".equalsIgnoreCase(period)) {
            return now.withDayOfMonth(1).toLocalDate().atStartOfDay();
        }
        // Default to last 30 days
        return now.minusDays(30).toLocalDate().atStartOfDay();
    }
}
