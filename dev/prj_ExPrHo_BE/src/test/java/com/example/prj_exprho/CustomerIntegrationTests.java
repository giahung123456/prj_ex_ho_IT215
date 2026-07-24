package com.example.prj_exprho;

import com.example.prj_exprho.dto.CustomerCreateRequest;
import com.example.prj_exprho.dto.CustomerUpdateRequest;
import com.example.prj_exprho.entity.Customer;
import com.example.prj_exprho.repository.CustomerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CustomerIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        customerRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testCreateCustomerSuccess() throws Exception {
        CustomerCreateRequest request = CustomerCreateRequest.builder()
                .username("nguyenvana")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .address("Ha Noi")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_10"))
                .andExpect(jsonPath("$.message").value("Thêm mới khách hàng thành công!"));

        // Check DB
        Customer saved = customerRepository.findByPhone("0987654321").orElseThrow();
        assert saved.getCustomerCode().equals("KH0001");
        assert saved.getFullName().equals("Nguyen Van A");
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testCreateCustomerMissingFieldsReturnsErrVal07() throws Exception {
        CustomerCreateRequest request = CustomerCreateRequest.builder()
                .username("")
                .fullName("")
                .phone("")
                .email("invalid-email")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_07"))
                .andExpect(jsonPath("$.message").value("Thông tin khách hàng không hợp lệ. Họ tên và Số điện thoại là bắt buộc."));
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testCreateCustomerDuplicatePhoneOrEmailReturnsErrVal06() throws Exception {
        Customer first = Customer.builder()
                .username("nguyenvana")
                .customerCode("KH0001")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build();
        customerRepository.save(first);

        CustomerCreateRequest request = CustomerCreateRequest.builder()
                .username("nguyenvanb")
                .fullName("Nguyen Van B")
                .phone("0987654321") // Duplicate phone
                .email("vnb@example.com")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_06"))
                .andExpect(jsonPath("$.message").value("Số điện thoại hoặc Email đã tồn tại trên hệ thống. Vui lòng kiểm tra lại."));
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testGetCustomersPaginationAndSearch() throws Exception {
        Customer first = Customer.builder()
                .username("nguyenvana")
                .customerCode("KH0001")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build();
        Customer second = Customer.builder()
                .username("tranthib")
                .customerCode("KH0002")
                .fullName("Tran Thi B")
                .phone("0912345678")
                .email("ttb@example.com")
                .passwordHash("mockHash")
                .status("INACTIVE")
                .build();
        customerRepository.save(first);
        customerRepository.save(second);

        // Search by name "Tran"
        mockMvc.perform(get("/api/customers")
                        .param("search", "Tran")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName").value("Tran Thi B"));

        // Search by status "ACTIVE"
        mockMvc.perform(get("/api/customers")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fullName").value("Nguyen Van A"));
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testUpdateCustomerSuccess() throws Exception {
        Customer existing = Customer.builder()
                .username("nguyenvana")
                .customerCode("KH0001")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build();
        existing = customerRepository.save(existing);

        CustomerUpdateRequest request = CustomerUpdateRequest.builder()
                .fullName("Nguyen Van A Updated")
                .phone("0987654322") // Updated phone
                .email("vna.updated@example.com")
                .status("INACTIVE")
                .build();

        mockMvc.perform(put("/api/customers/" + existing.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_11"))
                .andExpect(jsonPath("$.message").value("Cập nhật thông tin khách hàng thành công."));

        Customer updated = customerRepository.findById(existing.getId()).orElseThrow();
        assert updated.getFullName().equals("Nguyen Van A Updated");
        assert updated.getPhone().equals("0987654322");
        assert updated.getStatus().equals("INACTIVE");
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testUpdateCustomerDuplicatePhone() throws Exception {
        Customer c1 = customerRepository.save(Customer.builder()
                .username("nguyenvana")
                .customerCode("KH0001")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build());

        Customer c2 = customerRepository.save(Customer.builder()
                .username("tranthib")
                .customerCode("KH0002")
                .fullName("Tran Thi B")
                .phone("0912345678")
                .email("ttb@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build());

        CustomerUpdateRequest request = CustomerUpdateRequest.builder()
                .fullName("Nguyen Van A")
                .phone("0912345678") // Duplicate with c2
                .email("vna@example.com")
                .status("ACTIVE")
                .build();

        mockMvc.perform(put("/api/customers/" + c1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_06"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testDeleteCustomerByAdminSuccess() throws Exception {
        Customer c = customerRepository.save(Customer.builder()
                .username("nguyenvana")
                .customerCode("KH0001")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build());

        mockMvc.perform(delete("/api/customers/" + c.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_12"))
                .andExpect(jsonPath("$.message").value("Xóa khách hàng thành công!"));

        assertFalse(customerRepository.findById(c.getId()).isPresent());
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testDeleteCustomerBySalesForbidden() throws Exception {
        Customer c = customerRepository.save(Customer.builder()
                .username("nguyenvana")
                .customerCode("KH0001")
                .fullName("Nguyen Van A")
                .phone("0987654321")
                .email("vna@example.com")
                .passwordHash("mockHash")
                .status("ACTIVE")
                .build());

        mockMvc.perform(delete("/api/customers/" + c.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ERR_AUTH_02"))
                .andExpect(jsonPath("$.message").value("Tài khoản không có quyền hạn truy cập chức năng này."));
    }
}
