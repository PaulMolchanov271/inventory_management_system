package org.example.inventory_management_system.controller;

import org.example.inventory_management_system.entity.Product;
import org.example.inventory_management_system.repository.ProductRepository;
import org.example.inventory_management_system.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {
    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;

    public ProductController(ProductRepository productRepository,
                             TransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (transactionRepository.existsByProduct_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This product has transaction history and cannot be deleted.");
        }
        productRepository.delete(product);
    }
}
