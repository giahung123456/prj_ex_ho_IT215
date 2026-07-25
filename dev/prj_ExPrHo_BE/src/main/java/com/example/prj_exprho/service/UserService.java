package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    ProfileResponse getProfile(String username);
    void updateProfile(String username, UpdateProfileRequest request, HttpServletRequest servletRequest);
    void changePassword(String username, ChangePasswordRequest request, HttpServletRequest servletRequest);
    
    // CRUD Employee (Admin only)
    Page<EmployeeResponse> getEmployees(String search, String role, String status, Pageable pageable);
    void createEmployee(EmployeeCreateRequest request, HttpServletRequest servletRequest);
    void updateEmployee(Long id, EmployeeUpdateRequest request, HttpServletRequest servletRequest);
    void updateEmployeeRole(Long id, String roleName, HttpServletRequest servletRequest);
    void toggleEmployeeStatus(Long id, HttpServletRequest servletRequest);
}
