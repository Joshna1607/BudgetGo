package com.budgetgo.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_name", nullable = false)
    private String tripName;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String origin;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Double budget;

    @Column(name = "travel_budget")
    private Double travelBudget;

    @Column(name = "hotel_budget")
    private Double hotelBudget;

    @Column(name = "food_budget")
    private Double foodBudget;

    @Column(name = "activities_budget")
    private Double activitiesBudget;

    @Column(name = "misc_budget")
    private Double miscBudget;

    @Column(nullable = false)
    private Integer travelers = 1;

    private String description;

    private String mood;

    @Column(name = "status")
    private String status = "Planning";

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Trip() {
    }

    public Trip(String tripName, String destination, LocalDate startDate, LocalDate endDate,
            Double budget, Integer travelers, String description, String mood, Long userId) {
        this.tripName = tripName;
        this.destination = destination;
        this.startDate = startDate;
        this.endDate = endDate;
        this.budget = budget;
        this.travelers = travelers;
        this.description = description;
        this.mood = mood;
        this.userId = userId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTripName() {
        return tripName;
    }

    public void setTripName(String tripName) {
        this.tripName = tripName;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }

    public Double getTravelBudget() {
        return travelBudget;
    }

    public void setTravelBudget(Double travelBudget) {
        this.travelBudget = travelBudget;
    }

    public Double getHotelBudget() {
        return hotelBudget;
    }

    public void setHotelBudget(Double hotelBudget) {
        this.hotelBudget = hotelBudget;
    }

    public Double getFoodBudget() {
        return foodBudget;
    }

    public void setFoodBudget(Double foodBudget) {
        this.foodBudget = foodBudget;
    }

    public Double getActivitiesBudget() {
        return activitiesBudget;
    }

    public void setActivitiesBudget(Double activitiesBudget) {
        this.activitiesBudget = activitiesBudget;
    }

    public Double getMiscBudget() {
        return miscBudget;
    }

    public void setMiscBudget(Double miscBudget) {
        this.miscBudget = miscBudget;
    }

    public Integer getTravelers() {
        return travelers;
    }

    public void setTravelers(Integer travelers) {
        this.travelers = travelers;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
