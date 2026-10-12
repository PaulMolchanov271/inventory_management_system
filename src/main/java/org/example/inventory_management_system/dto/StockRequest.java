package org.example.inventory_management_system.dto;

import jakarta.validation.constraints.Min;

public class StockRequest {

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
