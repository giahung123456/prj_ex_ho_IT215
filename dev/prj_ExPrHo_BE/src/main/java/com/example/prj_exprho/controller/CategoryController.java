package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.CategoryCreateRequest;
import com.example.prj_exprho.dto.CategoryResponse;
import com.example.prj_exprho.dto.CategoryUpdateRequest;
import com.example.prj_exprho.entity.Category;
import com.example.prj_exprho.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER', 'SALES', 'CUSTOMER')")
    public ResponseEntity<Page<CategoryResponse>> getCategories(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CategoryResponse> categories = categoryService.getCategories(search, status, pageable);
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> createCategory(
            @Valid @RequestBody CategoryCreateRequest request) {
        categoryService.createCategory(request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_06");
        response.put("message", "Tạo mới/Cập nhật danh mục sản phẩm thành công!");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateCategory(
            @PathVariable("id") Long id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        categoryService.updateCategory(id, request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_06");
        response.put("message", "Tạo mới/Cập nhật danh mục sản phẩm thành công!");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCategory(
            @PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_06");
        response.put("message", "Xóa danh mục sản phẩm thành công!");
        return ResponseEntity.ok(response);
    }
}
