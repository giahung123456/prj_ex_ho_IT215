package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.CustomerCreateRequest;
import com.example.prj_exprho.dto.CustomerUpdateRequest;
import com.example.prj_exprho.entity.Customer;
import com.example.prj_exprho.entity.Role;
import com.example.prj_exprho.entity.User;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.CustomerRepository;
import com.example.prj_exprho.repository.RoleRepository;
import com.example.prj_exprho.repository.UserRepository;
import com.example.prj_exprho.service.CustomerService;
import com.example.prj_exprho.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashSet;

@Service
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MailService mailService;

    private static final String CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private final SecureRandom random = new SecureRandom();

    @Override
    public Page<Customer> getCustomers(String search, String status, Pageable pageable) {
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String statusParam = (status == null || status.trim().isEmpty()) ? null : status.trim();
        return customerRepository.searchCustomers(searchParam, statusParam, pageable);
    }

    @Override
    @Transactional
    public Customer createCustomer(CustomerCreateRequest request) {
        validateCustomerData(request.getUsername(), request.getFullName(), request.getPhone(), request.getEmail());

        String phone = request.getPhone().trim();
        String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty()) 
                ? request.getEmail().trim() : null;
        String username = request.getUsername().trim();

        // Check duplicate Username
        if (customerRepository.findByUsername(username).isPresent()) {
            throw new ApiException("ERR_VAL_06", "Số điện thoại hoặc Email đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
        }

        // Check duplicate Phone
        if (customerRepository.findByPhone(phone).isPresent()) {
            throw new ApiException("ERR_VAL_06", "Số điện thoại hoặc Email đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
        }

        // Check duplicate Email
        if (email != null && customerRepository.findByEmail(email).isPresent()) {
            throw new ApiException("ERR_VAL_06", "Số điện thoại hoặc Email đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
        }

        // Generate temporary password (8 characters)
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(CHAR_SET.charAt(random.nextInt(CHAR_SET.length())));
        }
        String tempPassword = sb.toString();

        String nextCode = generateNextCustomerCode();

        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        } else {
            status = status.trim().toUpperCase();
            if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
                throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
            }
        }

        Customer customer = Customer.builder()
                .username(username)
                .customerCode(nextCode)
                .fullName(request.getFullName().trim())
                .phone(phone)
                .email(email)
                .passwordHash(passwordEncoder.encode(tempPassword))
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .status(status)
                .build();

        Customer savedCustomer = customerRepository.save(customer);

        // Send Email
        if (email != null) {
            mailService.sendTemporaryPassword(email, username, tempPassword);
        }

        return savedCustomer;
    }

    @Override
    @Transactional
    public Customer updateCustomer(Long id, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Khách hàng không tồn tại."));

        validateCustomerData(request.getFullName(), request.getPhone(), request.getEmail());

        String phone = request.getPhone().trim();
        String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty()) 
                ? request.getEmail().trim() : null;

        // Check duplicate Phone with other customers
        customerRepository.findByPhone(phone).ifPresent(c -> {
            if (!c.getId().equals(id)) {
                throw new ApiException("ERR_VAL_06", "Số điện thoại hoặc Email đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
            }
        });

        // Check duplicate Email with other customers
        if (email != null) {
            customerRepository.findByEmail(email).ifPresent(c -> {
                if (!c.getId().equals(id)) {
                    throw new ApiException("ERR_VAL_06", "Số điện thoại hoặc Email đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.");
                }
            });
        }

        String status = request.getStatus();
        if (status != null && !status.trim().isEmpty()) {
            status = status.trim().toUpperCase();
            if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
                throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
            }
            customer.setStatus(status);
        }

        customer.setFullName(request.getFullName().trim());
        customer.setPhone(phone);
        customer.setEmail(email);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        return customerRepository.save(customer);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_AUTH_04", "Khách hàng không tồn tại."));
        customerRepository.delete(customer);
    }

    private void validateCustomerData(String username, String fullName, String phone, String email) {
        if (username == null || username.trim().isEmpty() || fullName == null || fullName.trim().isEmpty() || phone == null || phone.trim().isEmpty()) {
            throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
        }
        if (!phone.trim().matches("^(0|\\+84)[0-9]{9,10}$")) {
            throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
        }
        if (email != null && !email.trim().isEmpty()) {
            if (!email.trim().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
            }
        }
    }

    private void validateCustomerData(String fullName, String phone, String email) {
        if (fullName == null || fullName.trim().isEmpty() || phone == null || phone.trim().isEmpty()) {
            throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
        }
        if (!phone.trim().matches("^(0|\\+84)[0-9]{9,10}$")) {
            throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
        }
        if (email != null && !email.trim().isEmpty()) {
            if (!email.trim().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new ApiException("ERR_VAL_07", "Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc.");
            }
        }
    }

    private String generateNextCustomerCode() {
        String maxCode = customerRepository.findMaxCustomerCode();
        if (maxCode == null || !maxCode.startsWith("KH")) {
            return "KH0001";
        }
        try {
            int number = Integer.parseInt(maxCode.substring(2));
            return String.format("KH%04d", number + 1);
        } catch (NumberFormatException e) {
            return "KH0001";
        }
    }
}
