package org.example.inventory_management_system.dto;

import org.example.inventory_management_system.enums.Role;

public class AuthResponse {

    private String username;
    private Role role;

    public AuthResponse(String username, Role role) {
        this.username = username;
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public Role getRole() {
        return role;
    }
}
