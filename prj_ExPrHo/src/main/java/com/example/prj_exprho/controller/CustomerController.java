package com.example.prj_exprho.controller;

import com.example.prj_exprho.dto.CustomerCreateRequest;
import com.example.prj_exprho.dto.CustomerUpdateRequest;
import com.example.prj_exprho.entity.Customer;
import com.example.prj_exprho.service.CustomerService;
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
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<Page<Customer>> getCustomers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Customer> customers = customerService.getCustomers(search, status, pageable);
        return ResponseEntity.ok(customers);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<Map<String, String>> createCustomer(
            @Valid @RequestBody CustomerCreateRequest request) {
        customerService.createCustomer(request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_10");
        response.put("message", "Thêm mới khách hàng thành công!");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    public ResponseEntity<Map<String, String>> updateCustomer(
            @PathVariable("id") Long id,
            @Valid @RequestBody CustomerUpdateRequest request) {
        customerService.updateCustomer(id, request);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_11");
        response.put("message", "Cập nhật thông tin khách hàng thành công.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCustomer(
            @PathVariable("id") Long id) {
        customerService.deleteCustomer(id);
        Map<String, String> response = new HashMap<>();
        response.put("code", "MSG_SUCCESS_12");
        response.put("message", "Xóa khách hàng thành công!");
        return ResponseEntity.ok(response);
    }
}
