package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.CartItemRequest;
import com.example.prj_exprho.dto.CartItemResponse;
import com.example.prj_exprho.dto.CartItemUpdateRequest;
import com.example.prj_exprho.dto.CartResponse;
import com.example.prj_exprho.entity.Cart;
import com.example.prj_exprho.entity.CartItem;
import com.example.prj_exprho.entity.Customer;
import com.example.prj_exprho.entity.Product;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.CartItemRepository;
import com.example.prj_exprho.repository.CartRepository;
import com.example.prj_exprho.repository.CustomerRepository;
import com.example.prj_exprho.repository.ProductRepository;
import com.example.prj_exprho.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    @Transactional
    public CartResponse getCartForCurrentCustomer() {
        Cart cart = getOrCreateCartForCurrentCustomer();
        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItemToCart(CartItemRequest request) {
        Cart cart = getOrCreateCartForCurrentCustomer();

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không tồn tại."));

        if ("INACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new ApiException("ERR_VAL_05", "Sản phẩm đã ngừng kinh doanh.");
        }

        int qtyToAdd = request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1;

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + qtyToAdd);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(qtyToAdd)
                    .build();
            cartItemRepository.save(newItem);
        }

        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return mapToResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(Long itemId, CartItemUpdateRequest request) {
        Cart cart = getOrCreateCartForCurrentCustomer();

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không có trong giỏ hàng."));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ApiException("ERR_AUTH_02", "Tài khoản không có quyền thao tác trên giỏ hàng này.");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(request.getQuantity());
            cartItemRepository.save(item);
        }

        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return mapToResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse removeItemFromCart(Long itemId) {
        Cart cart = getOrCreateCartForCurrentCustomer();

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không có trong giỏ hàng."));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ApiException("ERR_AUTH_02", "Tài khoản không có quyền thao tác trên giỏ hàng này.");
        }

        cartItemRepository.delete(item);

        Cart updatedCart = cartRepository.findById(cart.getId()).orElse(cart);
        return mapToResponse(updatedCart);
    }

    @Override
    @Transactional
    public void clearCart() {
        Cart cart = getOrCreateCartForCurrentCustomer();
        cartItemRepository.deleteByCartId(cart.getId());
    }

    private Cart getOrCreateCartForCurrentCustomer() {
        Customer customer = getCurrentCustomer();
        return cartRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .customer(customer)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private Customer getCurrentCustomer() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ApiException("ERR_SYS_01", "Yêu cầu không được xác thực.");
        }
        return customerRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ApiException("ERR_AUTH_02", "Tài khoản khách hàng không tồn tại."));
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<CartItemResponse> itemResponses = new ArrayList<>();

        for (CartItem item : items) {
            Product product = item.getProduct();
            BigDecimal price = product != null && product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            itemResponses.add(CartItemResponse.builder()
                    .id(item.getId())
                    .productId(product != null ? product.getId() : null)
                    .productSku(product != null ? product.getSku() : null)
                    .productName(product != null ? product.getName() : null)
                    .productPrice(price)
                    .quantity(item.getQuantity())
                    .itemTotal(itemTotal)
                    .build());
        }

        return CartResponse.builder()
                .id(cart.getId())
                .customerId(cart.getCustomer() != null ? cart.getCustomer().getId() : null)
                .items(itemResponses)
                .totalAmount(totalAmount)
                .build();
    }
}
