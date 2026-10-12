package org.example.inventory_management_system.repository;

import org.example.inventory_management_system.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findAllByOrderByCreatedAtDesc();

    boolean existsByProduct_Id(Long productId);
}