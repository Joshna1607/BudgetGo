package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Invitation;
import com.budgetgo.backend.entity.TripMember;
import com.budgetgo.backend.entity.User;
import com.budgetgo.backend.repository.InvitationRepository;
import com.budgetgo.backend.repository.TripMemberRepository;
import com.budgetgo.backend.repository.UserRepository;
import com.budgetgo.backend.service.JwtService;
import com.budgetgo.backend.service.PasswordService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordService passwordService;

  @Autowired
  private JwtService jwtService;

  @Autowired
  private InvitationRepository invitationRepository;

  @Autowired
  private TripMemberRepository tripMemberRepository;

  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
    try {
      Optional<User> userOpt = userRepository.findByEmail(request.email());

      if (userOpt.isEmpty()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid email or password"));
      }

      User user = userOpt.get();

      // For demo users, allow plain password check, otherwise verify hashed password
      boolean passwordValid = false;
      if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
        // Hashed password
        passwordValid = passwordService.verifyPassword(request.password(), user.getPassword());
      } else {
        // Plain password (for demo users)
        passwordValid = user.getPassword().equals(request.password());
      }

      if (!passwordValid) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid email or password"));
      }

      String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

      // Update Last Login
      user.setLastLogin(LocalDateTime.now());
      userRepository.save(user);

      LoginResponse response = new LoginResponse(
          user.getId(),
          user.getName(),
          user.getEmail(),
          user.getRole(),
          token);

      return ResponseEntity.ok(response);
    } catch (Throwable e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Critical error: " + e.getClass().getName() + ": " + e.getMessage()));
    }
  }

  @Autowired
  private com.budgetgo.backend.repository.OtpRepository otpRepository;

  // Trigger Recompile
  @Autowired
  private com.budgetgo.backend.service.EmailService emailService;

  @PostMapping("/send-otp")
  public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    if (email == null || email.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
    }

    // Generate OTP
    String otpCode = String.format("%06d", new java.util.Random().nextInt(999999));

    Optional<com.budgetgo.backend.entity.Otp> existingOtp = otpRepository.findByEmail(email);
    existingOtp.ifPresent(otp -> otpRepository.delete(otp));

    com.budgetgo.backend.entity.Otp otp = new com.budgetgo.backend.entity.Otp(
        email,
        otpCode,
        LocalDateTime.now().plusMinutes(10));
    otpRepository.save(otp);

    // Send Email
    emailService.sendOtpEmail(email, otpCode);

    return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    System.out.println("Processing registration for: " + request.email());
    try {
      if (request.otp() == null || request.otp().isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("error", "OTP is required"));
      }

      Optional<com.budgetgo.backend.entity.Otp> otpOpt = otpRepository.findByEmail(request.email());
      if (otpOpt.isEmpty() || !otpOpt.get().getOtpCode().equals(request.otp())) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP"));
      }

      if (otpOpt.get().isExpired()) {
        return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired"));
      }

      if (userRepository.existsByEmail(request.email())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "User with this email already exists"));
      }

      // Clean up OTP
      otpRepository.delete(otpOpt.get());

      if (request.password().length() < 6) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Password must be at least 6 characters"));
      }

      String hashedPassword = passwordService.hashPassword(request.password());
      String role = request.role() != null && !request.role().isEmpty() ? request.role() : "user";

      User newUser = new User(request.name(), request.email(), hashedPassword, role);
      User savedUser = userRepository.save(newUser);

      // Handle invitation if token is provided
      Long tripId = null;
      if (request.invitationToken() != null && !request.invitationToken().isEmpty()) {
        Optional<Invitation> invitationOpt = invitationRepository.findByToken(request.invitationToken());
        if (invitationOpt.isPresent()) {
          Invitation invitation = invitationOpt.get();

          // Verify email matches invitation
          if (invitation.getEmail().equalsIgnoreCase(savedUser.getEmail())
              && !invitation.isExpired()
              && "pending".equals(invitation.getStatus())) {

            // Add user to trip members
            if (!tripMemberRepository.existsByTripIdAndUserId(invitation.getTripId(), savedUser.getId())) {
              TripMember tripMember = new TripMember(
                  invitation.getTripId(),
                  savedUser.getId(),
                  "member",
                  "pending");
              tripMemberRepository.save(tripMember);
              tripId = invitation.getTripId();
            }

            // Mark invitation as accepted
            invitation.setStatus("accepted");
            invitation.setAcceptedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
          }
        }
      }

      String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

      LoginResponse response = new LoginResponse(
          savedUser.getId(),
          savedUser.getName(),
          savedUser.getEmail(),
          savedUser.getRole(),
          token);

      Map<String, Object> responseBody = Map.of(
          "id", response.id(),
          "name", response.name(),
          "email", response.email(),
          "role", response.role(),
          "token", response.token());

      if (tripId != null) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "user", responseBody,
                "tripId", tripId,
                "message", "Registration successful and added to trip"));
      }

      return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Registration failed: " + e.getMessage()));
    }
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    if (email == null || email.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
    }

    Optional<User> userOpt = userRepository.findByEmail(email);
    if (userOpt.isEmpty()) {
      // Don't reveal user existence
      return ResponseEntity.ok(Map.of("message", "If an account exists, an OTP has been sent."));
    }

    // Generate OTP
    String otpCode = String.format("%06d", new java.util.Random().nextInt(999999));

    Optional<com.budgetgo.backend.entity.Otp> existingOtp = otpRepository.findByEmail(email);
    existingOtp.ifPresent(otp -> otpRepository.delete(otp));

    com.budgetgo.backend.entity.Otp otp = new com.budgetgo.backend.entity.Otp(
        email,
        otpCode,
        LocalDateTime.now().plusMinutes(10));
    otpRepository.save(otp);

    // Send Email
    emailService.sendOtpEmail(email, otpCode);

    return ResponseEntity.ok(Map.of("message", "OTP sent to your email."));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    String otpCode = request.get("otp");
    String newPassword = request.get("newPassword");

    if (email == null || otpCode == null || newPassword == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "Email, OTP, and New Password are required"));
    }

    Optional<com.budgetgo.backend.entity.Otp> otpOpt = otpRepository.findByEmail(email);
    if (otpOpt.isEmpty() || !otpOpt.get().getOtpCode().equals(otpCode)) {
      return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
    }

    if (otpOpt.get().isExpired()) {
      return ResponseEntity.badRequest().body(Map.of("error", "OTP has expired"));
    }

    Optional<User> userOpt = userRepository.findByEmail(email);
    if (userOpt.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
    }

    User user = userOpt.get();
    user.setPassword(passwordService.hashPassword(newPassword));
    userRepository.save(user);

    // Clean up OTP
    otpRepository.delete(otpOpt.get());

    return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
  }

  public record LoginRequest(
      @Email(message = "Invalid email") String email,
      @NotBlank(message = "Password is required") String password) {
  }

  public record RegisterRequest(
      @NotBlank(message = "Name is required") String name,
      @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Invalid email format") @Email(message = "Invalid email") String email,
      @NotBlank(message = "Password is required") String password,
      String role,
      String invitationToken,
      String otp) {
  }

  public record LoginResponse(
      Long id,
      String name,
      String email,
      String role,
      String token) {
  }
}
