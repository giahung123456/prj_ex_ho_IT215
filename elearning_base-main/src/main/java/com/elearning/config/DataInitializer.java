package com.elearning.config;

import com.elearning.models.entities.Course;
import com.elearning.models.entities.DiscountCode;
import com.elearning.models.entities.User;
import com.elearning.models.repositories.CourseRepository;
import com.elearning.models.repositories.DiscountCodeRepository;
import com.elearning.models.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Users
        User instructor = userRepository.findByEmail("instructor@gmail.com").orElseGet(() -> {
            User user = new User();
            user.setEmail("instructor@gmail.com");
            user.setPassword(passwordEncoder.encode("123456"));
            user.setFullName("Test Instructor");
            user.setRole("INSTRUCTOR");
            return userRepository.save(user);
        });

        User student = userRepository.findByEmail("student@gmail.com").orElseGet(() -> {
            User user = new User();
            user.setEmail("student@gmail.com");
            user.setPassword(passwordEncoder.encode("123456"));
            user.setFullName("Test Student");
            user.setRole("STUDENT");
            return userRepository.save(user);
        });

        // 2. Seed Courses
        if (courseRepository.count() == 0) {
            Course course1 = new Course();
            course1.setTitle("Spring Boot Course");
            course1.setDescription("Learn Spring Boot from scratch");
            course1.setPrice(1500000.0); // 1,500,000 VNĐ
            course1.setInstructor(instructor);
            courseRepository.save(course1);

            Course course2 = new Course();
            course2.setTitle("React Course");
            course2.setDescription("Learn React JS for Frontend");
            course2.setPrice(1200000.0); // 1,200,000 VNĐ
            course2.setInstructor(instructor);
            courseRepository.save(course2);

            Course course3 = new Course();
            course3.setTitle("Intro to CSS");
            course3.setDescription("Learn basic CSS styling");
            course3.setPrice(500000.0); // 500,000 VNĐ
            course3.setInstructor(instructor);
            courseRepository.save(course3);
        }

        // 3. Seed Discount Codes
        if (discountCodeRepository.findByCode("BLACKFRIDAY").isEmpty()) {
            DiscountCode voucher = new DiscountCode();
            voucher.setCode("BLACKFRIDAY");
            voucher.setDiscountPercentage(20.0); // 20%
            voucher.setMaxDiscountAmount(500000.0); // Chặn trần 500,000 VNĐ
            voucher.setMinCoursesRequired(2); // Tối thiểu 2 khóa học
            voucher.setActive(true);
            discountCodeRepository.save(voucher);
        }
    }
}
