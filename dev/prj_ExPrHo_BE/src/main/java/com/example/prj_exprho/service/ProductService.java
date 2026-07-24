package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ProductService {
    Page<ProductResponse> getProducts(String search, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, String status, Pageable pageable);
    ProductResponse getProductById(Long id);
    ProductResponse createProduct(ProductCreateRequest request);
    ProductResponse updateProduct(Long id, ProductUpdateRequest request);
    ProductResponse adjustStock(Long id, StockAdjustRequest request);
}
