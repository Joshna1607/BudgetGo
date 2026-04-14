package com.budgetgo.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

  @Bean
  public CorsFilter corsFilter() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    CorsConfiguration config = new CorsConfiguration();
    
    // Allow frontend origin (React dev server typically runs on port 3000)
    config.addAllowedOrigin("http://localhost:3000");
    config.addAllowedOrigin("http://localhost:5173"); // Vite default port
    config.addAllowedOrigin("http://localhost:5174"); // Alternative Vite port
    
    // Allow common HTTP methods
    config.addAllowedMethod("GET");
    config.addAllowedMethod("POST");
    config.addAllowedMethod("PUT");
    config.addAllowedMethod("DELETE");
    config.addAllowedMethod("PATCH");
    config.addAllowedMethod("OPTIONS");
    
    // Allow common headers
    config.addAllowedHeader("*");
    config.setAllowCredentials(true);
    
    source.registerCorsConfiguration("/api/**", config);
    return new CorsFilter(source);
  }
}

