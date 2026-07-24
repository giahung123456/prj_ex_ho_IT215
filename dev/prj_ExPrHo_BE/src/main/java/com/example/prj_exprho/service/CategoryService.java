package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.CategoryCreateRequest;
import com.example.prj_exprho.dto.CategoryResponse;
import com.example.prj_exprho.dto.CategoryUpdateRequest;
import com.example.prj_exprho.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoryService {
    Page<CategoryResponse> getCategories(String search, String status, Pageable pageable);
    Category createCategory(CategoryCreateRequest request);
    Category updateCategory(Long id, CategoryUpdateRequest request);
    void deleteCategory(Long id);
}
