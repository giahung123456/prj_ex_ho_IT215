package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.entity.*;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.*;
import com.example.prj_exprho.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StockLogRepository stockLogRepository;

    @Autowired
    private UserRepository userRepository;

    private static final List<String> VALID_STATUSES = Arrays.asList(
            "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"
    );

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse checkout(CheckoutRequest request) {
        Customer customer = getCurrentCustomer();

        // Find customer's cart
        Cart cart = cartRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng."));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems == null || cartItems.isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
        }

        // Validate shipping info
        String address = request.getShippingAddress() != null ? request.getShippingAddress().trim() : "";
        String phone = request.getShippingPhone() != null ? request.getShippingPhone().trim() : "";
        if (address.isEmpty() || phone.isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Số điện thoại và địa chỉ nhận hàng là bắt buộc.");
        }

        // Generate Order Code
        String orderCode = generateOrderCode();

        BigDecimal totalAmount = BigDecimal.ZERO;

        // Create Order entity
        Order order = Order.builder()
                .customer(customer)
                .orderCode(orderCode)
                .totalAmount(BigDecimal.ZERO)
                .status("PENDING")
                .shippingAddress(address)
                .shippingPhone(phone)
                .items(new ArrayList<>())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Process each cart item with pessimistic write lock on Product
        for (CartItem item : cartItems) {
            Long productId = item.getProduct().getId();
            Product product = productRepository.findByIdWithLock(productId)
                    .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không tồn tại trong hệ thống."));

            // Check stock quantity
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new ApiException("ERR_VAL_08", "Đặt hàng thất bại. Một số sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng tồn kho.");
            }

            BigDecimal itemPrice = product.getPrice();
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            // Create OrderItem
            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .quantity(item.getQuantity())
                    .price(itemPrice)
                    .build();
            OrderItem savedItem = orderItemRepository.save(orderItem);
            savedOrder.getItems().add(savedItem);

            // Update product stock quantity
            int newStock = product.getStockQuantity() - item.getQuantity();
            product.setStockQuantity(newStock);
            if (newStock == 0 && "ACTIVE".equalsIgnoreCase(product.getStatus())) {
                product.setStatus("OUT_OF_STOCK");
            }
            productRepository.save(product);

            // Log stock movement
            StockLog stockLog = StockLog.builder()
                    .product(product)
                    .changeQuantity(-item.getQuantity())
                    .type("EXPORT")
                    .reason("Xuất hàng theo đơn " + orderCode)
                    .stockAfterChange(newStock)
                    .build();
            stockLogRepository.save(stockLog);
        }

        // Update total amount on order
        savedOrder.setTotalAmount(totalAmount);
        Order finalOrder = orderRepository.save(savedOrder);

        // Clear customer cart after successful checkout
        cartItemRepository.deleteByCartId(cart.getId());

        return mapToResponse(finalOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getMyOrders(Pageable pageable) {
        Customer customer = getCurrentCustomer();
        Page<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId(), pageable);
        return orders.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        Page<Order> orders = orderRepository.findAll(pageable);
        return orders.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Đơn hàng không tồn tại."));
        return mapToResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, UpdateOrderStatusRequest request) {
        String newStatus = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "";
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new ApiException("ERR_VAL_05", "Trạng thái đơn hàng không hợp lệ. Danh sách trạng thái cho phép: PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED.");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Đơn hàng không tồn tại."));

        order.setStatus(newStatus);

        // Associate current logged in staff user as the sales person for this order
        try {
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                userRepository.findByUsername(auth.getName()).ifPresent(user -> {
                    boolean isStaff = user.getRoles().stream()
                            .anyMatch(r -> "SALES".equalsIgnoreCase(r.getRoleName()) || "ADMIN".equalsIgnoreCase(r.getRoleName()));
                    if (isStaff) {
                        order.setSales(user);
                    }
                });
            }
        } catch (Exception e) {
            // Ignore
        }

        Order updatedOrder = orderRepository.save(order);
        return mapToResponse(updatedOrder);
    }

    private Customer getCurrentCustomer() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ApiException("ERR_SYS_01", "Yêu cầu không được xác thực.");
        }
        return customerRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ApiException("ERR_AUTH_02", "Tài khoản khách hàng không tồn tại."));
    }

    private String generateOrderCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int randomNum = (int) (Math.random() * 900) + 100;
        String code = "DH" + timestamp + randomNum;
        while (orderRepository.findMaxOrderCode() != null && code.equalsIgnoreCase(orderRepository.findMaxOrderCode())) {
            randomNum = (int) (Math.random() * 900) + 100;
            code = "DH" + timestamp + randomNum;
        }
        return code;
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItem> items = order.getItems() != null ? order.getItems() : orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = items.stream().map(item -> {
            Product product = item.getProduct();
            BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
            BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            return OrderItemResponse.builder()
                    .id(item.getId())
                    .productId(product != null ? product.getId() : null)
                    .productSku(product != null ? product.getSku() : null)
                    .productName(product != null ? product.getName() : null)
                    .quantity(item.getQuantity())
                    .price(price)
                    .itemTotal(itemTotal)
                    .build();
        }).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .shippingPhone(order.getShippingPhone())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .salesUsername(order.getSales() != null ? order.getSales().getUsername() : null)
                .items(itemResponses)
                .build();
    }
}
