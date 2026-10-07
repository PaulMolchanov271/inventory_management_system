package org.example.inventory_management_system.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException() {
        super("Insufficient stock");
    }
}
