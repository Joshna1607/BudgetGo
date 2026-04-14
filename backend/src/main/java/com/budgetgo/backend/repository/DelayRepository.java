package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Delay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DelayRepository extends JpaRepository<Delay, Long> {
    List<Delay> findByTripId(Long tripId);
}
