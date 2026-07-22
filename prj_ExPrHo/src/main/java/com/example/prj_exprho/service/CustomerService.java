package com.example.prj_exprho.service;

import com.example.prj_exprho.dto.CustomerCreateRequest;
import com.example.prj_exprho.dto.CustomerUpdateRequest;
import com.example.prj_exprho.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerService {
    Page<Customer> getCustomers(String search, String status, Pageable pageable);
    Customer createCustomer(CustomerCreateRequest request);
    Customer updateCustomer(Long id, CustomerUpdateRequest request);
    void deleteCustomer(Long id);
}
