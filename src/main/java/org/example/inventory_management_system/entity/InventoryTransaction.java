package org.example.inventory_management_system.entity;

import jakarta.persistence.*;
import org.example.inventory_management_system.enums.TransactionType;

import java.time.LocalDateTime;

@Entity
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    private LocalDateTime createdAt;

    @ManyToOne
    private Product product;
}
