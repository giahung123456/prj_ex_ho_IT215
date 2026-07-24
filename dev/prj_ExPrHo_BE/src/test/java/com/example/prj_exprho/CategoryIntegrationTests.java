package com.example.prj_exprho;

import com.example.prj_exprho.dto.CategoryCreateRequest;
import com.example.prj_exprho.dto.CategoryUpdateRequest;
import com.example.prj_exprho.entity.Category;
import com.example.prj_exprho.entity.Product;
import com.example.prj_exprho.repository.CategoryRepository;
import com.example.prj_exprho.repository.ProductRepository;
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

import java.math.BigDecimal;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CategoryIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testViewCategoryListSuccess() throws Exception {
        Category c1 = Category.builder().name("Laptop").description("Computers").status("ACTIVE").build();
        Category c2 = Category.builder().name("Phone").description("Mobile devices").status("INACTIVE").build();
        c1 = categoryRepository.save(c1);
        c2 = categoryRepository.save(c2);

        // Add products linked to c1
        Product p1 = Product.builder().sku("LAP001").name("Dell Inspiron").price(new BigDecimal("15000000")).costPrice(new BigDecimal("12000000")).stockQuantity(10).status("ACTIVE").category(c1).build();
        Product p2 = Product.builder().sku("LAP002").name("MacBook Air").price(new BigDecimal("25000000")).costPrice(new BigDecimal("20000000")).stockQuantity(5).status("ACTIVE").category(c1).build();
        productRepository.save(p1);
        productRepository.save(p2);

        // Fetch all categories
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[?(@.name=='Laptop')].productCount").value(contains(2)))
                .andExpect(jsonPath("$.content[?(@.name=='Phone')].productCount").value(contains(0)));

        // Filter by status INACTIVE
        mockMvc.perform(get("/api/categories?status=INACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Phone"));

        // Search by name "lap"
        mockMvc.perform(get("/api/categories?search=lap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Laptop"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testAddCategorySuccess() throws Exception {
        CategoryCreateRequest request = CategoryCreateRequest.builder()
                .name("Tablet")
                .description("Tablet devices")
                .status("ACTIVE")
                .build();

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_06"))
                .andExpect(jsonPath("$.message").value("Tạo mới/Cập nhật danh mục sản phẩm thành công!"));

        // Verify in DB
        Optional<Category> opt = categoryRepository.findByName("Tablet");
        assertTrue(opt.isPresent());
        assertEquals("Tablet", opt.get().getName());
        assertEquals("Tablet devices", opt.get().getDescription());
        assertEquals("ACTIVE", opt.get().getStatus());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testAddCategoryValidationFails() throws Exception {
        // Missing name
        CategoryCreateRequest requestEmptyName = CategoryCreateRequest.builder()
                .name("")
                .description("Some desc")
                .build();

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestEmptyName)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_05"))
                .andExpect(jsonPath("$.message").value("Thông tin nhập vào không đúng định dạng hoặc để trống trường bắt buộc."));

        // Duplicate name
        Category existing = Category.builder().name("Books").status("ACTIVE").build();
        categoryRepository.save(existing);

        CategoryCreateRequest requestDuplicateName = CategoryCreateRequest.builder()
                .name("Books")
                .description("Other description")
                .build();

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDuplicateName)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_05"))
                .andExpect(jsonPath("$.message").value("Tên danh mục đã tồn tại trong hệ thống."));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testUpdateCategorySuccess() throws Exception {
        Category cat = Category.builder().name("Electronics").description("Devices").status("ACTIVE").build();
        cat = categoryRepository.save(cat);

        CategoryUpdateRequest request = CategoryUpdateRequest.builder()
                .name("New Electronics")
                .description("Updated devices")
                .status("INACTIVE")
                .build();

        mockMvc.perform(put("/api/categories/" + cat.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_06"))
                .andExpect(jsonPath("$.message").value("Tạo mới/Cập nhật danh mục sản phẩm thành công!"));

        // Verify in DB
        Category updated = categoryRepository.findById(cat.getId()).orElseThrow();
        assertEquals("New Electronics", updated.getName());
        assertEquals("Updated devices", updated.getDescription());
        assertEquals("INACTIVE", updated.getStatus());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testUpdateCategoryValidationFails() throws Exception {
        Category cat1 = Category.builder().name("Electronics").status("ACTIVE").build();
        Category cat2 = Category.builder().name("Furniture").status("ACTIVE").build();
        cat1 = categoryRepository.save(cat1);
        cat2 = categoryRepository.save(cat2);

        // Try to update cat1 to name "Furniture" (duplicate)
        CategoryUpdateRequest request = CategoryUpdateRequest.builder()
                .name("Furniture")
                .status("ACTIVE")
                .build();

        mockMvc.perform(put("/api/categories/" + cat1.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_05"))
                .andExpect(jsonPath("$.message").value("Tên danh mục đã tồn tại trong hệ thống."));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testDeleteCategorySuccess() throws Exception {
        Category cat = Category.builder().name("Books").status("ACTIVE").build();
        cat = categoryRepository.save(cat);

        mockMvc.perform(delete("/api/categories/" + cat.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_06"))
                .andExpect(jsonPath("$.message").value("Xóa danh mục sản phẩm thành công!"));

        assertFalse(categoryRepository.findById(cat.getId()).isPresent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testDeleteCategoryFailsIfLinkedProducts() throws Exception {
        Category cat = Category.builder().name("Books").status("ACTIVE").build();
        cat = categoryRepository.save(cat);

        Product p = Product.builder().sku("B001").name("Java 101").price(new BigDecimal("100000")).costPrice(new BigDecimal("50000")).stockQuantity(100).status("ACTIVE").category(cat).build();
        productRepository.save(p);

        mockMvc.perform(delete("/api/categories/" + cat.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_04"))
                .andExpect(jsonPath("$.message").value("Không thể xóa danh mục vì đang chứa sản phẩm liên kết."));

        assertTrue(categoryRepository.findById(cat.getId()).isPresent());
    }

    @Test
    @WithMockUser(roles = "SALES")
    public void testRoleAuthorizationsForbidden() throws Exception {
        CategoryCreateRequest request = CategoryCreateRequest.builder().name("Forbidden").status("ACTIVE").build();

        // SALES tries to create
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ERR_AUTH_02"));

        // SALES tries to delete
        mockMvc.perform(delete("/api/categories/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ERR_AUTH_02"));
    }

    @Test
    public void testUnauthorizedUserAccess() throws Exception {
        // No user authenticated
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("ERR_SYS_01"));
    }
}
