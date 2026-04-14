package com.budgetgo.backend.repository;

import com.budgetgo.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByTripIdOrderByTimestampAsc(Long tripId);
}
