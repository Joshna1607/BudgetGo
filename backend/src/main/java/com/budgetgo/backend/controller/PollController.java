package com.budgetgo.backend.controller;

import com.budgetgo.backend.entity.Poll;
import com.budgetgo.backend.entity.PollOption;
import com.budgetgo.backend.repository.PollOptionRepository;
import com.budgetgo.backend.repository.PollRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/polls")
public class PollController {

    @Autowired
    private PollRepository pollRepository;

    @Autowired
    private PollOptionRepository pollOptionRepository;

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Poll>> getTripPolls(@PathVariable Long tripId) {
        return ResponseEntity.ok(pollRepository.findByTripIdOrderByCreatedAtDesc(tripId));
    }

    @PostMapping
    public ResponseEntity<?> createPoll(@RequestBody CreatePollRequest request) {
        if (request.tripId() == null || request.question() == null || request.options() == null
                || request.options().size() < 2) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid poll data. Need at least 2 options."));
        }

        Poll poll = new Poll(request.tripId(), request.createdBy(), request.question());
        for (String optionText : request.options()) {
            poll.addOption(optionText);
        }

        Poll savedPoll = pollRepository.save(poll);
        return ResponseEntity.ok(savedPoll);
    }

    @PostMapping("/vote/{optionId}")
    public ResponseEntity<?> vote(@PathVariable Long optionId) {
        Optional<PollOption> optionOpt = pollOptionRepository.findById(optionId);
        if (optionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PollOption option = optionOpt.get();
        option.incrementVote();
        pollOptionRepository.save(option);

        return ResponseEntity.ok(option);
    }

    // Simplistic voting. In real app we track User-Vote to prevent duplicates.

    public record CreatePollRequest(
            Long tripId,
            Long createdBy,
            String question,
            List<String> options) {
    }
}
