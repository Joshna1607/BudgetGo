package com.budgetgo.backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {
        // Fallback if frontendUrl is not injected
        String targetUrl = (frontendUrl != null ? frontendUrl : "http://localhost:3000") + "/login";

        String errorMessage = "Login Failed";
        if (exception != null && exception.getMessage() != null) {
            errorMessage = exception.getMessage();
        }

        try {
            errorMessage = URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Keep original if encoding fails
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl + "?error=" + errorMessage);
    }
}
