package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.ChangePasswordRequest;
import com.example.prj_exprho.dto.ProfileResponse;
import com.example.prj_exprho.dto.UpdateProfileRequest;
import com.example.prj_exprho.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Principal principal) {
        ProfileResponse response = userService.getProfile(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> updateProfile(Principal principal, @Valid @RequestBody UpdateProfileRequest request, HttpServletRequest servletRequest) {
        userService.updateProfile(principal.getName(), request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_03");
        response.put("message", "Cập nhật thông tin hồ sơ cá nhân thành công.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(Principal principal, @Valid @RequestBody ChangePasswordRequest request, HttpServletRequest servletRequest) {
        userService.changePassword(principal.getName(), request, servletRequest);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_03");
        response.put("message", "Cập nhật mật khẩu thành công.");
        return ResponseEntity.ok(response);
    }
}
