package com.budgetgo.backend.controller;

import com.budgetgo.backend.service.GeminiService;
import com.budgetgo.backend.service.TransportService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/transport")
public class TransportController {

    @Autowired
    private TransportService transportService;

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/search")
    public ResponseEntity<?> searchTransport(@RequestBody SearchRequest request) {
        try {
            Map<String, Object> results = geminiService.searchTransport(
                    request.origin(),
                    request.destination(),
                    request.date(),
                    request.type());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public record SearchRequest(
            @NotBlank String origin,
            @NotBlank String destination,
            @NotBlank String date,
            @NotBlank String type // "Train", "Bus", "Flight", "Cab"
    ) {
    }
}
