package org.example.inventory_management_system.service;

import org.example.inventory_management_system.dto.AuthResponse;
import org.example.inventory_management_system.dto.RegisterRequest;
import org.example.inventory_management_system.entity.User;
import org.example.inventory_management_system.enums.Role;
import org.example.inventory_management_system.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();

        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.EMPLOYEE);

        User savedUser = userRepository.save(user);

        return new AuthResponse(
                savedUser.getUsername(),
                savedUser.getRole()
        );
    }

    public AuthResponse getCurrentUser(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        return new AuthResponse(
                user.getUsername(),
                user.getRole()
        );
    }
}
