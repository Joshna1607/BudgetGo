package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findByTripIdOrderByCreatedAtDesc(Long tripId);
}
