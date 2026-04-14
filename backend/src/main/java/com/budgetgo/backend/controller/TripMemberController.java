package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Trip;
import com.budgetgo.backend.entity.TripMember;
import com.budgetgo.backend.entity.User;
import com.budgetgo.backend.repository.TripMemberRepository;
import com.budgetgo.backend.repository.TripRepository;
import com.budgetgo.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-members")
public class TripMemberController {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @PostMapping("/add")
    public ResponseEntity<?> addMember(@RequestBody AddMemberRequest request) {
        try {
            Long tripId = request.tripId();
            String email = request.email();

            Optional<Trip> tripOpt = tripRepository.findById(tripId);
            if (tripOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Trip not found"));
            }
            Trip trip = tripOpt.get();

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "User with this email not found. They must register first."));
            }
            User userToAdd = userOpt.get();

            // 1. Check if Owner
            if (trip.getUserId().equals(userToAdd.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is the owner of this trip"));
            }

            // 2. Check if already added
            if (tripMemberRepository.findByTripIdAndUserId(tripId, userToAdd.getId()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is already a member of this trip"));
            }

            // 3. CHECK TRAVELER LIMIT
            // Total capacity = trip.getTravelers()
            // Used capacity = 1 (Owner) + count(Members)
            long currentMembers = tripMemberRepository.countByTripId(tripId);
            long totalParticipants = 1 + currentMembers;

            if (totalParticipants >= trip.getTravelers()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Trip is full! Maximum travelers limit (" + trip.getTravelers() + ") reached."));
            }

            // Add Member
            TripMember member = new TripMember();
            member.setTripId(tripId);
            member.setUserId(userToAdd.getId());
            member.setStatus("accepted"); // Auto-accept for now, or use 'pending' if invitation system

            tripMemberRepository.save(member);

            return ResponseEntity.ok(Map.of("message", "Member added successfully", "member", member));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal Server Error: " + e.getMessage()));
        }
    }

    // DTO
    public record AddMemberRequest(Long tripId, String email) {
    }
}
