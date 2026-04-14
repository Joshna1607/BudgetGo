package com.budgetgo.backend.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Arrays;

@Service
public class BudgetValidationService {

    private static final double ABSOLUTE_MIN_DAILY_BUDGET = 500.0; // Very basic survival (hostel + street food)
    private static final double STANDARD_MIN_DAILY_BUDGET = 1500.0; // Decent budget

    // City-specific minimum daily budgets (could be moved to DB later)
    private static final Map<String, Double> CITY_MIN_BUDGETS = new HashMap<>();

    static {
        CITY_MIN_BUDGETS.put("New Delhi", 2000.0);
        CITY_MIN_BUDGETS.put("Delhi", 2000.0);
        CITY_MIN_BUDGETS.put("Mumbai", 2500.0);
        CITY_MIN_BUDGETS.put("Bangalore", 2200.0);
        CITY_MIN_BUDGETS.put("Goa", 3000.0);
        CITY_MIN_BUDGETS.put("Jaipur", 1800.0);
        CITY_MIN_BUDGETS.put("Agra", 1500.0);
        // International
        CITY_MIN_BUDGETS.put("Paris", 12000.0);
        CITY_MIN_BUDGETS.put("London", 15000.0);
        CITY_MIN_BUDGETS.put("Dubai", 10000.0);
        CITY_MIN_BUDGETS.put("Singapore", 8000.0);
        CITY_MIN_BUDGETS.put("Bangkok", 5000.0);
        CITY_MIN_BUDGETS.put("Kerala", 2000.0);
        CITY_MIN_BUDGETS.put("Munnar", 2000.0);
        CITY_MIN_BUDGETS.put("Alleppey", 2500.0);
    }

    public ValidationResult validate(String destination, int days, double budget, int travelers) {
        double totalMinBudget = getMinBudgetForDestination(destination) * days * travelers;
        double perPersonBudget = budget / travelers;
        double dailyPerPersonBudget = perPersonBudget / days;

        ValidationResult result = new ValidationResult();

        if (budget < totalMinBudget) {
            result.setFeasible(false);
            result.setMessage(String.format(
                    "Your budget of ₹%.0f is insufficient for a %d-day trip to %s for %d people. " +
                            "Minimum recommended budget is approx ₹%.0f (₹%.0f/person/day).",
                    budget, days, destination, travelers, totalMinBudget, getMinBudgetForDestination(destination)));

            // Generate alternatives based on severity
            if (dailyPerPersonBudget < 500) {
                result.setSuggestions(Arrays.asList(
                        "Consider a 1-day local trip instead.",
                        "Look for free walking tours and attractions.",
                        "Bring your own food to save costs."));
            } else {
                result.setSuggestions(Arrays.asList(
                        "Reduce trip duration by " + Math.max(1, days / 2) + " days.",
                        "Choose a nearby destination like " + getNearbyAlternative(destination),
                        "Stay in hostels instead of hotels."));
            }
        } else {
            result.setFeasible(true);
            result.setMessage("Budget looks good! Proceeding with AI plan generation.");
        }

        return result;
    }

    private double getMinBudgetForDestination(String destination) {
        return CITY_MIN_BUDGETS.getOrDefault(destination, STANDARD_MIN_DAILY_BUDGET);
    }

    private String getNearbyAlternative(String destination) {
        // Basic hardcoded logic for now - ideally this comes from a geospatial DB
        if (destination.contains("Delhi"))
            return "Agra or Jaipur";
        if (destination.contains("Mumbai"))
            return "Lonavala or Pune";
        if (destination.contains("Bangalore"))
            return "Mysore or Coorg";
        if (destination.contains("Paris"))
            return "Prague or Budapest (cheaper EU options)";
        return "a local city or town";
    }

    public static class ValidationResult {
        private boolean isFeasible;
        private String message;
        private List<String> suggestions;

        public boolean isFeasible() {
            return isFeasible;
        }

        public void setFeasible(boolean feasible) {
            isFeasible = feasible;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public List<String> getSuggestions() {
            return suggestions;
        }

        public void setSuggestions(List<String> suggestions) {
            this.suggestions = suggestions;
        }
    }
}
