package com.example.prj_exprho;

import com.example.prj_exprho.dto.LoginRequest;
import com.example.prj_exprho.dto.LoginResponse;
import com.example.prj_exprho.dto.EmployeeCreateRequest;
import com.example.prj_exprho.entity.User;
import com.example.prj_exprho.repository.UserRepository;
import com.example.prj_exprho.service.AuthService;
import com.example.prj_exprho.service.UserService;
import com.example.prj_exprho.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AuthAndEmployeeIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    private MockHttpServletRequest servletRequest;

    @BeforeEach
    public void setup() {
        servletRequest = new MockHttpServletRequest();
        servletRequest.setRemoteAddr("127.0.0.1");

        // Reset admin failed attempts
        userRepository.findByUsername("admin").ifPresent(user -> {
            user.setFailedAttempts(0);
            user.setStatus("ACTIVE");
            userRepository.save(user);
        });
    }

    @Test
    public void testSuccessfulLogin() {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin")
                .password("AdminPassword123")
                .build();

        LoginResponse response = authService.login(loginRequest, servletRequest);
        assertNotNull(response);
        assertEquals("MSG_SUCCESS_01", response.getCode());
        assertNotNull(response.getToken());
        assertEquals("ADMIN", response.getRole());
    }

    @Test
    public void testFailedLoginIncrementsAttemptsAndLocks() {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin")
                .password("WrongPassword")
                .build();

        // 1st failed attempt
        ApiException ex1 = assertThrows(ApiException.class, () -> {
            authService.login(loginRequest, servletRequest);
        });
        assertEquals("ERR_AUTH_01", ex1.getCode());

        // Fail 3 more times (total 4)
        for (int i = 0; i < 3; i++) {
            assertThrows(ApiException.class, () -> {
                authService.login(loginRequest, servletRequest);
            });
        }

        // 5th failed attempt should lock and return ERR_AUTH_03
        ApiException ex5 = assertThrows(ApiException.class, () -> {
            authService.login(loginRequest, servletRequest);
        });
        assertEquals("ERR_AUTH_03", ex5.getCode());

        // Subsequent attempt should throw ERR_AUTH_02
        ApiException exLocked = assertThrows(ApiException.class, () -> {
            authService.login(loginRequest, servletRequest);
        });
        assertEquals("ERR_AUTH_02", exLocked.getCode());

        // Verify status in DB is LOCKED
        User user = userRepository.findByUsername("admin").orElseThrow();
        assertEquals("LOCKED", user.getStatus());
    }

    @Test
    public void testForgotPasswordWithInvalidEmail() {
        com.example.prj_exprho.dto.ForgotPasswordRequest request = com.example.prj_exprho.dto.ForgotPasswordRequest.builder()
                .email("nonexistent@example.com")
                .build();

        ApiException ex = assertThrows(ApiException.class, () -> {
            authService.forgotPassword(request, servletRequest);
        });
        assertEquals("ERR_AUTH_04", ex.getCode());
    }

    @Test
    public void testEmployeeCreationFailsOnDuplicateUsername() {
        // First employee is admin
        EmployeeCreateRequest request = EmployeeCreateRequest.builder()
                .username("admin")
                .email("newadmin@example.com")
                .fullName("New Admin")
                .phone("0123")
                .role("SALES")
                .build();

        ApiException ex = assertThrows(ApiException.class, () -> {
            userService.createEmployee(request, servletRequest);
        });
        assertEquals("ERR_VAL_02", ex.getCode());
    }
}
