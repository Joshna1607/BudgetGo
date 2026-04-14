package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Expense;
import com.budgetgo.backend.repository.ExpenseRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private com.budgetgo.backend.repository.UserRepository userRepository;

    @Autowired
    private com.budgetgo.backend.repository.TripMemberRepository tripMemberRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @GetMapping
    public ResponseEntity<?> getAllExpenses(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long tripId) {

        if (tripId != null) {
            // Access Control: Check if user is a member of the trip
            // Note: In a real app, we'd get the current user from SecurityContext.
            // Here, we rely on the frontend passing the userId if we want to validte.
            // If userId is missing, we might assume public read or (better) block it.
            // For MVP, if userId is provided, we check.
            if (userId != null) {
                boolean isMember = tripMemberRepository.existsByTripIdAndUserIdAndStatus(tripId, userId, "accepted");
                if (!isMember) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
                }
            }
            List<Expense> expenses = expenseRepository.findByTripId(tripId);
            return ResponseEntity.ok(calculateSplit(expenses));
        } else if (userId != null) {
            return ResponseEntity.ok(expenseRepository.findByUserIdOrderByDateDesc(userId));
        }
        return ResponseEntity.ok(expenseRepository.findAll());
    }

    // Helper to add split info to response
    private Map<String, Object> calculateSplit(List<Expense> expenses) {
        double totalSpent = expenses.stream().mapToDouble(Expense::getAmount).sum();

        // Group by Payer
        Map<String, Double> paidByMap = expenses.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        Expense::getPaidBy,
                        java.util.stream.Collectors.summingDouble(Expense::getAmount)));

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("expenses", expenses);
        response.put("totalSpent", totalSpent);
        response.put("paidBySummary", paidByMap);
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        Optional<Expense> expense = expenseRepository.findById(id);
        return expense.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@Valid @RequestBody ExpenseRequest request) {
        try {
            // Access Control
            boolean isMember = tripMemberRepository.existsByTripIdAndUserIdAndStatus(
                    request.tripId(), request.userId(), "accepted");
            if (!isMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You are not a member of this trip"));
            }

            Expense expense = new Expense(
                    request.category(),
                    request.amount(),
                    LocalDate.parse(request.date()),
                    request.description(),
                    request.splitAmong() != null ? request.splitAmong() : 1,
                    request.paidBy(),
                    request.tripId(),
                    request.userId());
            Expense savedExpense = expenseRepository.save(expense);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedExpense);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create expense: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        Optional<Expense> expenseOpt = expenseRepository.findById(id);
        if (expenseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Access Control (Check if user trying to edit is the one who created it or is
            // admin?
            // For MVP, just check membership)
            boolean isMember = tripMemberRepository.existsByTripIdAndUserIdAndStatus(
                    request.tripId(), request.userId(), "accepted");
            if (!isMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }

            Expense expense = expenseOpt.get();
            expense.setCategory(request.category());
            expense.setAmount(request.amount());
            expense.setDate(LocalDate.parse(request.date()));
            expense.setDescription(request.description());
            expense.setSplitAmong(request.splitAmong() != null ? request.splitAmong() : 1);
            expense.setPaidBy(request.paidBy());

            Expense updatedExpense = expenseRepository.save(expense);
            return ResponseEntity.ok(updatedExpense);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to update expense: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id) {
        if (!expenseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        expenseRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Expense deleted successfully"));
    }

    public record ExpenseRequest(
            @NotBlank String category,
            @NotNull Double amount,
            @NotBlank String date,
            @NotBlank String description,
            Integer splitAmong,
            String paidBy,
            Long tripId,
            @NotNull Long userId) {
    }
}
