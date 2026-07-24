package com.example.prj_exprho.repository;

import com.example.prj_exprho.entity.Category;
import com.example.prj_exprho.dto.CategoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    @Query("SELECT new com.example.prj_exprho.dto.CategoryResponse(c.id, c.name, c.description, c.status, c.createdAt, c.updatedAt, " +
           "(SELECT COUNT(p) FROM Product p WHERE p.category = c)) " +
           "FROM Category c WHERE " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR c.status = :status)")
    Page<CategoryResponse> searchCategories(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);
}
