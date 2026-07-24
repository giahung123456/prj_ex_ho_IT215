package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerCode(String customerCode);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByUsername(String username);

    @Query("SELECT MAX(c.customerCode) FROM Customer c WHERE c.customerCode LIKE 'KH%'")
    String findMaxCustomerCode();

    @Query("SELECT c FROM Customer c WHERE " +
           "(:search IS NULL OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " c.phone LIKE CONCAT('%', :search, '%') OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR c.status = :status)")
    org.springframework.data.domain.Page<Customer> searchCustomers(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("status") String status,
            org.springframework.data.domain.Pageable pageable);
}

