package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Delay;
import com.budgetgo.backend.repository.DelayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/itinerary")
public class ItineraryController {

    @Autowired
    private DelayRepository delayRepository;

    @Autowired
    private com.budgetgo.backend.repository.TripMemberRepository tripMemberRepository;

    @GetMapping("/delays/{tripId}")
    public ResponseEntity<?> getDelays(@PathVariable Long tripId, @RequestParam(required = false) Long userId) {
        // Access Control
        if (userId != null) {
            boolean isMember = tripMemberRepository.existsByTripIdAndUserIdAndStatus(tripId, userId, "accepted");
            if (!isMember) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }
        }
        return ResponseEntity.ok(delayRepository.findByTripId(tripId));
    }

    @PostMapping("/delay")
    public ResponseEntity<?> reportDelay(@RequestBody Delay delay) { // Needs userId in Delay entity ideally, but
                                                                     // relying on frontend for now
        try {
            Delay savedDelay = delayRepository.save(delay);
            return ResponseEntity.ok(savedDelay);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to report delay"));
        }
    }
}
