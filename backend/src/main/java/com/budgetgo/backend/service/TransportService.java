package com.budgetgo.backend.service;

import com.budgetgo.backend.entity.Bus;
import com.budgetgo.backend.entity.Train;
import com.budgetgo.backend.repository.BusRepository;
import com.budgetgo.backend.repository.TrainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class TransportService {

    @Autowired
    private TrainRepository trainRepository;

    @Autowired
    private BusRepository busRepository;

    public List<Train> searchTrains(String origin, String destination) {
        if (origin == null || destination == null) {
            return Collections.emptyList();
        }
        return trainRepository.findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(origin, destination);
    }

    public List<Bus> searchBuses(String origin, String destination) {
        if (origin == null || destination == null) {
            return Collections.emptyList();
        }
        return busRepository.findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(origin, destination);
    }
}
