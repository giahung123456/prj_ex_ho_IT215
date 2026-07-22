package com.example.prj_exprho.service;

public interface MailService {
    void sendOtp(String to, String otp);
    void sendTemporaryPassword(String to, String username, String tempPassword);
}
