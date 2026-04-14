package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Train;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainRepository extends JpaRepository<Train, Long> {
    // Find trains by origin and destination (case-insensitive search recommended in
    // Service, but exact for now)
    List<Train> findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(String origin, String destination);
}
