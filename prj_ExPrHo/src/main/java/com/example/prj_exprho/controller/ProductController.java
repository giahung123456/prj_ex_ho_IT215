package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping({"", "/retail"})
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER', 'SALES', 'CUSTOMER')")
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductResponse> products = productService.getProducts(search, categoryId, minPrice, maxPrice, status, pageable);
        filterCostPrices(products);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER', 'SALES', 'CUSTOMER')")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable("id") Long id) {
        ProductResponse product = productService.getProductById(id);
        filterCostPrice(product);
        return ResponseEntity.ok(product);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<Map<String, String>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        productService.createProduct(request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_07");
        response.put("message", "Thêm mới sản phẩm thành công!");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<Map<String, String>> updateProduct(
            @PathVariable("id") Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        productService.updateProduct(id, request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_08");
        response.put("message", "Cập nhật thông tin sản phẩm thành công.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<Map<String, String>> adjustStock(
            @PathVariable("id") Long id,
            @Valid @RequestBody StockAdjustRequest request) {
        productService.adjustStock(id, request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_09");
        response.put("message", "Điều chỉnh tồn kho sản phẩm thành công.");
        return ResponseEntity.ok(response);
    }

    private void filterCostPrices(Page<ProductResponse> page) {
        page.forEach(this::filterCostPrice);
    }

    private void filterCostPrice(ProductResponse response) {
        if (response == null) return;
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            boolean isSales = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SALES"));
            boolean isCustomer = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
            if (isSales || isCustomer) {
                response.setCostPrice(null);
            }
        }
    }
}
