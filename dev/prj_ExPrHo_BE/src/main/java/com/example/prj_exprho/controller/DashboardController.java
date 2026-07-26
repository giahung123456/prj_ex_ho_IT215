package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.AdminDashboardResponse;
import com.example.prj_exprho.dto.StorekeeperDashboardResponse;
import com.example.prj_exprho.dto.SalesDashboardResponse;
import com.example.prj_exprho.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard(
            @RequestParam(value = "period", defaultValue = "30days") String period) {
        AdminDashboardResponse stats = dashboardService.getAdminStats(period);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/storekeeper")
    @PreAuthorize("hasRole('STOREKEEPER')")
    public ResponseEntity<StorekeeperDashboardResponse> getStorekeeperDashboard() {
        StorekeeperDashboardResponse stats = dashboardService.getStorekeeperStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN')")
    public ResponseEntity<SalesDashboardResponse> getSalesDashboard(
            @RequestParam(value = "period", defaultValue = "30days") String period,
            @RequestParam(value = "username", required = false) String username) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();
        
        // Security check: if the logged in user is SALES, they can ONLY view their own stats
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        String targetUsername = currentUsername;
        if (isAdmin && username != null && !username.trim().isEmpty()) {
            targetUsername = username.trim();
        }

        SalesDashboardResponse stats = dashboardService.getSalesStats(period, targetUsername);
        return ResponseEntity.ok(stats);
    }
}
