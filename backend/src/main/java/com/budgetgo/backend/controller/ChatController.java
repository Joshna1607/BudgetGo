package com.budgetgo.backend.controller;

import com.budgetgo.backend.model.ChatMessage;
import com.budgetgo.backend.repository.ChatRepository;
import com.budgetgo.backend.repository.TripMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ChatController {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{tripId}")
    @SendTo("/topic/trip/{tripId}")
    public ChatMessage sendMessage(@DestinationVariable Long tripId, @Payload ChatMessage chatMessage) {
        // Validate user is an ACCEPTED member of the trip
        boolean isMember = tripMemberRepository.existsByTripIdAndUserIdAndStatus(
                tripId, chatMessage.getSenderId(), "accepted");

        if (!isMember) {
            throw new RuntimeException("Unauthorized: You must be an accepted member of this trip to chat.");
        }

        chatMessage.setTripId(tripId);
        chatMessage.setTimestamp(java.time.LocalDateTime.now());
        return chatRepository.save(chatMessage);
    }

    @GetMapping("/api/chat/{tripId}")
    public List<ChatMessage> getChatHistory(@PathVariable Long tripId) {
        // In a real production app, you should validate the authenticated user from
        // SecurityContext
        // For now, we return the history. The frontend should only show this if the
        // user is a member.
        return chatRepository.findByTripIdOrderByTimestampAsc(tripId);
    }
}
