package com.budgetgo.backend.security;

import com.budgetgo.backend.service.JwtService;
import com.budgetgo.backend.entity.User;
import com.budgetgo.backend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

            // Redirect to Frontend with Token and User Details
            String redirectUrl = frontendUrl + "/oauth/callback" +
                    "?token=" + token +
                    "&role=" + user.getRole() +
                    "&id=" + user.getId() +
                    "&name=" + (user.getName() != null ? URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) : "")
                    +
                    "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8);

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            // Should be handled by CustomOAuth2UserService, but fallback check
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=OAuthUserNotFound");
        }
    }
}
