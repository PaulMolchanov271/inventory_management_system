package org.example.inventory_management_system.entity;

import jakarta.persistence.*;
import org.example.inventory_management_system.entity.Product;
import org.example.inventory_management_system.entity.User;
import org.example.inventory_management_system.enums.TransactionType;

import java.time.LocalDateTime;

@Entity
public class InventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "performed_by_user_id", nullable = false)
    private User performedBy;

    private int quantity;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    private LocalDateTime createdAt;

    @ManyToOne
    private Product product;

    public Long getId() { return id; }
    public User getPerformedBy() { return performedBy; }
    public int getQuantity() { return quantity; }
    public TransactionType getType() { return type; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Product getProduct() { return product; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public void setType(TransactionType type) { this.type = type; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setProduct(Product product) { this.product = product; }
}
