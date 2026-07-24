package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.StockLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    @Query("SELECT s FROM StockLog s WHERE " +
           "(:productId IS NULL OR s.product.id = :productId) AND " +
           "(:type IS NULL OR s.type = :type) AND " +
           "(:createdByUsername IS NULL OR s.createdBy.username = :createdByUsername) AND " +
           "(:startDate IS NULL OR s.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR s.createdAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(s.product.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.product.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<StockLog> searchStockLogs(
            @Param("productId") Long productId,
            @Param("type") String type,
            @Param("createdByUsername") String createdByUsername,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            Pageable pageable);
}
