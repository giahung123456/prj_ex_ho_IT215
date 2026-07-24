package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.CheckoutRequest;
import com.example.prj_exprho.dto.OrderResponse;
import com.example.prj_exprho.dto.UpdateOrderStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse checkout(CheckoutRequest request);
    Page<OrderResponse> getMyOrders(Pageable pageable);
    Page<OrderResponse> getAllOrders(Pageable pageable);
    OrderResponse getOrderById(Long id);
    OrderResponse updateOrderStatus(Long id, UpdateOrderStatusRequest request);
}
