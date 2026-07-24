package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.service.MailService;
import com.example.prj_exprho.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpServiceImpl implements OtpService {

    @Autowired
    private MailService mailService;

    private static class OtpData {
        String otp;
        LocalDateTime expiryTime;

        OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }

    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();
    private final Map<String, List<LocalDateTime>> rateLimitCache = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Override
    public void generateAndSendOtp(String email) {
        LocalDateTime now = LocalDateTime.now();
        List<LocalDateTime> requestTimes = rateLimitCache.computeIfAbsent(email, k -> new ArrayList<>());
        
        // Remove requests older than 15 minutes
        requestTimes.removeIf(time -> time.isBefore(now.minusMinutes(15)));

        if (requestTimes.size() >= 3) {
            throw new ApiException("ERR_AUTH_05", "Yêu cầu OTP quá giới hạn (tối đa 3 lần trong 15 phút). Vui lòng thử lại sau.");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", random.nextInt(1000000));
        
        // Save in-memory with 10 minutes expiry
        otpCache.put(email, new OtpData(otp, now.plusMinutes(10)));
        requestTimes.add(now);

        // Send OTP
        mailService.sendOtp(email, otp);
    }

    @Override
    public boolean validateOtp(String email, String otp) {
        OtpData otpData = otpCache.get(email);
        if (otpData == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(otpData.expiryTime)) {
            otpCache.remove(email); // Expired
            return false;
        }

        boolean isValid = otpData.otp.equals(otp);
        if (isValid) {
            otpCache.remove(email); // Single-use constraint
        }
        return isValid;
    }
}
