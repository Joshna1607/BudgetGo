package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Payment;
import com.budgetgo.backend.repository.PaymentRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private com.budgetgo.backend.service.RazorpayService razorpayService;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long tripId,
            @RequestParam(required = false) Long bookingId) {
        if (userId != null) {
            return ResponseEntity.ok(paymentRepository.findByUserIdOrderByCreatedAtDesc(userId));
        } else if (tripId != null) {
            return ResponseEntity.ok(paymentRepository.findByTripId(tripId));
        } else if (bookingId != null) {
            return ResponseEntity.ok(paymentRepository.findByBookingId(bookingId));
        }
        return ResponseEntity.ok(paymentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);
        return payment.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createPayment(@Valid @RequestBody PaymentRequest request) {
        try {
            String orderId = request.orderId();
            if (orderId == null || orderId.isEmpty()) {
                // Generate Razorpay Order
                orderId = razorpayService.createOrder(request.amount());
            }

            Payment payment = new Payment(
                    request.paymentId(),
                    orderId,
                    request.amount(),
                    request.method(),
                    request.status() != null ? request.status() : "Pending",
                    request.userId(),
                    request.bookingId(),
                    request.tripId());
            payment.setSignature(request.signature());
            Payment savedPayment = paymentRepository.save(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPayment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create payment: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Payment payment = paymentOpt.get();
            if (request.paymentId() != null) {
                payment.setPaymentId(request.paymentId());
            }
            if (request.orderId() != null) {
                payment.setOrderId(request.orderId());
            }
            payment.setAmount(request.amount());
            payment.setMethod(request.method());
            if (request.status() != null) {
                payment.setStatus(request.status());
            }
            if (request.signature() != null) {
                payment.setSignature(request.signature());
            }

            Payment updatedPayment = paymentRepository.save(payment);
            return ResponseEntity.ok(updatedPayment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to update payment: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        if (!paymentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        paymentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Payment deleted successfully"));
    }

    public record PaymentRequest(
            String paymentId,
            String orderId,
            @NotNull Double amount,
            @NotBlank String method,
            String status,
            @NotNull Long userId,
            Long bookingId,
            Long tripId,
            String signature) {
    }
}
