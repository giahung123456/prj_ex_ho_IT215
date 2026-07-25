package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.service.ActionLogService;
import com.example.prj_exprho.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class EmployeeController {

    @Autowired
    private UserService userService;

    @Autowired
    private ActionLogService actionLogService;

    @GetMapping("/employees")
    public ResponseEntity<Page<EmployeeResponse>> getEmployees(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<EmployeeResponse> employees = userService.getEmployees(search, role, status, pageable);
        return ResponseEntity.ok(employees);
    }

    @PostMapping("/employees")
    public ResponseEntity<Map<String, String>> createEmployee(
            @Valid @RequestBody EmployeeCreateRequest request,
            HttpServletRequest servletRequest) {
        userService.createEmployee(request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_04");
        response.put("message", "Tạo mới tài khoản nhân viên thành công!");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<Map<String, String>> updateEmployee(
            @PathVariable("id") Long id,
            @Valid @RequestBody EmployeeUpdateRequest request,
            HttpServletRequest servletRequest) {
        userService.updateEmployee(id, request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_04");
        response.put("message", "Cập nhật thông tin nhân viên thành công.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/employees/{id}/role")
    public ResponseEntity<Map<String, String>> updateEmployeeRole(
            @PathVariable("id") Long id,
            @Valid @RequestBody EmployeeRoleRequest request,
            HttpServletRequest servletRequest) {
        userService.updateEmployeeRole(id, request.getRole(), servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_04");
        response.put("message", "Cập nhật vai trò nhân viên thành công.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/employees/{id}/toggle-status")
    public ResponseEntity<Map<String, String>> toggleEmployeeStatus(
            @PathVariable("id") Long id,
            HttpServletRequest servletRequest) {
        userService.toggleEmployeeStatus(id, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_05");
        response.put("message", "Cập nhật trạng thái tài khoản nhân viên thành công.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/action-logs")
    public ResponseEntity<Page<ActionLogResponse>> getActionLogs(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActionLogResponse> logs = actionLogService.getActionLogs(pageable);
        return ResponseEntity.ok(logs);
    }
}
