package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.ForgotPasswordRequest;
import com.example.prj_exprho.dto.LoginRequest;
import com.example.prj_exprho.dto.LoginResponse;
import com.example.prj_exprho.dto.ResetPasswordRequest;
import com.example.prj_exprho.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    LoginResponse login(LoginRequest request, HttpServletRequest servletRequest);
    void logout(String token, HttpServletRequest servletRequest);
    void forgotPassword(ForgotPasswordRequest request, HttpServletRequest servletRequest);
    void resetPassword(ResetPasswordRequest request, HttpServletRequest servletRequest);
    void register(RegisterRequest request, HttpServletRequest servletRequest);
}
