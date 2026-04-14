package com.budgetgo.backend.service;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    private static final String API_KEY = "AIzaSyDSJ55BwwbAu1YhyDyMPDaD2NsUtKJxNcU";

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key="
            + API_KEY;
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> generateTripPlan(String origin, String destination, int days, double budget,
            int travelers, String mood, double travelBudget, double hotelBudget, double foodBudget,
            double activitiesBudget) {

        String prompt = String.format(
                "Act as a professional travel agent. Plan a %d-day trip from %s to %s for %d people with a TOTAL budget of ₹%.2f. The trip mood is '%s'.\n"
                        +
                        "STRICT BUDGET ALLOCATION (Do NOT exceed these limits):\n" +
                        "- Transport: ₹%.2f\n" +
                        "- Accommodation: ₹%.2f\n" +
                        "- Food: ₹%.2f\n" +
                        "- Activities: ₹%.2f\n" +
                        (hotelBudget == 0
                                ? "IMPORTANT: This is a 1-day trip. NO ACCOMMODATION/HOTEL IS REQUIRED. Do not include hotel costs.\n"
                                : "")
                        +
                        "Provide the response STRICTLY in valid JSON format with NO markdown formatting (no ```json ... ``` blocks).\n"
                        +
                        "CRITICAL CRITERIA:\n" +
                        "1. PRIORITIZE LOW BUDGET OPTIONS. Find the cheapest flights/trains and budget-friendly hotels/hostels.\n"
                        +
                        "2. If the TOTAL budget is less than ₹500 (absolute minimum), set 'is_feasible' to false.\n"
                        +
                        "3. If the budget is unrealistic (e.g. ₹2000 for 5-day international), set 'is_feasible' to false.\n"
                        +
                        "4. Use REAL-WORLD cheap pricing for %s. Do not hallucinate prices.\n"
                        +
                        "The JSON structure must be:\n" +
                        "{\n" +
                        "  \"is_feasible\": true/false,\n" +
                        "  \"feasibility_message\": \"If not feasible, explain why.\",\n"
                        +
                        "  \"transport_options\": [\n" +
                        "    { \"type\": \"Train\", \"name\": \"...\", \"price_per_person\": 500, ... }\n"
                        +
                        "  ],\n" +
                        "  \"hotels\": [\n" +
                        "    { \"name\": \"...\", \"price_per_night\": 800, ... }\n"
                        +
                        "  ],\n" +
                        "  \"daily_itinerary\": [\n" +
                        "    { \n" +
                        "       \"day\": 1, \n" +
                        "       \"description\": \"...\", \n" +
                        "       \"activities\": [ \n" +
                        "           { \"name\": \"Spot A\", \"estimated_cost\": 0 }, \n" +
                        "           { \"name\": \"Hotel Check-in\", \"estimated_cost\": 0 } \n" +
                        "       ],\n" +
                        "       \"daily_total_estimate\": 1000 \n" +
                        "    }\n" +
                        "  ],\n" +
                        "  \"estimated_costs\": {\n" +
                        "    \"transport\": 1000,\n" +
                        "    \"accommodation\": 2000,\n" +
                        "    \"food\": 1500,\n" +
                        "    \"activities\": 500,\n" +
                        "    \"total\": 5000\n" +
                        "  },\n" +
                        "  \"alternatives\": {\n" +
                        "    \"nearby_destinations\": [\"Dest A\", \"Dest B\"],\n" +
                        "    \"trip_scope_adjustments\": [\"Reduce to 2 days\", \"Stay in hostels\"],\n" +
                        "    \"budget_recommendation\": \"Increase budget to ₹3000\"\n" +
                        "  }\n" +
                        "}\n" +
                        "IMPORTANT: If 'is_feasible' is false or borderline, you MUST provide realistic 'alternatives' (nearby cheaper places, shorter duration, etc.).\n"
                        +
                        "For Day 1, always schedule 'Hotel Check-in'.",
                days, origin, destination, travelers, budget, mood,
                travelBudget, hotelBudget, foodBudget, activitiesBudget,
                destination);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contentPart = new HashMap<>();
        contentPart.put("text", prompt);
        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(contentPart));
        requestBody.put("contents", Collections.singletonList(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_API_URL, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JSONObject jsonResponse = new JSONObject(response.getBody());
                String generatedText = jsonResponse.getJSONArray("candidates")
                        .getJSONObject(0)
                        .getJSONObject("content")
                        .getJSONArray("parts")
                        .getJSONObject(0)
                        .getString("text");

                // Robust cleanup for JSON content
                int jsonStart = generatedText.indexOf("{");
                int jsonEnd = generatedText.lastIndexOf("}");

                if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                    generatedText = generatedText.substring(jsonStart, jsonEnd + 1);
                } else {
                    // Fallback cleanup if braces not found (unlikely but possible)
                    if (generatedText.startsWith("```json")) {
                        generatedText = generatedText.substring(7);
                    }
                    if (generatedText.startsWith("```")) {
                        generatedText = generatedText.substring(3);
                    }
                    if (generatedText.endsWith("```")) {
                        generatedText = generatedText.substring(0, generatedText.length() - 3);
                    }
                }

                return new JSONObject(generatedText).toMap();
            }
        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            System.out.println("Falling back to dummy trip plan due to API error/quota.");
            return getDummyTripPlan(destination, days, budget);
        }

        return Map.of("error", "Failed to generate plan");
    }

    public Map<String, Object> searchTransport(String origin, String destination, String date, String type) {

        String prompt;
        if ("Hotel".equalsIgnoreCase(type)) {
            prompt = String.format(
                    "Act as a Hotel Booking Engine. Search for available hotels and hostels in %s for check-in on %s.\n"
                            +
                            "Provide a list of at least 5 realistic options, PRIORITIZING LOW BUDGET and CHEAPEST options first.\n"
                            +
                            "Return STRICT JSON format only (no markdown):\n" +
                            "{\n" +
                            "  \"results\": [\n" +
                            "    { \"id\": \"unique_id\", \"name\": \"Hotel/Hostel Name\", \"location\": \"Address/Area\", \"price\": 1500, \"rating\": 4.2, \"type\": \"Hotel\", \"amenities\": [\"WiFi\", \"Pool\", \"Breakfast\"], \"image\": \"🏨\", \"booking_url\": \"https://www.booking.com/...\" }\n"
                            +
                            "  ]\n" +
                            "}\n" +
                            "Generate 'booking_url' pointing to a Booking.com search for that hotel.",
                    destination, date);
        } else {
            prompt = String.format(
                    "Act as a Real-Time Travel Booking Engine. Search for available %s options from %s to %s on %s.\n"
                            +
                            "Provide a list of at least 5 realistic options, PRIORITIZING LOW BUDGET and CHEAPEST options first. Use ACTUAL train names/numbers, bus operators, or airline codes.\n"
                            +
                            "Return STRICT JSON format only (no markdown):\n" +
                            "{\n" +
                            "  \"results\": [\n" +
                            "    { \"id\": \"unique_id\", \"name\": \"Operator/Name\", \"number\": \"12345\", \"departure\": \"HH:MM AM/PM\", \"arrival\": \"HH:MM AM/PM\", \"duration\": \"Xh Ym\", \"price\": 1200, \"type\": \"%s\", \"rating\": 4.5, \"features\": [\"AC\", \"WiFi\"], \"booking_url\": \"...\" }\n"
                            +
                            "  ]\n" +
                            "}\n" +
                            "Generate 'booking_url' based on type: Skyscanner for Flight, ConfirmTkt for Train, RedBus for Bus.",
                    type, origin, destination, date, type);
        }

        try {
            return callGeminiApi(prompt);
        } catch (Exception e) {
            System.err.println("Gemini API Error (Search): " + e.getMessage());
            return getDummyTransportSearch(origin, destination, type);
        }
    }

    private Map<String, Object> callGeminiApi(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contentPart = new HashMap<>();
        contentPart.put("text", prompt);
        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(contentPart));
        requestBody.put("contents", Collections.singletonList(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_API_URL, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JSONObject jsonResponse = new JSONObject(response.getBody());
                String generatedText = jsonResponse.getJSONArray("candidates")
                        .getJSONObject(0)
                        .getJSONObject("content")
                        .getJSONArray("parts")
                        .getJSONObject(0)
                        .getString("text");

                if (generatedText.startsWith("```json")) {
                    generatedText = generatedText.substring(7);
                }
                if (generatedText.startsWith("```")) {
                    generatedText = generatedText.substring(3);
                }
                if (generatedText.endsWith("```")) {
                    generatedText = generatedText.substring(0, generatedText.length() - 3);
                }

                return new JSONObject(generatedText).toMap();
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI Error: " + e.getMessage());
        }
        return Map.of("error", "AI generation failed");
    }

    private Map<String, Object> getDummyTripPlan(String destination, int days, double budget) {
        Map<String, Object> dummyPlan = new HashMap<>();

        if (budget < 500) {
            dummyPlan.put("is_feasible", false);
            dummyPlan.put("feasibility_message",
                    "A budget of ₹" + budget + " is too low. Minimum ₹2000 is required for a basic trip.");
            dummyPlan.put("transport_options", Collections.emptyList());
            dummyPlan.put("hotels", Collections.emptyList());
            dummyPlan.put("daily_itinerary", Collections.emptyList());
            dummyPlan.put("estimated_costs", new HashMap<>());
            return dummyPlan;
        }

        dummyPlan.put("is_feasible", true);
        dummyPlan.put("feasibility_message", "");

        // Transport
        Map<String, Object> transport = new HashMap<>();
        transport.put("type", "Train"); // Changed from Flight to Train for budget
        transport.put("name", "Express 123");
        transport.put("duration", "4h 15m");
        transport.put("price_per_person", 850); // Lowered from 4500
        transport.put("time", "10:00 AM");
        // Deep Link for Flight (Generic search)
        transport.put("booking_url", "https://www.confirmtkt.com/rbooking-d/trains/from/DEL/to/"
                + destination.substring(0, 3).toUpperCase());
        dummyPlan.put("transport_options", Collections.singletonList(transport));

        // Hotels
        Map<String, Object> hotel = new HashMap<>();
        hotel.put("name", "Budget " + destination + " Stay");
        hotel.put("price_per_night", 1200); // Lowered from 3500
        hotel.put("rating", 4.0);
        hotel.put("description", "Comfortable budget stay in " + destination);
        // Deep Link for Hotel
        hotel.put("booking_url", "https://www.booking.com/searchresults.html?ss=" + destination);
        dummyPlan.put("hotels", Collections.singletonList(hotel));

        // Itinerary
        JSONArray itinerary = new JSONArray();
        for (int i = 1; i <= days; i++) {
            JSONObject day = new JSONObject();
            day.put("day", i);
            if (i == 1) {
                day.put("description", "Arrival and Budget-Friendly Exploration in " + destination);
                // Ensure Check-in is 2nd item (approx 12:00 PM based on UI logic)
                day.put("activities", new JSONArray(new String[] {
                        "Arrival at " + destination,
                        "Hotel Check-in",
                        "Local Market Walk"
                }));
            } else {
                day.put("description", "Exploring " + destination + " - Day " + i);
                day.put("activities", new JSONArray(new String[] {
                        "Morning Sightseeing (Free Entry)",
                        "Street Food Lunch",
                        "Evening Park Visit"
                }));
            }
            itinerary.put(day);
        }
        dummyPlan.put("daily_itinerary", itinerary.toList());

        // Costs
        Map<String, Object> costs = new HashMap<>();
        costs.put("transport", 850);
        costs.put("accommodation", 1200 * days);
        costs.put("food", 800 * days); // Lowered food
        costs.put("activities", 200 * days); // Lowered activities
        costs.put("total", budget);
        dummyPlan.put("estimated_costs", costs);

        return dummyPlan;
    }

    private Map<String, Object> getDummyTransportSearch(String origin, String destination, String type) {
        Map<String, Object> result = new HashMap<>();
        String dateStr = java.time.LocalDate.now().plusDays(2).toString(); // Example date

        if ("Hotel".equalsIgnoreCase(type)) {
            // Fallback for Hotels
            var hotels = new java.util.ArrayList<Map<String, Object>>();

            Map<String, Object> h1 = new HashMap<>();
            h1.put("id", "dummy_hotel_1");
            h1.put("name", "Grand " + destination + " Hotel (Offline Mode)");
            h1.put("location", "City Center, " + destination);
            h1.put("price", 3500);
            h1.put("rating", 4.5);
            h1.put("type", "Hotel");
            h1.put("amenities", java.util.Arrays.asList("WiFi", "Pool", "Spa"));
            h1.put("image", "🏨");
            h1.put("booking_url", "https://www.booking.com/searchresults.html?ss=" + destination);
            hotels.add(h1);

            Map<String, Object> h2 = new HashMap<>();
            h2.put("id", "dummy_hotel_2");
            h2.put("name", "Budget Stay " + destination);
            h2.put("location", "Near Station, " + destination);
            h2.put("price", 1200);
            h2.put("rating", 3.8);
            h2.put("type", "Hotel");
            h2.put("amenities", java.util.Arrays.asList("WiFi", "Breakfast"));
            h2.put("image", "🏨");
            h2.put("booking_url", "https://www.booking.com/searchresults.html?ss=" + destination);
            hotels.add(h2);

            result.put("results", hotels);
            return result;
        }

        // Fallback for Transport
        Map<String, Object> transport = new HashMap<>();
        transport.put("id", "dummy_" + type.toLowerCase() + "_1");
        transport.put("name", "Dummy " + type + " Service (Offline Mode)");
        transport.put("number", "D-101");
        transport.put("departure", "09:00 AM");
        transport.put("arrival", "12:00 PM");
        transport.put("duration", "3h 00m");
        transport.put("price", 2500);
        transport.put("type", type);
        transport.put("rating", 4.2);
        transport.put("features", Collections.singletonList("Offline Data"));

        if ("Flight".equalsIgnoreCase(type)) {
            transport.put("booking_url", "https://www.skyscanner.co.in/transport/flights/" + origin + "/" + destination
                    + "/" + dateStr.replace("-", "") + "/?adults=1");
        } else if ("Train".equalsIgnoreCase(type)) {
            transport.put("booking_url", "https://www.confirmtkt.com/rbooking-d/trains/from/" + origin + "/to/"
                    + destination + "/date/" + dateStr);
        } else if ("Bus".equalsIgnoreCase(type)) {
            transport.put("booking_url",
                    "https://www.redbus.in/bus-tickets/" + origin + "-to-" + destination + "?date=" + dateStr);
        } else {
            transport.put("booking_url",
                    "https://www.google.com/search?q=book+cab+from+" + origin + "+to+" + destination);
        }

        result.put("results", Collections.singletonList(transport));
        return result;
    }
}
