package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByCustomerId(Long customerId);
    Optional<Cart> findByCustomerUsername(String username);
}
