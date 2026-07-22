package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.CartItemRequest;
import com.example.prj_exprho.dto.CartItemUpdateRequest;
import com.example.prj_exprho.dto.CartResponse;
import com.example.prj_exprho.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart() {
        CartResponse response = cartService.getCartForCurrentCustomer();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items")
    public ResponseEntity<Map<String, Object>> addItem(@Valid @RequestBody CartItemRequest request) {
        CartResponse cart = cartService.addItemToCart(request);
        Map<String, Object> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_13");
        response.put("message", "Đã cập nhật giỏ hàng thành công!");
        response.put("cart", cart);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<Map<String, Object>> updateItem(
            @PathVariable("itemId") Long itemId,
            @Valid @RequestBody CartItemUpdateRequest request) {
        CartResponse cart = cartService.updateItemQuantity(itemId, request);
        Map<String, Object> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_13");
        response.put("message", "Đã cập nhật giỏ hàng thành công!");
        response.put("cart", cart);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Map<String, Object>> removeItem(@PathVariable("itemId") Long itemId) {
        CartResponse cart = cartService.removeItemFromCart(itemId);
        Map<String, Object> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_13");
        response.put("message", "Đã cập nhật giỏ hàng thành công!");
        response.put("cart", cart);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, String>> clearCart() {
        cartService.clearCart();
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_13");
        response.put("message", "Đã xóa toàn bộ sản phẩm trong giỏ hàng!");
        return ResponseEntity.ok(response);
    }
}
