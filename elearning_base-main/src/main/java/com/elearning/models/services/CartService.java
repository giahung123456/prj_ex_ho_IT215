package com.elearning.models.services;

import com.elearning.exceptions.BusinessException;
import com.elearning.models.dto.CartPriceResponse;
import com.elearning.models.entities.Cart;
import com.elearning.models.entities.Course;
import com.elearning.models.entities.DiscountCode;
import com.elearning.models.entities.User;
import com.elearning.models.repositories.CartRepository;
import com.elearning.models.repositories.CourseRepository;
import com.elearning.models.repositories.DiscountCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CourseRepository courseRepository;
    private final DiscountCodeRepository discountCodeRepository;

    @Transactional
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(user);
                    cart.setCourses(new ArrayList<>());
                    cart.setDiscountCode(null);
                    return cartRepository.save(cart);
                });
    }

    @Transactional
    public void addCourseToCart(User user, Long courseId) {
        Cart cart = getOrCreateCart(user);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "Khóa học không tồn tại"));

        if (!cart.getCourses().contains(course)) {
            cart.getCourses().add(course);
            cartRepository.save(cart);
        }
    }

    @Transactional
    public void applyDiscountCode(User user, String code) {
        Cart cart = getOrCreateCart(user);
        DiscountCode discountCode = discountCodeRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(400, "Mã giảm giá không hợp lệ hoặc không tồn tại"));

        if (discountCode.getActive() != null && !discountCode.getActive()) {
            throw new BusinessException(400, "Mã giảm giá đã hết hạn hoặc không khả dụng");
        }

        cart.setDiscountCode(discountCode);
        cartRepository.save(cart);
    }

    @Transactional(readOnly = true)
    public CartPriceResponse calculateCartPrice(User user) {
        Cart cart = getOrCreateCart(user);
        
        double totalOriginalPrice = 0.0;
        for (Course course : cart.getCourses()) {
            if (course.getPrice() != null) {
                totalOriginalPrice += course.getPrice();
            }
        }

        double discountAmount = 0.0;
        String appliedCode = null;

        if (cart.getDiscountCode() != null) {
            DiscountCode discountCode = cart.getDiscountCode();
            appliedCode = discountCode.getCode();

            // Validate number of courses rule
            if (cart.getCourses().size() < discountCode.getMinCoursesRequired()) {
                throw new BusinessException(400, "Phải mua ít nhất " + discountCode.getMinCoursesRequired() + " khóa học để áp dụng mã này");
            }

            // Calculate percentage discount
            double percentageDiscount = totalOriginalPrice * (discountCode.getDiscountPercentage() / 100.0);
            
            // Limit to maxDiscountAmount
            discountAmount = Math.min(percentageDiscount, discountCode.getMaxDiscountAmount());
        }

        double finalPrice = Math.max(0.0, totalOriginalPrice - discountAmount);

        return CartPriceResponse.builder()
                .totalOriginalPrice(totalOriginalPrice)
                .discountAmount(discountAmount)
                .finalPrice(finalPrice)
                .appliedCode(appliedCode)
                .build();
    }

    @Transactional
    public void clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cart.getCourses().clear();
        cart.setDiscountCode(null);
        cartRepository.save(cart);
    }
}
