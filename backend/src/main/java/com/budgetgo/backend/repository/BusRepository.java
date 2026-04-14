package com.budgetgo.backend.repository;

import com.budgetgo.backend.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    List<Bus> findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(String origin, String destination);
}
