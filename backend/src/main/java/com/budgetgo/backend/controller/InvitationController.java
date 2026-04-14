package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Invitation;
import com.budgetgo.backend.entity.Trip;
import com.budgetgo.backend.entity.TripMember;
import com.budgetgo.backend.entity.User;
import com.budgetgo.backend.repository.InvitationRepository;
import com.budgetgo.backend.repository.TripMemberRepository;
import com.budgetgo.backend.repository.TripRepository;
import com.budgetgo.backend.repository.UserRepository;
import com.budgetgo.backend.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    // Trigger Recompile
    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @Autowired
    private EmailService emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(@Valid @RequestBody SendInvitationRequest request) {
        try {
            // Verify trip exists and user is owner
            Optional<Trip> tripOpt = tripRepository.findById(request.tripId());
            if (tripOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Trip not found"));
            }

            Trip trip = tripOpt.get();

            // Check if user is already a member
            Optional<User> existingUserOpt = userRepository.findByEmail(request.email());
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();
                if (tripMemberRepository.existsByTripIdAndUserId(request.tripId(), existingUser.getId())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "User is already a member of this trip"));
                }
            }

            // Check if invitation already exists
            List<Invitation> existingInvitations = invitationRepository.findByEmailAndStatus(
                    request.email(), "pending");
            for (Invitation inv : existingInvitations) {
                if (inv.getTripId().equals(request.tripId()) && !inv.isExpired()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Invitation already sent to this email"));
                }
            }

            // Get inviter name
            Optional<User> inviterOpt = userRepository.findById(request.invitedBy());
            String inviterName = inviterOpt.map(User::getName).orElse("Someone");

            // Create invitation
            Invitation invitation = new Invitation(request.tripId(), request.invitedBy(), request.email());
            Invitation savedInvitation = invitationRepository.save(invitation);

            // Send email
            String invitationLink = frontendUrl + "/invite/accept?token=" + savedInvitation.getToken();
            emailService.sendInvitationEmail(
                    request.email(),
                    trip.getTripName(),
                    invitationLink,
                    inviterName);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Invitation sent successfully",
                    "invitationId", savedInvitation.getId(),
                    "token", savedInvitation.getToken()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send invitation: " + e.getMessage()));
        }
    }

    @GetMapping("/token/{token}")
    public ResponseEntity<?> getInvitationByToken(@PathVariable String token) {
        Optional<Invitation> invitationOpt = invitationRepository.findByToken(token);
        if (invitationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Invitation not found"));
        }

        Invitation invitation = invitationOpt.get();

        if (invitation.isExpired()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invitation has expired"));
        }

        if (!"pending".equals(invitation.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invitation has already been used"));
        }

        // Get trip details
        Optional<Trip> tripOpt = tripRepository.findById(invitation.getTripId());
        Optional<User> inviterOpt = userRepository.findById(invitation.getInvitedBy());

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("invitationId", invitation.getId());
        response.put("email", invitation.getEmail());
        response.put("tripId", invitation.getTripId());
        response.put("tripName", tripOpt.map(Trip::getTripName).orElse("Unknown Trip"));
        response.put("invitedBy", inviterOpt.map(User::getName).orElse("Someone"));
        response.put("expiresAt", invitation.getExpiresAt().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        try {
            Optional<Invitation> invitationOpt = invitationRepository.findByToken(request.token());
            if (invitationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Invitation not found"));
            }

            Invitation invitation = invitationOpt.get();

            if (invitation.isExpired()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invitation has expired"));
            }

            if (!"pending".equals(invitation.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invitation has already been used"));
            }

            // Verify email matches
            if (!invitation.getEmail().equalsIgnoreCase(request.email())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email does not match invitation"));
            }

            // Find or create user
            Optional<User> userOpt = userRepository.findByEmail(request.email());
            User user;
            if (userOpt.isEmpty()) {
                // This should not happen if registration was done first
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "User not found. Please register first."));
            }
            user = userOpt.get();

            // Add user to trip members or update existing pending member
            Optional<TripMember> existingMemberOpt = tripMemberRepository.findByTripIdAndUserId(invitation.getTripId(),
                    user.getId());

            if (existingMemberOpt.isPresent()) {
                TripMember member = existingMemberOpt.get();
                if ("pending".equalsIgnoreCase(member.getStatus())) {
                    member.setStatus("accepted");
                    tripMemberRepository.save(member);
                }
            } else {
                TripMember tripMember = new TripMember(
                        invitation.getTripId(),
                        user.getId(),
                        "member",
                        "accepted"); // Set status to accepted immediately
                tripMemberRepository.save(tripMember);
            }

            // Update invitation status
            invitation.setStatus("accepted");
            invitation.setAcceptedAt(java.time.LocalDateTime.now());
            invitationRepository.save(invitation);

            // Send Confirmation Email
            String tripName = tripRepository.findById(invitation.getTripId())
                    .map(Trip::getTripName).orElse("Trip");
            emailService.sendInvitationAcceptedEmail(user.getEmail(), tripName);

            return ResponseEntity.ok(Map.of(
                    "message", "Successfully joined the trip",
                    "tripId", invitation.getTripId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to accept invitation: " + e.getMessage()));
        }
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        try {
            Optional<Invitation> invitationOpt = invitationRepository.findByToken(request.token());
            if (invitationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Invitation not found"));
            }

            Invitation invitation = invitationOpt.get();

            if (invitation.isExpired()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invitation has expired"));
            }

            if (!"pending".equals(invitation.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invitation has already been used"));
            }

            // Verify email matches
            if (!invitation.getEmail().equalsIgnoreCase(request.email())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email does not match invitation"));
            }

            // Update invitation status
            invitation.setStatus("rejected");
            invitationRepository.save(invitation);

            return ResponseEntity.ok(Map.of("message", "Invitation rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reject invitation: " + e.getMessage()));
        }
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Invitation>> getTripInvitations(@PathVariable Long tripId) {
        return ResponseEntity.ok(invitationRepository.findByTripId(tripId));
    }

    public record SendInvitationRequest(
            @NotNull Long tripId,
            @NotNull Long invitedBy,
            @NotBlank @Email String email) {
    }

    public record AcceptInvitationRequest(
            @NotBlank String token,
            @NotBlank @Email String email) {
    }
}
