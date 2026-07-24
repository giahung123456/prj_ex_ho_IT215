package com.example.prj_exprho.service.impl;

import com.example.prj_exprho.dto.*;
import com.example.prj_exprho.entity.*;
import com.example.prj_exprho.exception.ApiException;
import com.example.prj_exprho.repository.*;
import com.example.prj_exprho.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockLogRepository stockLogRepository;

    @Override
    public Page<ProductResponse> getProducts(String search, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, String status, Pageable pageable) {
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String statusParam = (status == null || status.trim().isEmpty()) ? null : status.trim().toUpperCase();

        Page<Product> products = productRepository.searchProducts(
                searchParam,
                categoryId,
                minPrice,
                maxPrice,
                statusParam,
                pageable
        );

        return products.map(this::mapToResponse);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không tồn tại."));
        return mapToResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        // Validate basic inputs
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Tên sản phẩm không được để trống.");
        }

        BigDecimal price = request.getPrice();
        BigDecimal costPrice = request.getCostPrice();
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("ERR_VAL_05", "Giá bán phải lớn hơn hoặc bằng 0.");
        }
        if (costPrice == null || costPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("ERR_VAL_05", "Giá vốn phải lớn hơn hoặc bằng 0.");
        }
        // Business Rule: Price must not be less than cost price
        if (price.compareTo(costPrice) < 0) {
            throw new ApiException("ERR_VAL_02", "Giá bán không được nhỏ hơn giá vốn. Vui lòng kiểm tra lại.");
        }

        Integer stockQuantity = request.getStockQuantity();
        if (stockQuantity == null || stockQuantity < 0) {
            throw new ApiException("ERR_VAL_05", "Số lượng tồn kho ban đầu không được nhỏ hơn 0.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Danh mục không tồn tại."));

        // SKU validation
        String sku = request.getSku() != null ? request.getSku().trim() : "";
        if (sku.contains(" ")) {
            throw new ApiException("ERR_VAL_05", "Mã SKU không chứa khoảng trắng.");
        }

        if (sku.isEmpty()) {
            sku = generateSku(category);
        } else {
            if (productRepository.existsBySku(sku)) {
                throw new ApiException("ERR_VAL_01", "Mã SKU đã tồn tại trên hệ thống. Vui lòng nhập mã khác.");
            }
        }

        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            status = stockQuantity > 0 ? "ACTIVE" : "OUT_OF_STOCK";
        } else {
            status = status.trim().toUpperCase();
            if (!"ACTIVE".equals(status) && !"OUT_OF_STOCK".equals(status) && !"INACTIVE".equals(status)) {
                throw new ApiException("ERR_VAL_05", "Trạng thái không hợp lệ.");
            }
        }

        Product product = Product.builder()
                .sku(sku)
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .price(price)
                .costPrice(costPrice)
                .stockQuantity(stockQuantity)
                .status(status)
                .category(category)
                .build();

        Product savedProduct = productRepository.save(product);

        // Record initial stock log
        User currentUser = getCurrentUser();
        StockLog log = StockLog.builder()
                .product(savedProduct)
                .changeQuantity(stockQuantity)
                .type("IMPORT")
                .reason("Khởi tạo tồn kho ban đầu")
                .createdBy(currentUser)
                .stockAfterChange(stockQuantity)
                .build();

        stockLogRepository.save(log);

        return mapToResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không tồn tại."));

        // Validate basic inputs
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Tên sản phẩm không được để trống.");
        }

        BigDecimal price = request.getPrice();
        BigDecimal costPrice = request.getCostPrice();
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("ERR_VAL_05", "Giá bán phải lớn hơn hoặc bằng 0.");
        }
        if (costPrice == null || costPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("ERR_VAL_05", "Giá vốn phải lớn hơn hoặc bằng 0.");
        }
        // Business Rule: Price must not be less than cost price
        if (price.compareTo(costPrice) < 0) {
            throw new ApiException("ERR_VAL_02", "Giá bán không được nhỏ hơn giá vốn. Vui lòng kiểm tra lại.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Danh mục không tồn tại."));

        // SKU validation
        String sku = request.getSku() != null ? request.getSku().trim() : "";
        if (sku.contains(" ")) {
            throw new ApiException("ERR_VAL_05", "Mã SKU không chứa khoảng trắng.");
        }

        if (sku.isEmpty()) {
            sku = product.getSku(); // Keep original if left blank
        } else {
            if (!sku.equalsIgnoreCase(product.getSku()) && productRepository.existsBySku(sku)) {
                throw new ApiException("ERR_VAL_01", "Mã SKU đã tồn tại trên hệ thống. Vui lòng nhập mã khác.");
            }
        }

        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Trạng thái không được để trống.");
        }
        status = status.trim().toUpperCase();
        if (!"ACTIVE".equals(status) && !"OUT_OF_STOCK".equals(status) && !"INACTIVE".equals(status)) {
            throw new ApiException("ERR_VAL_05", "Trạng thái không hợp lệ.");
        }

        product.setSku(sku);
        product.setName(name);
        product.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        product.setPrice(price);
        product.setCostPrice(costPrice);
        product.setStatus(status);
        product.setCategory(category);

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse adjustStock(Long id, StockAdjustRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("ERR_VAL_05", "Sản phẩm không tồn tại."));

        String type = request.getType();
        if (type == null || type.trim().isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Loại điều chỉnh không được để trống.");
        }
        type = type.trim().toUpperCase();
        if (!"IMPORT".equals(type) && !"EXPORT".equals(type) && !"ADJUST".equals(type)) {
            throw new ApiException("ERR_VAL_05", "Loại điều chỉnh không hợp lệ.");
        }

        Integer quantity = request.getQuantity();
        if (quantity == null) {
            throw new ApiException("ERR_VAL_05", "Số lượng điều chỉnh không được để trống.");
        }

        String reason = request.getReason();
        if (reason == null || reason.trim().isEmpty()) {
            throw new ApiException("ERR_VAL_05", "Lý do điều chỉnh không được để trống.");
        }

        int currentStock = product.getStockQuantity();
        int newStock;
        int changeQuantity;

        if ("IMPORT".equals(type)) {
            if (quantity < 0) {
                throw new ApiException("ERR_VAL_05", "Số lượng nhập thêm không được nhỏ hơn 0.");
            }
            newStock = currentStock + quantity;
            changeQuantity = quantity;
        } else if ("EXPORT".equals(type)) {
            if (quantity < 0) {
                throw new ApiException("ERR_VAL_05", "Số lượng xuất kho không được nhỏ hơn 0.");
            }
            newStock = currentStock - quantity;
            changeQuantity = -quantity;
        } else {
            // ADJUST
            if (quantity < 0) {
                throw new ApiException("ERR_VAL_05", "Số lượng tồn kho thực tế không được nhỏ hơn 0.");
            }
            newStock = quantity;
            changeQuantity = newStock - currentStock;
        }

        if (newStock < 0) {
            throw new ApiException("ERR_VAL_03", "Số lượng tồn kho sau khi điều chỉnh không thể nhỏ hơn 0.");
        }

        // Auto transition status if stock goes to 0 or becomes positive
        if (newStock == 0 && "ACTIVE".equals(product.getStatus())) {
            product.setStatus("OUT_OF_STOCK");
        } else if (newStock > 0 && "OUT_OF_STOCK".equals(product.getStatus())) {
            product.setStatus("ACTIVE");
        }

        product.setStockQuantity(newStock);
        Product savedProduct = productRepository.save(product);

        // Record stock log
        User currentUser = getCurrentUser();
        StockLog log = StockLog.builder()
                .product(savedProduct)
                .changeQuantity(changeQuantity)
                .type(type)
                .reason(reason.trim())
                .createdBy(currentUser)
                .stockAfterChange(newStock)
                .build();

        stockLogRepository.save(log);

        return mapToResponse(savedProduct);
    }

    private ProductResponse mapToResponse(Product product) {
        if (product == null) return null;
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .costPrice(product.getCostPrice())
                .stockQuantity(product.getStockQuantity())
                .status(product.getStatus())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private String generateSku(Category category) {
        String name = removeAccents(category.getName()).replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        String prefix = name.length() > 3 ? name.substring(0, 3) : name;
        if (prefix.isEmpty()) {
            prefix = "CAT" + category.getId();
        }
        long count = productRepository.countByCategoryId(category.getId());
        long seq = count + 1;
        String sku = prefix + "-" + seq;
        while (productRepository.existsBySku(sku)) {
            seq++;
            sku = prefix + "-" + seq;
        }
        return sku;
    }

    private String removeAccents(String src) {
        if (src == null) {
            return "";
        }
        String nfdNormalizedString = java.text.Normalizer.normalize(src, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String out = pattern.matcher(nfdNormalizedString).replaceAll("");
        return out.replace("đ", "d").replace("Đ", "D");
    }

    private User getCurrentUser() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }
}
