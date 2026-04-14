package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    List<TripMember> findByTripId(Long tripId);

    List<TripMember> findByUserId(Long userId);

    Optional<TripMember> findByTripIdAndUserId(Long tripId, Long userId);

    // Count members in a trip
    long countByTripId(Long tripId);

    // Check if a member exists with a specific status
    boolean existsByTripIdAndUserIdAndStatus(Long tripId, Long userId, String status);

    boolean existsByTripIdAndUserId(Long tripId, Long userId);
}
