package com.example.prj_exprho.config;

import com.example.prj_exprho.entity.Role;
import com.example.prj_exprho.entity.User;
import com.example.prj_exprho.repository.RoleRepository;
import com.example.prj_exprho.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Roles
        Role adminRole = roleRepository.findByRoleName("ADMIN").orElseGet(() -> {
            Role role = Role.builder()
                    .roleName("ADMIN")
                    .description("Administrator Role")
                    .build();
            return roleRepository.save(role);
        });

        Role storekeeperRole = roleRepository.findByRoleName("STOREKEEPER").orElseGet(() -> {
            Role role = Role.builder()
                    .roleName("STOREKEEPER")
                    .description("Storekeeper Role")
                    .build();
            return roleRepository.save(role);
        });

        Role salesRole = roleRepository.findByRoleName("SALES").orElseGet(() -> {
            Role role = Role.builder()
                    .roleName("SALES")
                    .description("Sales Role")
                    .build();
            return roleRepository.save(role);
        });

        Role customerRole = roleRepository.findByRoleName("CUSTOMER").orElseGet(() -> {
            Role role = Role.builder()
                    .roleName("CUSTOMER")
                    .description("Customer Role")
                    .build();
            return roleRepository.save(role);
        });

        // 2. Seed Admin
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .fullName("System Administrator")
                    .phone("0123456789")
                    .passwordHash(passwordEncoder.encode("AdminPassword123"))
                    .status("ACTIVE")
                    .failedAttempts(0)
                    .roles(new HashSet<>(Collections.singletonList(adminRole)))
                    .build();
            userRepository.save(admin);
        }

        // 3. Seed Storekeeper
        if (userRepository.findByUsername("storekeeper").isEmpty()) {
            User storekeeper = User.builder()
                    .username("storekeeper")
                    .email("storekeeper@example.com")
                    .fullName("Default Storekeeper")
                    .phone("0987654321")
                    .passwordHash(passwordEncoder.encode("StorekeeperPassword123"))
                    .status("ACTIVE")
                    .failedAttempts(0)
                    .roles(new HashSet<>(Collections.singletonList(storekeeperRole)))
                    .build();
            userRepository.save(storekeeper);
        }

        // 4. Seed Sales
        if (userRepository.findByUsername("sales").isEmpty()) {
            User sales = User.builder()
                    .username("sales")
                    .email("sales@example.com")
                    .fullName("Default Sales")
                    .phone("0111222333")
                    .passwordHash(passwordEncoder.encode("SalesPassword123"))
                    .status("ACTIVE")
                    .failedAttempts(0)
                    .roles(new HashSet<>(Collections.singletonList(salesRole)))
                    .build();
            userRepository.save(sales);
        }
    }
}
