package org.example.inventory_management_system.controller;

import org.example.inventory_management_system.entity.Product;
import org.example.inventory_management_system.dto.StockRequest;
import org.example.inventory_management_system.service.InventoryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/products/{id}/receive")
    public Product receive(
            @PathVariable Long id,
            @RequestBody StockRequest request) {

        return inventoryService.receive(id, request.getQuantity());
    }
}
