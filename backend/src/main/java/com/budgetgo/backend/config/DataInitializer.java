package com.budgetgo.backend.config;

import com.budgetgo.backend.entity.Bus;
import com.budgetgo.backend.entity.Train;
import com.budgetgo.backend.repository.BusRepository;
import com.budgetgo.backend.repository.TrainRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class DataInitializer {

        @Bean
        public CommandLineRunner initData(TrainRepository trainRepository, BusRepository busRepository) {
                return args -> {
                        // Check if data already exists to avoid duplication on restart
                        if (trainRepository.count() == 0) {
                                // Initialize Trains
                                Train t1 = new Train(null, "Godavari Express", "12727", "Hyderabad", "Visakhapatnam",
                                                "17:00", "05:00",
                                                "12h 00m", 450.0, "Train");
                                Train t2 = new Train(null, "Simhadri Express", "17239", "Hyderabad", "Visakhapatnam",
                                                "20:00", "06:00",
                                                "10h 00m", 400.0, "Train");
                                Train t3 = new Train(null, "Vande Bharat", "20834", "Visakhapatnam", "Hyderabad",
                                                "14:00", "22:30",
                                                "8h 30m", 1500.0, "Train");
                                Train t4 = new Train(null, "Bangalore Express", "12650", "Hyderabad", "Bangalore",
                                                "19:00", "06:00",
                                                "11h 00m", 600.0, "Train");
                                Train t5 = new Train(null, "Charminar Express", "12760", "Hyderabad", "Chennai",
                                                "18:00", "07:00",
                                                "13h 00m", 550.0, "Train");

                                trainRepository.saveAll(Arrays.asList(t1, t2, t3, t4, t5));
                                System.out.println("Dummy Trains Initialized");
                        }

                        if (busRepository.count() == 0) {
                                // Initialize Buses
                                Bus b1 = new Bus(null, "APSRTC Super Luxury", "AP29Z1234", "Hyderabad", "Vijayawada",
                                                "22:00", "03:00",
                                                "5h 00m", 800.0, "Bus");
                                Bus b2 = new Bus(null, "Orange Travels", "TS08UB5678", "Hyderabad", "Vijayawada",
                                                "23:30", "04:30",
                                                "5h 00m", 1200.0, "Bus");
                                Bus b3 = new Bus(null, "Morning Star", "AP16TV9999", "Hyderabad", "Visakhapatnam",
                                                "19:00", "06:00",
                                                "11h 00m", 1500.0, "Bus");
                                Bus b4 = new Bus(null, "Kaveri Travels", "KA01F2233", "Hyderabad", "Bangalore", "21:00",
                                                "06:00",
                                                "9h 00m", 1100.0, "Bus");

                                busRepository.saveAll(Arrays.asList(b1, b2, b3, b4));
                                System.out.println("Dummy Buses Initialized");
                        }

                        // Ensure Kakinada routes exist (User specific request)
                        if (trainRepository.findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(
                                        "Kakinada", "Guntur").isEmpty()) {
                                Train tK1 = new Train(null, "Circar Express", "17644", "Kakinada", "Guntur", "14:30",
                                                "20:00", "5h 30m", 350.0, "Train");
                                Train tK2 = new Train(null, "Seshadri Express", "17210", "Kakinada", "Guntur", "17:00",
                                                "22:00", "5h 00m", 300.0, "Train");
                                trainRepository.saveAll(Arrays.asList(tK1, tK2));
                                System.out.println("Added Kakinada->Guntur Trains");
                        }

                        if (busRepository.findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase("Kakinada",
                                        "Guntur").isEmpty()) {
                                Bus bK1 = new Bus(null, "APSRTC Garuda", "AP1234", "Kakinada", "Guntur", "12:00",
                                                "16:00", "4h 00m", 600.0, "Bus");
                                Bus bK2 = new Bus(null, "Morning Star", "MS9999", "Kakinada", "Guntur", "22:00",
                                                "02:00", "4h 00m", 800.0, "Bus");
                                busRepository.saveAll(Arrays.asList(bK1, bK2));
                                System.out.println("Added Kakinada->Guntur Buses");
                        }
                };
        }
}
