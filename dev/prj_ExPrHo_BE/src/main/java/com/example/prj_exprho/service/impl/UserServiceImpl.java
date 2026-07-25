package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.entity.Role;
import com.example.prj_exprho.entity.User;
import com.example.prj_exprho.entity.Customer;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.RoleRepository;
import com.example.prj_exprho.repository.UserRepository;
import com.example.prj_exprho.repository.CustomerRepository;
import com.example.prj_exprho.service.ActionLogService;
import com.example.prj_exprho.service.MailService;
import com.example.prj_exprho.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MailService mailService;

    @Autowired
    private ActionLogService actionLogService;

    private static final String CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private final SecureRandom random = new SecureRandom();

    @Override
    public ProfileResponse getProfile(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ProfileResponse.builder()
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .phone(user.getPhone())
                    .status(user.getStatus())
                    .roles(user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList()))
                    .build();
        }

        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Tài khoản không tồn tại."));

        return ProfileResponse.builder()
                .username(customer.getUsername())
                .email(customer.getEmail())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .status(customer.getStatus())
                .roles(Collections.singletonList("CUSTOMER"))
                .build();
    }

    @Override
    @Transactional
    public void updateProfile(String username, UpdateProfileRequest request, HttpServletRequest servletRequest) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setFullName(request.getFullName());
            user.setPhone(request.getPhone());
            userRepository.save(user);
            actionLogService.logAction(username, "Cập nhật thông tin hồ sơ cá nhân", servletRequest);
            return;
        }

        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Tài khoản không tồn tại."));

        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customerRepository.save(customer);

        actionLogService.logAction(username, "Cập nhật thông tin hồ sơ cá nhân", servletRequest);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request, HttpServletRequest servletRequest) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ApiException("ERR_VAL_05", "Mật khẩu mới và mật khẩu xác nhận không khớp.");
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new ApiException("ERR_VAL_05", "Mật khẩu cũ không chính xác.");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
            actionLogService.logAction(username, "Đổi mật khẩu tài khoản cá nhân", servletRequest);
            return;
        }

        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Tài khoản không tồn tại."));

        if (!passwordEncoder.matches(request.getOldPassword(), customer.getPasswordHash())) {
            throw new ApiException("ERR_VAL_05", "Mật khẩu cũ không chính xác.");
        }

        customer.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        customerRepository.save(customer);

        actionLogService.logAction(username, "Đổi mật khẩu tài khoản cá nhân", servletRequest);
    }

    @Override
    public Page<EmployeeResponse> getEmployees(String search, String role, String status, Pageable pageable) {
        // Clean up empty parameters
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String roleParam = (role == null || role.trim().isEmpty()) ? null : role.trim();
        String statusParam = (status == null || status.trim().isEmpty()) ? null : status.trim();

        return userRepository.searchEmployees(searchParam, roleParam, statusParam, pageable)
                .map(user -> EmployeeResponse.builder()
                        .id(String.valueOf(user.getId()))
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .status(user.getStatus())
                        .roles(user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList()))
                        .build());
    }

    @Override
    @Transactional
    public void createEmployee(EmployeeCreateRequest request, HttpServletRequest servletRequest) {
        // Validate uniqueness of Username
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ApiException("ERR_VAL_02", "Tên đăng nhập đã tồn tại trong hệ thống.");
        }

        // Validate uniqueness of Email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException("ERR_VAL_02", "Email đã tồn tại trong hệ thống.");
        }

        // Get Role
        Role role = roleRepository.findByRoleName(request.getRole().toUpperCase())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Vai trò không hợp lệ."));

        // Generate temporary password (8 characters)
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(CHAR_SET.charAt(random.nextInt(CHAR_SET.length())));
        }
        String tempPassword = sb.toString();

        // Create User
        User newEmployee = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(tempPassword))
                .status("ACTIVE")
                .failedAttempts(0)
                .roles(new HashSet<>(Collections.singletonList(role)))
                .build();

        userRepository.save(newEmployee);

        // Send Email
        mailService.sendTemporaryPassword(newEmployee.getEmail(), newEmployee.getUsername(), tempPassword);

        // Log Action
        String adminUsername = servletRequest.getUserPrincipal() != null ? servletRequest.getUserPrincipal().getName() : "SYSTEM";
        actionLogService.logAction(adminUsername, "Tạo mới tài khoản nhân viên: " + newEmployee.getUsername(), servletRequest);
    }

    @Override
    @Transactional
    public void updateEmployee(Long id, EmployeeUpdateRequest request, HttpServletRequest servletRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Nhân viên không tồn tại."));

        if ("DELETED".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("ERR_AUTH_04", "Nhân viên không tồn tại.");
        }

        // Validate uniqueness of Email
        Optional<User> emailUserOpt = userRepository.findByEmail(request.getEmail());
        if (emailUserOpt.isPresent() && !emailUserOpt.get().getId().equals(id)) {
            throw new ApiException("ERR_VAL_02", "Email đã tồn tại trong hệ thống.");
        }

        Role role = roleRepository.findByRoleName(request.getRole().toUpperCase())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Vai trò không hợp lệ."));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRoles(new HashSet<>(Collections.singletonList(role)));
        userRepository.save(user);

        String adminUsername = servletRequest.getUserPrincipal() != null ? servletRequest.getUserPrincipal().getName() : "SYSTEM";
        actionLogService.logAction(adminUsername, "Cập nhật thông tin nhân viên: " + user.getUsername(), servletRequest);
    }

    @Override
    @Transactional
    public void updateEmployeeRole(Long id, String roleName, HttpServletRequest servletRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Nhân viên không tồn tại."));

        if ("DELETED".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("ERR_AUTH_04", "Nhân viên không tồn tại.");
        }

        Role role = roleRepository.findByRoleName(roleName.toUpperCase())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Vai trò không hợp lệ."));

        user.setRoles(new HashSet<>(Collections.singletonList(role)));
        userRepository.save(user);

        String adminUsername = servletRequest.getUserPrincipal() != null ? servletRequest.getUserPrincipal().getName() : "SYSTEM";
        actionLogService.logAction(adminUsername, "Cập nhật vai trò nhân viên [" + user.getUsername() + "] sang [" + roleName + "]", servletRequest);
    }

    @Override
    @Transactional
    public void toggleEmployeeStatus(Long id, HttpServletRequest servletRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Nhân viên không tồn tại."));

        if ("DELETED".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("ERR_AUTH_04", "Nhân viên không tồn tại.");
        }

        // Avoid self-locking
        String adminUsername = servletRequest.getUserPrincipal() != null ? servletRequest.getUserPrincipal().getName() : "SYSTEM";
        if (user.getUsername().equals(adminUsername)) {
            throw new ApiException("ERR_VAL_05", "Không thể tự khóa tài khoản của chính mình.");
        }

        String newStatus = "ACTIVE".equalsIgnoreCase(user.getStatus()) ? "LOCKED" : "ACTIVE";
        user.setStatus(newStatus);
        userRepository.save(user);

        actionLogService.logAction(adminUsername, "Cập nhật trạng thái nhân viên [" + user.getUsername() + "] sang " + newStatus, servletRequest);
    }
}
