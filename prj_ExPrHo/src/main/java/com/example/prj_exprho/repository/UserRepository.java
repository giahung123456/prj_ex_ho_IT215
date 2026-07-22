package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUsernameOrEmail(String username, String email);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN u.roles r WHERE " +
           "(:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " u.phone LIKE CONCAT('%', :search, '%')) AND " +
           "(:role IS NULL OR LOWER(r.roleName) = LOWER(:role)) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "u.status != 'DELETED'")
    Page<User> searchEmployees(@Param("search") String search,
                               @Param("role") String role,
                               @Param("status") String status,
                               Pageable pageable);
}
