package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserIdOrderByDateDesc(Long userId);
    List<Expense> findByTripId(Long tripId);
    List<Expense> findByUserIdAndTripId(Long userId, Long tripId);
}

