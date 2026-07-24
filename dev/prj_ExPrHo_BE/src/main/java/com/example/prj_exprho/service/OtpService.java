package com.example.prj_exprho.service;

public interface OtpService {
    void generateAndSendOtp(String email);
    boolean validateOtp(String email, String otp);
}
