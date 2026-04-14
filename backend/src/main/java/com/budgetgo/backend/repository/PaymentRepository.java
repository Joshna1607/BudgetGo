package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Payment> findByTripId(Long tripId);
    List<Payment> findByBookingId(Long bookingId);
}

