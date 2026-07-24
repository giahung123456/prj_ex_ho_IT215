package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.service.MailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MailServiceImpl implements MailService {
    @Override
    public void sendOtp(String to, String otp) {
        log.info("==================================================");
        log.info("MAIL SERVICE: Sending OTP [{}] to email [{}]", otp, to);
        log.info("==================================================");
        // Print to standard output so it's visible in console tests
        System.out.println("MAIL SERVICE: Sending OTP [" + otp + "] to email [" + to + "]");
    }

    @Override
    public void sendTemporaryPassword(String to, String username, String tempPassword) {
        log.info("==================================================");
        log.info("MAIL SERVICE: Sending temporary password to [{}] for username [{}]", to, username);
        log.info("Temporary Password: [{}]", tempPassword);
        log.info("==================================================");
        // Print to standard output so it's visible in console tests
        System.out.println("MAIL SERVICE: Temporary Password [" + tempPassword + "] sent to [" + to + "] for user [" + username + "]");
    }
}
