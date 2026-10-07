package org.example.inventory_management_system.service;


import org.example.inventory_management_system.entity.Product;
import org.example.inventory_management_system.exception.InsufficientStockException;
import org.example.inventory_management_system.exception.ProductNotFoundException;
import org.example.inventory_management_system.repository.ProductRepository;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {

    private final ProductRepository productRepository;

    public InventoryService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product receive(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        product.setQuantity(product.getQuantity() + quantity);

        return productRepository.save(product);
    }

    public Product ship(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        if (product.getQuantity() < quantity) {
            throw new InsufficientStockException();
        }

        product.setQuantity(product.getQuantity() - quantity);

        return productRepository.save(product);
    }
}
