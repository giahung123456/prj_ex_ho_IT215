package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.ActionLogResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ActionLogService {
    void logAction(String username, String action, HttpServletRequest request);
    Page<ActionLogResponse> getActionLogs(Pageable pageable);
}
