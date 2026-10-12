package org.example.inventory_management_system.service;


import jakarta.transaction.Transactional;
import org.example.inventory_management_system.entity.InventoryTransaction;
import org.example.inventory_management_system.entity.Product;
import org.example.inventory_management_system.entity.User;
import org.example.inventory_management_system.enums.TransactionType;
import org.example.inventory_management_system.exception.InsufficientStockException;
import org.example.inventory_management_system.exception.ProductNotFoundException;
import org.example.inventory_management_system.repository.ProductRepository;
import org.example.inventory_management_system.repository.TransactionRepository;
import org.example.inventory_management_system.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public InventoryService(
            ProductRepository productRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository

    ) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Product receive(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be greater than zero"
            );
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        product.setQuantity(product.getQuantity() + quantity);
        productRepository.save(product);

        saveTransaction(product, quantity, TransactionType.RECEIVE);

        return product;
    }

    @Transactional
    public Product ship(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be greater than zero"
            );
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        if (product.getQuantity() < quantity) {
            throw new InsufficientStockException();
        }

        product.setQuantity(product.getQuantity() - quantity);
        productRepository.save(product);

        saveTransaction(product, quantity, TransactionType.SHIP);

        return product;
    }

    private void saveTransaction(
            Product product,
            int quantity,
            TransactionType type
    ) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new IllegalStateException("User is not authenticated");
        }

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException("Current user not found")
                );

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(product);
        transaction.setQuantity(quantity);
        transaction.setType(type);
        transaction.setPerformedBy(user);

        transactionRepository.save(transaction);
    }
}