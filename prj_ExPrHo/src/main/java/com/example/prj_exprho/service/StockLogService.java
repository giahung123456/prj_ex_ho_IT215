package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.StockLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface StockLogService {
    Page<StockLogResponse> getStockLogs(
            Long productId,
            String type,
            String createdByUsername,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            Pageable pageable);
}
