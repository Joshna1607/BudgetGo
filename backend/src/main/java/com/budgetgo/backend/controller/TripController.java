package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Trip;
import com.budgetgo.backend.repository.TripRepository;
import com.budgetgo.backend.service.BudgetValidationService;
import com.budgetgo.backend.service.GeminiService;
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
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private com.budgetgo.backend.repository.TripRepository tripRepository;

    @Autowired
    private com.budgetgo.backend.repository.UserRepository userRepository;

    @Autowired
    private com.budgetgo.backend.service.GeminiService geminiService;

    @Autowired
    private com.budgetgo.backend.service.BudgetValidationService budgetValidationService;

    @PostMapping
    public ResponseEntity<?> createTrip(@Valid @RequestBody TripRequest request) {
        try {
            LocalDate start = LocalDate.parse(request.startDate());
            LocalDate end = LocalDate.parse(request.endDate());
            int days = (int) java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;

            // Validate Budget Logic
            var validation = budgetValidationService.validate(
                    request.destination(), days, request.budget(), request.travelers());

            if (!validation.isFeasible()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", validation.getMessage()));
            }

            Trip trip = new Trip();
            trip.setTripName(request.tripName());
            trip.setOrigin(request.origin());
            trip.setDestination(request.destination());
            trip.setStartDate(start);
            trip.setEndDate(end);
            trip.setBudget(request.budget());
            trip.setTravelers(request.travelers());
            trip.setDescription(request.description());
            trip.setMood(request.mood());
            trip.setUserId(request.userId());
            trip.setStatus(request.status() != null ? request.status() : "Planned");

            Trip savedTrip = tripRepository.save(trip);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTrip);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create trip: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Trip>> getAllTrips(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return ResponseEntity.ok(tripRepository.findByUserId(userId)); // Assuming findByUserId exists
        }
        return ResponseEntity.ok(tripRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@PathVariable Long id) {
        Optional<Trip> trip = tripRepository.findById(id);
        return trip.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrip(@PathVariable Long id, @Valid @RequestBody TripRequest request) {
        return tripRepository.findById(id).map(trip -> {
            trip.setTripName(request.tripName());
            trip.setOrigin(request.origin());
            trip.setDestination(request.destination());
            trip.setStartDate(LocalDate.parse(request.startDate()));
            trip.setEndDate(LocalDate.parse(request.endDate()));
            trip.setBudget(request.budget());
            trip.setTravelers(request.travelers());
            trip.setDescription(request.description());
            trip.setMood(request.mood());
            trip.setStatus(request.status());

            Trip updatedTrip = tripRepository.save(trip);
            return ResponseEntity.ok(updatedTrip);
        }).orElse(ResponseEntity.notFound().build()); // Logic for ResponseEntity<?>
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrip(@PathVariable Long id) {
        if (!tripRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tripRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Trip deleted successfully"));
    }

    @PostMapping("/generate-plan")
    public ResponseEntity<?> generatePlan(@RequestBody GeneratePlanRequest request) {
        try {
            // 1. First Intelligence Layer: Rule-based Validation
            var validation = budgetValidationService.validate(
                    request.destination(), request.days(), request.budget(), request.travelers());

            if (!validation.isFeasible()) {
                // Return immediate feedback without burning AI quota for obvious cases
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("is_feasible", false);
                response.put("feasibility_message", validation.getMessage());

                Map<String, Object> alts = new java.util.HashMap<>();
                alts.put("nearby_destinations", java.util.Collections.emptyList()); // Service could be enhanced to
                                                                                    // return these
                alts.put("trip_scope_adjustments", validation.getSuggestions());
                alts.put("budget_recommendation", "Consider increasing budget.");

                response.put("alternatives", alts);

                // Optional: usage of AI for specific alternatives if needed, but for now
                // specific rules are faster
                return ResponseEntity.ok(response);
            }

            // 2. If valid or borderline, let AI handle the details
            double totalBudget = request.budget();
            double travelBudget, hotelBudget, foodBudget, activityBudget;

            if (request.days() <= 1) {
                // 1-Day Trip: No Hotel needed. Prioritize Travel & Food.
                hotelBudget = 0;
                travelBudget = totalBudget * 0.45;
                foodBudget = totalBudget * 0.35;
                activityBudget = totalBudget * 0.20;
            } else {
                // Multi-day Trip: Standard allocation
                travelBudget = totalBudget * 0.30;
                hotelBudget = totalBudget * 0.35;
                foodBudget = totalBudget * 0.25;
                activityBudget = totalBudget * 0.10;
            }

            Map<String, Object> plan = geminiService.generateTripPlan(
                    request.origin(), request.destination(), request.days(),
                    request.budget(), request.travelers(), request.mood(),
                    travelBudget, hotelBudget, foodBudget, activityBudget);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    public record GeneratePlanRequest(
            @NotBlank String origin,
            @NotBlank String destination,
            @NotNull Integer days,
            @NotNull Double budget,
            @NotNull Integer travelers,
            String mood) {
    }

    public record TripRequest(
            @NotBlank String tripName,
            @NotBlank String origin,
            @NotBlank String destination,
            @NotBlank String startDate,
            @NotBlank String endDate,
            @NotNull Double budget,
            @NotNull Integer travelers,
            String description,
            String mood,
            @NotNull Long userId,
            String status) {
    }
}
