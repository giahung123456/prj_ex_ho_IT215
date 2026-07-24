package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.ActionLogResponse;
import com.example.prj_exprho.entity.ActionLog;
import com.example.prj_exprho.entity.User;
import com.example.prj_exprho.repository.ActionLogRepository;
import com.example.prj_exprho.repository.UserRepository;
import com.example.prj_exprho.service.ActionLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionLogServiceImpl implements ActionLogService {

    @Autowired
    private ActionLogRepository actionLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public void logAction(String username, String action, HttpServletRequest request) {
        User user = null;
        if (username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        String ipAddress = null;
        if (request != null) {
            ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }
        }

        ActionLog log = ActionLog.builder()
                .user(user)
                .action(action)
                .ipAddress(ipAddress)
                .build();

        actionLogRepository.save(log);
    }

    @Override
    public Page<ActionLogResponse> getActionLogs(Pageable pageable) {
        return actionLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(log -> ActionLogResponse.builder()
                        .id(String.valueOf(log.getId()))
                        .username(log.getUser() != null ? log.getUser().getUsername() : "SYSTEM")
                        .action(log.getAction())
                        .ipAddress(log.getIpAddress())
                        .createdAt(log.getCreatedAt())
                        .build());
    }
}
