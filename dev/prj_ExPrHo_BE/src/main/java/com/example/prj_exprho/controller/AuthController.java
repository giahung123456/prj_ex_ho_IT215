package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.ForgotPasswordRequest;
import com.example.prj_exprho.dto.LoginRequest;
import com.example.prj_exprho.dto.LoginResponse;
import com.example.prj_exprho.dto.ResetPasswordRequest;
import com.example.prj_exprho.dto.RegisterRequest;
import com.example.prj_exprho.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        LoginResponse response = authService.login(request, servletRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader(value = "Authorization", required = false) String token, HttpServletRequest servletRequest) {
        authService.logout(token, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_02");
        response.put("message", "Đăng xuất thành công.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest servletRequest) {
        authService.forgotPassword(request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_02");
        response.put("message", "Mã OTP đã được gửi về email của bạn.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest servletRequest) {
        authService.resetPassword(request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_02");
        response.put("message", "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
        authService.register(request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_15");
        response.put("message", "Đăng ký tài khoản thành công! Đang chuyển hướng...");
        return ResponseEntity.ok(response);
    }
}
