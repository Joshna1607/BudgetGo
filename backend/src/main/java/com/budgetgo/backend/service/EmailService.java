package com.budgetgo.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.logging.Logger;

@Service
public class EmailService {
    // Force Recompile
    private static final Logger logger = Logger.getLogger(EmailService.class.getName());

    // Trigger Recompile
    @Autowired
    private JavaMailSender mailSender;

    public void sendInvitationEmail(String toEmail, String tripName, String invitationLink, String invitedBy) {
        try {
            String subject = "You've been invited to join a trip: " + tripName;
            String body = buildInvitationEmailBody(tripName, invitationLink, invitedBy);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            logger.info("Invitation email sent to: " + toEmail);
        } catch (Exception e) {
            logger.severe("Failed to send invitation email: " + e.getMessage());
        }
    }

    private String buildInvitationEmailBody(String tripName, String invitationLink, String invitedBy) {
        return String.format(
                "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h2 style='color: #667eea;'>You've been invited to join a trip!</h2>" +
                        "<p><strong>%s</strong> has invited you to join the trip: <strong>%s</strong></p>" +
                        "<p>Click the link below to register and join the trip:</p>" +
                        "<div style='margin: 20px 0;'>" +
                        "<a href='%s' style='background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>Join Trip</a>"
                        +
                        "</div>" +
                        "<p style='color: #666; font-size: 12px;'>This invitation will expire in 7 days.</p>" +
                        "<p style='color: #666; font-size: 12px;'>If you didn't expect this invitation, you can safely ignore this email.</p>"
                        +
                        "</body></html>",
                invitedBy, tripName, invitationLink);
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            String subject = "BudgetGo - Verify your email";
            String body = buildOtpEmailBody(otp);

            // ALWAYS Log OTP for Dev Mode/Fallback
            logger.info("=== OTP GENERATED (Dev Mode) ===");
            logger.info("To: " + toEmail);
            logger.info("OTP: " + otp);
            logger.info("================================");

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            logger.info("OTP email sent to: " + toEmail);
        } catch (Exception e) {
            logger.severe("Failed to send real OTP email (Check credentials): " + e.getMessage());
        }
    }

    private String buildOtpEmailBody(String otp) {
        return String.format(
                "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h2 style='color: #667eea;'>Verify your email address</h2>" +
                        "<p>Your One-Time Password (OTP) for BudgetGo registration is:</p>" +
                        "<div style='margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;'>"
                        +
                        "%s" +
                        "</div>" +
                        "<p style='color: #666; font-size: 12px;'>This OTP will expire in 10 minutes.</p>" +
                        "</body></html>",
                otp);
    }

    // Removed the old buildOtpEmailBody as it's no longer used by the new
    // sendOtpEmail
    // private String buildOtpEmailBody(String otp) {
    // return String.format(
    // "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
    // "<h2 style='color: #667eea;'>Verify your email address</h2>" +
    // "<p>Your One-Time Password (OTP) for BudgetGo registration is:</p>" +
    // "<div style='margin: 20px 0; font-size: 24px; font-weight: bold;
    // letter-spacing: 5px; color: #333;'>"
    // +
    // "%s" +
    // "</div>" +
    // "<p style='color: #666; font-size: 12px;'>This OTP will expire in 10
    // minutes.</p>" +
    // "</body></html>",
    // otp);
    // }

    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            String subject = "Welcome to BudgetGo \uD83C\uDF89";
            String body = buildWelcomeEmailBody(name);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            logger.info("Welcome email sent to: " + toEmail);
        } catch (Exception e) {
            logger.severe("Failed to send welcome email: " + e.getMessage());
        }
    }

    private String buildWelcomeEmailBody(String name) {
        return String.format(
                "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h2 style='color: #667eea;'>Hi %s,</h2>" +
                        "<p>Thank you for registering with <strong>BudgetGo</strong>!</p>" +
                        "<p>Your account has been successfully created using your Google account.</p>" +
                        "<p>You can now plan smart trips, manage expenses, and book travel easily.</p>" +
                        "<br>" +
                        "<p>Happy Traveling \u2708\uFE0F</p>" +
                        "<p>– Team BudgetGo</p>" +
                        "</body></html>",
                name);
    }

    public void sendInvitationAcceptedEmail(String toEmail, String tripName) {
        try {
            String subject = "You've joined the trip: " + tripName;
            String body = buildInvitationAcceptedEmailBody(tripName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            logger.info("Invitation accepted email sent to: " + toEmail);
        } catch (Exception e) {
            logger.severe("Failed to send invitation accepted email: " + e.getMessage());
        }
    }

    private String buildInvitationAcceptedEmailBody(String tripName) {
        return String.format(
                "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h2 style='color: #667eea;'>You're In! \uD83C\uDF89</h2>" +
                        "<p>You have successfully joined the trip: <strong>%s</strong></p>" +
                        "<p>You can now view the itinerary, add expenses, and chat with other members.</p>" +
                        "<br>" +
                        "<p>Happy Traveling \u2708\uFE0F</p>" +
                        "<p>– Team BudgetGo</p>" +
                        "</body></html>",
                tripName);
    }

    public void sendTripCreatedEmail(String toEmail, String tripName) {
        try {
            String subject = "Trip Created: " + tripName + " \uD83C\uDF0D";
            String body = buildTripCreatedEmailBody(tripName);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            logger.info("Trip created email sent to: " + toEmail);
        } catch (Exception e) {
            logger.severe("Failed to send trip created email: " + e.getMessage());
        }
    }

    private String buildTripCreatedEmailBody(String tripName) {
        return String.format(
                "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h2 style='color: #667eea;'>Trip Created Successfully! \u2705</h2>" +
                        "<p>Your trip <strong>%s</strong> has been created.</p>" +
                        "<p>Start adding friends, planning your itinerary, and tracking expenses now.</p>" +
                        "<br>" +
                        "<p>Happy Planning \uD83D\uDCDD</p>" +
                        "<p>– Team BudgetGo</p>" +
                        "</body></html>",
                tripName);
    }

    public void sendBookingConfirmedEmail(String toEmail, String bookingName, String type) {
        try {
            String subject = "Booking Confirmed: " + bookingName + " \u2705";
            String body = buildBookingConfirmedEmailBody(bookingName, type);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            logger.info("Booking confirmed email sent to: " + toEmail);
        } catch (Exception e) {
            logger.severe("Failed to send booking confirmed email: " + e.getMessage());
        }
    }

    private String buildBookingConfirmedEmailBody(String bookingName, String type) {
        return String.format(
                "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
                        "<h2 style='color: #667eea;'>Booking Confirmed! \uD83C\uDFAB</h2>" +
                        "<p>Your %s booking for <strong>%s</strong> has been confirmed.</p>" +
                        "<p>You can view the details in your Trip Itinerary.</p>" +
                        "<br>" +
                        "<p>Happy Traveling \u2708\uFE0F</p>" +
                        "<p>– Team BudgetGo</p>" +
                        "</body></html>",
                type, bookingName);
    }
}
