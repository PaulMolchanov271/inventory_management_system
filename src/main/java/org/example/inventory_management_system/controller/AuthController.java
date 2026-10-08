package org.example.inventory_management_system.controller;

import jakarta.validation.Valid;
import org.example.inventory_management_system.dto.AuthResponse;
import org.example.inventory_management_system.dto.RegisterRequest;
import org.example.inventory_management_system.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    @GetMapping("/me")
    public AuthResponse currentUser(Authentication authentication) {

        return authService.getCurrentUser(
                authentication.getName()
        );
    }
}
