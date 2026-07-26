package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.AdminDashboardResponse;
import com.example.prj_exprho.dto.StorekeeperDashboardResponse;
import com.example.prj_exprho.dto.SalesDashboardResponse;

public interface DashboardService {
    AdminDashboardResponse getAdminStats(String period);
    StorekeeperDashboardResponse getStorekeeperStats();
    SalesDashboardResponse getSalesStats(String period, String salesUsername);
}
