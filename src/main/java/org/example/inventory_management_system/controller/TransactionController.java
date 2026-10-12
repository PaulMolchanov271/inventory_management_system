package org.example.inventory_management_system.controller;

import org.example.inventory_management_system.repository.TransactionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory/transactions")
@PreAuthorize("hasRole('ADMIN')")
public class TransactionController {
    private final TransactionRepository transactionRepository;

    public TransactionController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @GetMapping
    public List<TransactionResponse> getTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(tx -> new TransactionResponse(
                        tx.getId(),
                        tx.getProduct() == null ? null : tx.getProduct().getName(),
                        tx.getType() == null ? null : tx.getType().name(),
                        tx.getQuantity(),
                        tx.getPerformedBy() == null ? null : tx.getPerformedBy().getUsername(),
                        tx.getCreatedAt()))
                .toList();
    }

    public record TransactionResponse(Long id, String productName, String type,
                                      int quantity, String username, LocalDateTime createdAt) {}
}