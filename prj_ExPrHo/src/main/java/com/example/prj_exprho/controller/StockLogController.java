package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.StockLogResponse;
import com.example.prj_exprho.service.StockLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/stock-logs")
public class StockLogController {

    @Autowired
    private StockLogService stockLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<Page<StockLogResponse>> getStockLogs(
            @RequestParam(value = "productId", required = false) Long productId,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "createdByUsername", required = false) String createdByUsername,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        LocalDateTime start = null;
        if (startDate != null && !startDate.trim().isEmpty()) {
            try {
                start = java.time.LocalDate.parse(startDate.trim()).atStartOfDay();
            } catch (Exception ignored) {}
        }
        LocalDateTime end = null;
        if (endDate != null && !endDate.trim().isEmpty()) {
            try {
                end = java.time.LocalDate.parse(endDate.trim()).atTime(23, 59, 59, 999999999);
            } catch (Exception ignored) {}
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<StockLogResponse> logs = stockLogService.getStockLogs(productId, type, createdByUsername, start, end, search, pageable);
        return ResponseEntity.ok(logs);
    }
}
