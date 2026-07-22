package com.elearning.controllers;

import com.elearning.advice.ApiResponse;
import com.elearning.exceptions.BusinessException;
import com.elearning.models.dto.CartPriceResponse;
import com.elearning.models.entities.User;
import com.elearning.models.repositories.UserRepository;
import com.elearning.models.services.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException(401, "Yêu cầu đăng nhập");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new BusinessException(404, "Không tìm thấy thông tin người dùng"));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Void>> addCourseToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long courseId) {
        User user = getAuthenticatedUser(userDetails);
        cartService.addCourseToCart(user, courseId);
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm khóa học vào giỏ hàng thành công"));
    }

    @PostMapping("/apply-voucher")
    public ResponseEntity<ApiResponse<Void>> applyDiscountCode(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String code) {
        User user = getAuthenticatedUser(userDetails);
        cartService.applyDiscountCode(user, code);
        return ResponseEntity.ok(ApiResponse.success(null, "Áp dụng mã giảm giá thành công"));
    }

    @GetMapping("/price")
    public ResponseEntity<ApiResponse<CartPriceResponse>> calculateCartPrice(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        CartPriceResponse priceResponse = cartService.calculateCartPrice(user);
        return ResponseEntity.ok(ApiResponse.success(priceResponse, "Tính toán giá trị giỏ hàng thành công"));
    }

    @PostMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        cartService.clearCart(user);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa giỏ hàng thành công"));
    }
}
