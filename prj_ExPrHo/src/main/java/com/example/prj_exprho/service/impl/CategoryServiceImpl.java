package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.CategoryCreateRequest;
import com.example.prj_exprho.dto.CategoryResponse;
import com.example.prj_exprho.dto.CategoryUpdateRequest;
import com.example.prj_exprho.entity.Category;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.CategoryRepository;
import com.example.prj_exprho.repository.ProductRepository;
import com.example.prj_exprho.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Override
    public Page<CategoryResponse> getCategories(String search, String status, Pageable pageable) {
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String statusParam = (status == null || status.trim().isEmpty()) ? null : status.trim().toUpperCase();
        return categoryRepository.searchCategories(searchParam, statusParam, pageable);
    }

    @Override
    @Transactional
    public Category createCategory(CategoryCreateRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Tên danh mục không được để trống.");
        }

        // Unique validation
        if (categoryRepository.existsByName(name)) {
            throw new ApiException("ERR_VAL_05", "Tên danh mục đã tồn tại trong hệ thống.");
        }

        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        } else {
            status = status.trim().toUpperCase();
            if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
                throw new ApiException("ERR_VAL_05", "Trạng thái danh mục không hợp lệ.");
            }
        }

        Category category = Category.builder()
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status(status)
                .build();

        return categoryRepository.save(category);
    }

    @Override
    @Transactional
    public Category updateCategory(Long id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Danh mục không tồn tại."));

        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Tên danh mục không được để trống.");
        }

        // Unique validation excluding self
        if (categoryRepository.existsByNameAndIdNot(name, id)) {
            throw new ApiException("ERR_VAL_05", "Tên danh mục đã tồn tại trong hệ thống.");
        }

        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Trạng thái không được để trống.");
        }
        status = status.trim().toUpperCase();
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw new ApiException("ERR_VAL_05", "Trạng thái danh mục không hợp lệ.");
        }

        category.setName(name);
        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        category.setStatus(status);

        return categoryRepository.save(category);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Danh mục không tồn tại."));

        // Check if there are linked products
        if (productRepository.existsByCategoryId(id)) {
            throw new ApiException("ERR_VAL_04", "Không thể xóa danh mục vì đang chứa sản phẩm liên kết.");
        }

        categoryRepository.delete(category);
    }
}
