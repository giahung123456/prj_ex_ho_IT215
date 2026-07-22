package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.CartItemRequest;
import com.example.prj_exprho.dto.CartItemUpdateRequest;
import com.example.prj_exprho.dto.CartResponse;

public interface CartService {
    CartResponse getCartForCurrentCustomer();
    CartResponse addItemToCart(CartItemRequest request);
    CartResponse updateItemQuantity(Long itemId, CartItemUpdateRequest request);
    CartResponse removeItemFromCart(Long itemId);
    void clearCart();
}
