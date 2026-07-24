package com.example.prj_exprho;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.entity.*;
import com.example.prj_exprho.repository.*;
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
public class ProductIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StockLogRepository stockLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Category categoryLaptop;
    private Category categoryPhone;

    @BeforeEach
    public void setup() {
        stockLogRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        categoryLaptop = Category.builder().name("Laptop").description("Computers").status("ACTIVE").build();
        categoryPhone = Category.builder().name("Điện thoại").description("Smart Phones").status("ACTIVE").build();
        categoryLaptop = categoryRepository.save(categoryLaptop);
        categoryPhone = categoryRepository.save(categoryPhone);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testCreateProductSuccess() throws Exception {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Dell XPS 13")
                .description("Dell laptop")
                .price(new BigDecimal("20000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .categoryId(categoryLaptop.getId())
                .build();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_07"))
                .andExpect(jsonPath("$.message").value("Thêm mới sản phẩm thành công!"));

        // Verify in DB and SKU auto generation: Laptop first letters normalized is LAP
        Optional<Product> opt = productRepository.findBySku("LAP-1");
        assertTrue(opt.isPresent());
        Product p = opt.get();
        assertEquals("Dell XPS 13", p.getName());
        assertEquals(10, p.getStockQuantity());
        assertEquals("ACTIVE", p.getStatus());

        // Verify initial stock log
        long logsCount = stockLogRepository.count();
        assertEquals(1, logsCount);
        StockLog log = stockLogRepository.findAll().get(0);
        assertEquals("IMPORT", log.getType());
        assertEquals(10, log.getChangeQuantity());
        assertEquals(10, log.getStockAfterChange());
        assertEquals("Khởi tạo tồn kho ban đầu", log.getReason());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testCreateProductDuplicateSkuReturnsErrVal01() throws Exception {
        Product existing = Product.builder()
                .sku("LAP-X")
                .name("MacBook Pro")
                .price(new BigDecimal("30000000.00"))
                .costPrice(new BigDecimal("25000000.00"))
                .stockQuantity(5)
                .status("ACTIVE")
                .category(categoryLaptop)
                .build();
        productRepository.save(existing);

        ProductCreateRequest request = ProductCreateRequest.builder()
                .sku("LAP-X")
                .name("MacBook Air")
                .price(new BigDecimal("22000000.00"))
                .costPrice(new BigDecimal("18000000.00"))
                .stockQuantity(10)
                .categoryId(categoryLaptop.getId())
                .build();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_01"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testCreateProductPriceLessThanCostReturnsErrVal02() throws Exception {
        ProductCreateRequest request = ProductCreateRequest.builder()
                .name("Dell XPS 13")
                .price(new BigDecimal("10000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .categoryId(categoryLaptop.getId())
                .build();

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_02"))
                .andExpect(jsonPath("$.message").value("Giá bán không được nhỏ hơn giá vốn. Vui lòng kiểm tra lại."));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testUpdateProductSuccess() throws Exception {
        Product p = Product.builder()
                .sku("LAP-1")
                .name("Dell XPS 13 Original")
                .price(new BigDecimal("20000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .status("ACTIVE")
                .category(categoryLaptop)
                .build();
        p = productRepository.save(p);

        ProductUpdateRequest request = ProductUpdateRequest.builder()
                .name("Dell XPS 13 Updated")
                .sku("LAP-1-NEW")
                .price(new BigDecimal("22000000.00"))
                .costPrice(new BigDecimal("16000000.00"))
                .status("ACTIVE")
                .categoryId(categoryLaptop.getId())
                .build();

        mockMvc.perform(put("/api/products/" + p.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_08"))
                .andExpect(jsonPath("$.message").value("Cập nhật thông tin sản phẩm thành công."));

        Product updated = productRepository.findById(p.getId()).orElseThrow();
        assertEquals("Dell XPS 13 Updated", updated.getName());
        assertEquals("LAP-1-NEW", updated.getSku());
        assertEquals(new BigDecimal("22000000.00"), updated.getPrice());
        assertEquals(10, updated.getStockQuantity()); // Stock quantity unchanged
    }

    @Test
    @WithMockUser(username = "sales", roles = "SALES")
    public void testGetProductsHidesCostPriceForSales() throws Exception {
        Product p = Product.builder()
                .sku("LAP-1")
                .name("Dell XPS 13")
                .price(new BigDecimal("20000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .status("ACTIVE")
                .category(categoryLaptop)
                .build();
        productRepository.save(p);

        // Get list
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].costPrice").value(nullValue()));

        // Get details
        mockMvc.perform(get("/api/products/" + p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.costPrice").value(nullValue()));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testGetProductsShowsCostPriceForAdmin() throws Exception {
        Product p = Product.builder()
                .sku("LAP-1")
                .name("Dell XPS 13")
                .price(new BigDecimal("20000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .status("ACTIVE")
                .category(categoryLaptop)
                .build();
        productRepository.save(p);

        // Get details
        mockMvc.perform(get("/api/products/" + p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.costPrice").value(15000000.00));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testAdjustStockSuccess() throws Exception {
        Product p = Product.builder()
                .sku("LAP-1")
                .name("Dell XPS 13")
                .price(new BigDecimal("20000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .status("ACTIVE")
                .category(categoryLaptop)
                .build();
        p = productRepository.save(p);

        // 1. IMPORT
        StockAdjustRequest importReq = StockAdjustRequest.builder()
                .type("IMPORT")
                .quantity(5)
                .reason("Nhập thêm hàng tháng 7")
                .build();

        mockMvc.perform(post("/api/products/" + p.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(importReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_09"));

        Product p1 = productRepository.findById(p.getId()).orElseThrow();
        assertEquals(15, p1.getStockQuantity());

        // 2. EXPORT
        StockAdjustRequest exportReq = StockAdjustRequest.builder()
                .type("EXPORT")
                .quantity(3)
                .reason("Xuất bán lẻ")
                .build();

        mockMvc.perform(post("/api/products/" + p.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exportReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_09"));

        Product p2 = productRepository.findById(p.getId()).orElseThrow();
        assertEquals(12, p2.getStockQuantity());

        // 3. ADJUST
        StockAdjustRequest adjustReq = StockAdjustRequest.builder()
                .type("ADJUST")
                .quantity(20)
                .reason("Kiểm kê cuối kỳ")
                .build();

        mockMvc.perform(post("/api/products/" + p.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MSG_SUCCESS_09"));

        Product p3 = productRepository.findById(p.getId()).orElseThrow();
        assertEquals(20, p3.getStockQuantity());

        // Verify logs count (initial import + 3 adjustments = 4 logs)
        assertEquals(4, stockLogRepository.count());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testAdjustStockNegativeFailsReturnsErrVal03() throws Exception {
        Product p = Product.builder()
                .sku("LAP-1")
                .name("Dell XPS 13")
                .price(new BigDecimal("20000000.00"))
                .costPrice(new BigDecimal("15000000.00"))
                .stockQuantity(10)
                .status("ACTIVE")
                .category(categoryLaptop)
                .build();
        p = productRepository.save(p);

        StockAdjustRequest exportReq = StockAdjustRequest.builder()
                .type("EXPORT")
                .quantity(15) // more than 10
                .reason("Xuất bán số lượng lớn")
                .build();

        mockMvc.perform(post("/api/products/" + p.getId() + "/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exportReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ERR_VAL_03"))
                .andExpect(jsonPath("$.message").value("Số lượng tồn kho sau khi điều chỉnh không thể nhỏ hơn 0."));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    public void testSearchProductsDiacriticInsensitive() throws Exception {
        // Điện thoại category first letters: Điện thoại -> Dien thoai -> DIE
        Product p1 = Product.builder()
                .sku("DIE-1")
                .name("Sữa tươi Ba Vì")
                .price(new BigDecimal("20000.00"))
                .costPrice(new BigDecimal("15000.00"))
                .stockQuantity(100)
                .status("ACTIVE")
                .category(categoryPhone)
                .build();
        productRepository.save(p1);

        // Search with exact accented term "Sữa"
        mockMvc.perform(get("/api/products?search=Sữa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Sữa tươi Ba Vì"));

        // Search with unaccented term "sua"
        mockMvc.perform(get("/api/products?search=sua"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Sữa tươi Ba Vì"));
    }
}
