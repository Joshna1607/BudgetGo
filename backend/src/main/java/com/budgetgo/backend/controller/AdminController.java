package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Booking;
import com.budgetgo.backend.entity.Payment;
import com.budgetgo.backend.entity.User;
import com.budgetgo.backend.repository.BookingRepository;
import com.budgetgo.backend.repository.PaymentRepository;
import com.budgetgo.backend.repository.TripRepository;
import com.budgetgo.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    // --- USER MANAGEMENT ---

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDTO> userDTOs = users.stream()
                .map(user -> new UserDTO(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole(),
                        user.isActive(),
                        user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                        user.getLastLogin() != null ? user.getLastLogin().toString() : null))
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setActive(!user.isActive());
            userRepository.save(user);
            return ResponseEntity
                    .ok(Map.of("success", true, "message", "User status updated", "active", user.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return userRepository.findById(id).map(user -> {
            String newRole = payload.get("role");
            if (newRole != null) {
                user.setRole(newRole);
                userRepository.save(user);
                return ResponseEntity
                        .ok(Map.of("success", true, "message", "User role updated", "role", user.getRole()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    // --- TRIP MONITORING ---

    @GetMapping("/trips")
    public ResponseEntity<List<TripDTO>> getAllTrips() {
        List<com.budgetgo.backend.entity.Trip> trips = tripRepository.findAll();
        List<TripDTO> tripDTOs = trips.stream().map(trip -> {
            // Fetch User info for "Created By"
            String createdBy = userRepository.findById(trip.getUserId())
                    .map(User::getName)
                    .orElse("Unknown User");

            return new TripDTO(
                    trip.getId(),
                    trip.getTripName(),
                    trip.getDestination(),
                    trip.getStartDate().toString(),
                    trip.getEndDate().toString(),
                    trip.getBudget(),
                    trip.getTravelers(),
                    trip.getStatus(),
                    createdBy);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(tripDTOs);
    }

    // --- BOOKING MONITORING ---

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        List<BookingDTO> bookingDTOs = bookings.stream()
                .map(b -> new BookingDTO(
                        b.getId(),
                        b.getType(),
                        b.getName(),
                        b.getLocation(),
                        b.getCheckIn() != null ? b.getCheckIn().toString() : "",
                        b.getPrice(),
                        b.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(bookingDTOs);
    }

    // --- PAYMENT MONITORING ---

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        List<PaymentDTO> paymentDTOs = payments.stream()
                .map(p -> new PaymentDTO(
                        p.getId(),
                        p.getAmount(),
                        p.getMethod(),
                        p.getStatus(),
                        p.getCreatedAt() != null ? p.getCreatedAt().toString() : ""))
                .collect(Collectors.toList());
        return ResponseEntity.ok(paymentDTOs);
    }

    // --- ANALYTICS ---

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalTrips = tripRepository.count();
        long totalBookings = bookingRepository.count();

        double totalRevenue = paymentRepository.findAll().stream()
                .filter(p -> "Success".equalsIgnoreCase(p.getStatus()) || "completed".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalTrips", totalTrips,
                "totalBookings", totalBookings,
                "totalRevenue", totalRevenue));
    }

    // DTOs
    public record UserDTO(Long id, String name, String email, String role, boolean active, String createdAt,
            String lastLogin) {
    }

    public record TripDTO(Long id, String tripName, String destination, String startDate, String endDate, Double budget,
            Integer travelers, String status, String createdBy) {
    }

    public record BookingDTO(Long id, String type, String name, String location, String checkIn, Double price,
            String status) {
    }

    public record PaymentDTO(Long id, Double amount, String method, String status, String date) {
    }
}
