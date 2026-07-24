package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.config.JwtTokenProvider;
import com.example.prj_exprho.dto.ForgotPasswordRequest;
import com.example.prj_exprho.dto.LoginRequest;
import com.example.prj_exprho.dto.LoginResponse;
import com.example.prj_exprho.dto.ResetPasswordRequest;
import com.example.prj_exprho.dto.RegisterRequest;
import com.example.prj_exprho.entity.Role;
import com.example.prj_exprho.entity.User;
import com.example.prj_exprho.entity.Customer;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.UserRepository;
import com.example.prj_exprho.repository.CustomerRepository;
import com.example.prj_exprho.repository.RoleRepository;
import com.example.prj_exprho.service.ActionLogService;
import com.example.prj_exprho.service.AuthService;
import com.example.prj_exprho.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private OtpService otpService;

    @Autowired
    private ActionLogService actionLogService;

    @Override
    @Transactional(noRollbackFor = ApiException.class)
    public LoginResponse login(LoginRequest request, HttpServletRequest servletRequest) {
        // Find user by username (exclude DELETED)
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!"DELETED".equalsIgnoreCase(user.getStatus())) {
                // Check if account is locked
                if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
                    throw new ApiException("ERR_AUTH_02", "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
                }

                // Match password
                if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                    // Increment failed attempts
                    user.setFailedAttempts(user.getFailedAttempts() + 1);
                    if (user.getFailedAttempts() >= 5) {
                        user.setStatus("LOCKED");
                        userRepository.save(user);
                        actionLogService.logAction(user.getUsername(), "Tài khoản bị khóa do nhập sai mật khẩu 5 lần", servletRequest);
                        throw new ApiException("ERR_AUTH_03", "Tài khoản của bạn đã bị khóa tạm thời do nhập sai mật khẩu quá 5 lần.");
                    } else {
                        userRepository.save(user);
                        throw new ApiException("ERR_AUTH_01", "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.");
                    }
                }

                // Reset failed attempts if successful
                if (user.getFailedAttempts() > 0) {
                    user.setFailedAttempts(0);
                    userRepository.save(user);
                }

                // Get primary role
                String roleName = user.getRoles().stream()
                        .map(Role::getRoleName)
                        .findFirst()
                        .orElse("SALES"); // default to SALES if no role is mapped

                // Generate Token
                String token = tokenProvider.generateToken(user.getUsername(), roleName);

                // Log Action
                actionLogService.logAction(user.getUsername(), "Đăng nhập thành công", servletRequest);

                return LoginResponse.builder()
                        .code("MSG_SUCCESS_01")
                        .message("Đăng nhập thành công! Đang chuyển hướng...")
                        .token(token)
                        .role(roleName)
                        .build();
            }
        }

        // Try to login as Customer
        Optional<Customer> customerOpt = customerRepository.findByUsername(request.getUsername());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            if ("INACTIVE".equalsIgnoreCase(customer.getStatus())) {
                throw new ApiException("ERR_AUTH_02", "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
            }

            // Match password
            if (!passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
                throw new ApiException("ERR_AUTH_01", "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.");
            }

            // Generate Token
            String token = tokenProvider.generateToken(customer.getUsername(), "CUSTOMER");

            // Log Action
            actionLogService.logAction(customer.getUsername(), "Đăng nhập thành công", servletRequest);

            return LoginResponse.builder()
                    .code("MSG_SUCCESS_01")
                    .message("Đăng nhập thành công! Đang chuyển hướng...")
                    .token(token)
                    .role("CUSTOMER")
                    .build();
        }

        throw new ApiException("ERR_AUTH_01", "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.");
    }

    @Override
    @Transactional
    public void logout(String token, HttpServletRequest servletRequest) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        if (token != null && tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsernameFromToken(token);
            tokenProvider.blacklistToken(token);
            actionLogService.logAction(username, "Đăng xuất thành công", servletRequest);
        }
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, HttpServletRequest servletRequest) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!"DELETED".equalsIgnoreCase(user.getStatus())) {
                otpService.generateAndSendOtp(user.getEmail());
                actionLogService.logAction(user.getUsername(), "Yêu cầu khôi phục mật khẩu (Gửi OTP)", servletRequest);
                return;
            }
        }

        Optional<Customer> customerOpt = customerRepository.findByEmail(request.getEmail());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            if (!"INACTIVE".equalsIgnoreCase(customer.getStatus())) {
                otpService.generateAndSendOtp(customer.getEmail());
                actionLogService.logAction(customer.getUsername(), "Yêu cầu khôi phục mật khẩu (Gửi OTP)", servletRequest);
                return;
            }
        }

        throw new ApiException("ERR_AUTH_04", "Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request, HttpServletRequest servletRequest) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ApiException("ERR_VAL_05", "Mật khẩu mới và mật khẩu xác nhận không khớp.");
        }

        // Validate OTP
        boolean isValidOtp = otpService.validateOtp(request.getEmail(), request.getOtp());
        if (!isValidOtp) {
            throw new ApiException("ERR_AUTH_05", "Mã OTP không chính xác hoặc đã hết hiệu lực. Vui lòng thử lại.");
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!"DELETED".equalsIgnoreCase(user.getStatus())) {
                user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                user.setFailedAttempts(0);
                if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
                    user.setStatus("ACTIVE");
                }
                userRepository.save(user);
                actionLogService.logAction(user.getUsername(), "Khôi phục mật khẩu thành công bằng OTP", servletRequest);
                return;
            }
        }

        Optional<Customer> customerOpt = customerRepository.findByEmail(request.getEmail());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            if (!"INACTIVE".equalsIgnoreCase(customer.getStatus())) {
                customer.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                customerRepository.save(customer);
                actionLogService.logAction(customer.getUsername(), "Khôi phục mật khẩu thành công bằng OTP", servletRequest);
                return;
            }
        }

        throw new ApiException("ERR_AUTH_04", "Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.");
    }

    @Override
    @Transactional
    public void register(RegisterRequest request, HttpServletRequest servletRequest) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ApiException("ERR_VAL_09", "Mật khẩu nhập lại không trùng khớp. Vui lòng kiểm tra lại.");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent() ||
            customerRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ApiException("ERR_VAL_10", "Tên đăng nhập, Email hoặc Số điện thoại đã được đăng ký trên hệ thống.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent() ||
            customerRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException("ERR_VAL_10", "Tên đăng nhập, Email hoặc Số điện thoại đã được đăng ký trên hệ thống.");
        }

        if (userRepository.findByPhone(request.getPhone()).isPresent() ||
            customerRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new ApiException("ERR_VAL_10", "Tên đăng nhập, Email hoặc Số điện thoại đã được đăng ký trên hệ thống.");
        }

        String maxCode = customerRepository.findMaxCustomerCode();
        String nextCode = generateNextCustomerCode(maxCode);

        Customer newCustomer = Customer.builder()
                .username(request.getUsername())
                .customerCode(nextCode)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .build();
        customerRepository.save(newCustomer);

        actionLogService.logAction(newCustomer.getUsername(), "Đăng ký tài khoản khách hàng mới thành công", servletRequest);
    }

    private String generateNextCustomerCode(String maxCode) {
        if (maxCode == null || !maxCode.startsWith("KH")) {
            return "KH0001";
        }
        try {
            int number = Integer.parseInt(maxCode.substring(2));
            return String.format("KH%04d", number + 1);
        } catch (NumberFormatException e) {
            return "KH0001";
        }
    }
}
