package com.elearning.elearning_base;

import com.elearning.exceptions.BusinessException;
import com.elearning.models.dto.CartPriceResponse;
import com.elearning.models.entities.Course;
import com.elearning.models.entities.DiscountCode;
import com.elearning.models.entities.User;
import com.elearning.models.repositories.CartRepository;
import com.elearning.models.repositories.CourseRepository;
import com.elearning.models.repositories.DiscountCodeRepository;
import com.elearning.models.repositories.UserRepository;
import com.elearning.models.services.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CartServiceTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private DiscountCodeRepository discountCodeRepository;

    @Autowired
    private CartRepository cartRepository;

    private User testUser;
    private Course course1;
    private Course course2;
    private Course course3;
    private DiscountCode voucher;

    @BeforeEach
    void setUp() {
        // Clear previous database state
        cartRepository.deleteAll();
        courseRepository.deleteAll();
        discountCodeRepository.deleteAll();
        userRepository.deleteAll();

        // Save a test student user
        testUser = new User();
        testUser.setEmail("test_student@gmail.com");
        testUser.setPassword("password");
        testUser.setFullName("Test Student User");
        testUser.setRole("STUDENT");
        testUser = userRepository.save(testUser);

        // Save courses with prices
        course1 = new Course();
        course1.setTitle("Spring Boot Course");
        course1.setDescription("Learn Spring Boot");
        course1.setPrice(1500000.0);
        course1 = courseRepository.save(course1);

        course2 = new Course();
        course2.setTitle("React Course");
        course2.setDescription("Learn React JS");
        course2.setPrice(1200000.0);
        course2 = courseRepository.save(course2);

        course3 = new Course();
        course3.setTitle("Intro to CSS");
        course3.setDescription("Learn CSS basics");
        course3.setPrice(500000.0);
        course3 = courseRepository.save(course3);

        // Save BLACKFRIDAY discount code
        voucher = new DiscountCode();
        voucher.setCode("BLACKFRIDAY");
        voucher.setDiscountPercentage(20.0);
        voucher.setMaxDiscountAmount(500000.0);
        voucher.setMinCoursesRequired(2);
        voucher.setActive(true);
        voucher = discountCodeRepository.save(voucher);
    }

    @Test
    void testCalculateCartWithoutVoucher() {
        // Add one course to cart
        cartService.addCourseToCart(testUser, course1.getId());

        CartPriceResponse priceResponse = cartService.calculateCartPrice(testUser);

        assertEquals(1500000.0, priceResponse.getTotalOriginalPrice());
        assertEquals(0.0, priceResponse.getDiscountAmount());
        assertEquals(1500000.0, priceResponse.getFinalPrice());
        assertNull(priceResponse.getAppliedCode());
    }

    @Test
    void testApplyVoucherWithOnlyOneCourseThrowsException() {
        // Add only 1 course to cart
        cartService.addCourseToCart(testUser, course1.getId());
        
        // Apply voucher
        cartService.applyDiscountCode(testUser, "BLACKFRIDAY");

        // Calculate price should throw BusinessException because minCoursesRequired = 2
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            cartService.calculateCartPrice(testUser);
        });

        assertEquals(400, exception.getCode());
        assertTrue(exception.getMessage().contains("Phải mua ít nhất 2 khóa học để áp dụng mã này"));
    }

    @Test
    void testApplyVoucherWithTwoCoursesHittingDiscountCap() {
        // Add 2 courses to cart: total 1,500,000 + 1,200,000 = 2,700,000 VNĐ
        cartService.addCourseToCart(testUser, course1.getId());
        cartService.addCourseToCart(testUser, course2.getId());

        // Apply voucher BLACKFRIDAY (20% off, max 500k VNĐ)
        // 20% of 2.7M = 540k VNĐ, which exceeds the max discount of 500k VNĐ.
        cartService.applyDiscountCode(testUser, "BLACKFRIDAY");

        CartPriceResponse priceResponse = cartService.calculateCartPrice(testUser);

        assertEquals(2700000.0, priceResponse.getTotalOriginalPrice());
        assertEquals(500000.0, priceResponse.getDiscountAmount()); // Capped at 500k
        assertEquals(2200000.0, priceResponse.getFinalPrice()); // 2.7M - 500k = 2.2M
        assertEquals("BLACKFRIDAY", priceResponse.getAppliedCode());
    }

    @Test
    void testApplyVoucherWithTwoCoursesNotHittingDiscountCap() {
        // Add 2 courses to cart: 1,200,000 (course2) + 500,000 (course3) = 1,700,000 VNĐ
        cartService.addCourseToCart(testUser, course2.getId());
        cartService.addCourseToCart(testUser, course3.getId());

        // Apply voucher BLACKFRIDAY (20% off, max 500k VNĐ)
        // 20% of 1.7M = 340k VNĐ, which is below the max discount of 500k VNĐ.
        cartService.applyDiscountCode(testUser, "BLACKFRIDAY");

        CartPriceResponse priceResponse = cartService.calculateCartPrice(testUser);

        assertEquals(1700000.0, priceResponse.getTotalOriginalPrice());
        assertEquals(340000.0, priceResponse.getDiscountAmount()); // Not capped, full 340k
        assertEquals(1360000.0, priceResponse.getFinalPrice()); // 1.7M - 340k = 1.36M
        assertEquals("BLACKFRIDAY", priceResponse.getAppliedCode());
    }
}
