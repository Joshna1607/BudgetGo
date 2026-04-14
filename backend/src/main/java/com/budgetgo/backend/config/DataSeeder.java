package com.budgetgo.backend.config;

import com.budgetgo.backend.entity.User;
import com.budgetgo.backend.repository.UserRepository;
import com.budgetgo.backend.service.PasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordService passwordService;

    @Override
    public void run(String... args) {
        // Seed admin user if not exists
        if (!userRepository.existsByEmail("admin@budgetgo.com")) {
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail("admin@budgetgo.com");
            admin.setPassword("admin123"); // Will be hashed if using password service
            admin.setRole("admin");
            userRepository.save(admin);
            System.out.println("Admin user created: admin@budgetgo.com / admin123");
        }

        // Seed demo user if not exists
        if (!userRepository.existsByEmail("user@budgetgo.com")) {
            User user = new User();
            user.setName("Demo User");
            user.setEmail("user@budgetgo.com");
            user.setPassword("user123"); // Will be hashed if using password service
            user.setRole("user");
            userRepository.save(user);
            System.out.println("Demo user created: user@budgetgo.com / user123");
        }
    }
}

