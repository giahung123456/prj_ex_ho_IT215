package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    List<Order> findByCustomerUsernameOrderByCreatedAtDesc(String username);
    Page<Order> findByCustomerUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    @Query("SELECT MAX(o.orderCode) FROM Order o WHERE o.orderCode LIKE 'DH%'")
    String findMaxOrderCode();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED'")
    java.math.BigDecimal sumTotalRevenue();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :startDate")
    java.math.BigDecimal sumTotalRevenueFrom(@Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countOrdersByStatus();

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.createdAt >= :startDate GROUP BY o.status")
    List<Object[]> countOrdersByStatusFrom(@Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT o FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :startDate ORDER BY o.createdAt ASC")
    List<Order> findCompletedOrdersFrom(@Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT o FROM Order o WHERE o.status = 'COMPLETED' AND o.sales.username = :salesUsername AND o.createdAt >= :startDate ORDER BY o.createdAt ASC")
    List<Order> findCompletedOrdersBySalesFrom(@Param("salesUsername") String salesUsername, @Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT oi.product.id, oi.product.name, oi.product.sku, SUM(oi.quantity), SUM(oi.price * oi.quantity) " +
           "FROM OrderItem oi WHERE oi.order.status = 'COMPLETED' AND oi.order.createdAt >= :startDate " +
           "GROUP BY oi.product.id, oi.product.name, oi.product.sku " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProductsFrom(@Param("startDate") java.time.LocalDateTime startDate, Pageable pageable);

    @Query("SELECT o.sales.id, o.sales.fullName, o.sales.username, COUNT(o), SUM(o.totalAmount) " +
           "FROM Order o WHERE o.status = 'COMPLETED' AND o.sales IS NOT NULL AND o.createdAt >= :startDate " +
           "GROUP BY o.sales.id, o.sales.fullName, o.sales.username " +
           "ORDER BY SUM(o.totalAmount) DESC")
    List<Object[]> findSalesStaffRankingFrom(@Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED' AND o.sales.username = :salesUsername AND o.createdAt >= :startDate")
    java.math.BigDecimal sumTotalRevenueBySalesFrom(@Param("salesUsername") String salesUsername, @Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.sales.username = :salesUsername GROUP BY o.status")
    List<Object[]> countOrdersByStatusForSales(@Param("salesUsername") String salesUsername);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.sales.username = :salesUsername AND o.createdAt >= :startDate GROUP BY o.status")
    List<Object[]> countOrdersByStatusForSalesFrom(@Param("salesUsername") String salesUsername, @Param("startDate") java.time.LocalDateTime startDate);

    List<Order> findTop5BySalesUsernameOrderByCreatedAtDesc(String salesUsername);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT c.name, SUM(oi.quantity * oi.price) " +
           "FROM OrderItem oi " +
           "JOIN oi.order o " +
           "JOIN oi.product p " +
           "JOIN p.category c " +
           "WHERE o.status = 'COMPLETED' AND o.createdAt >= :startDate " +
           "GROUP BY c.name " +
           "ORDER BY SUM(oi.quantity * oi.price) DESC")
    List<Object[]> findCategoryRevenueFrom(@Param("startDate") java.time.LocalDateTime startDate);

    long countByStatus(String status);
}
