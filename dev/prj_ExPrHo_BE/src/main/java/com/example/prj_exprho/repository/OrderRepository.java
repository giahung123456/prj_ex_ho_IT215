package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    List<Order> findByCustomerUsernameOrderByCreatedAtDesc(String username);
    Page<Order> findByCustomerUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    @Query("SELECT MAX(o.orderCode) FROM Order o WHERE o.orderCode LIKE 'DH%'")
    String findMaxOrderCode();
}
