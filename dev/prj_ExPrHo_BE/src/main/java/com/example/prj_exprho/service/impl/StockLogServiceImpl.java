package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.StockLogResponse;
import com.example.prj_exprho.entity.StockLog;
import com.example.prj_exprho.repository.StockLogRepository;
import com.example.prj_exprho.service.StockLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class StockLogServiceImpl implements StockLogService {

    @Autowired
    private StockLogRepository stockLogRepository;

    @Override
    public Page<StockLogResponse> getStockLogs(
            Long productId,
            String type,
            String createdByUsername,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            Pageable pageable) {

        String typeParam = (type == null || type.trim().isEmpty()) ? null : type.trim().toUpperCase();
        String createdByParam = (createdByUsername == null || createdByUsername.trim().isEmpty()) ? null : createdByUsername.trim();
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();

        Page<StockLog> logs = stockLogRepository.searchStockLogs(
                productId,
                typeParam,
                createdByParam,
                startDate,
                endDate,
                searchParam,
                pageable
        );

        return logs.map(this::mapToResponse);
    }

    private StockLogResponse mapToResponse(StockLog log) {
        if (log == null) return null;
        return StockLogResponse.builder()
                .id(log.getId())
                .productId(log.getProduct() != null ? log.getProduct().getId() : null)
                .productSku(log.getProduct() != null ? log.getProduct().getSku() : null)
                .productName(log.getProduct() != null ? log.getProduct().getName() : null)
                .changeQuantity(log.getChangeQuantity())
                .stockAfterChange(log.getStockAfterChange())
                .type(log.getType())
                .reason(log.getReason())
                .createdByUsername(log.getCreatedBy() != null ? log.getCreatedBy().getUsername() : "SYSTEM")
                .createdAt(log.getCreatedAt())
                .build();
    }
}
