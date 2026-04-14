package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Trip> findByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM Trip t LEFT JOIN TripMember tm ON t.id = tm.tripId WHERE t.userId = :userId OR (tm.userId = :userId AND tm.status = 'accepted') ORDER BY t.createdAt DESC")
    List<Trip> findTripsByOwnerOrMember(Long userId);
}
