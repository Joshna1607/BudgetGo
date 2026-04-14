package com.budgetgo.backend.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key.secret:secret_placeholder}")
    private String keySecret;

    private RazorpayClient client;

    @PostConstruct
    public void init() {
        try {
            // Only initialize if keys are not placeholders (or handle gracefully)
            if (!keyId.contains("placeholder")) {
                this.client = new RazorpayClient(keyId, keySecret);
            }
        } catch (RazorpayException e) {
            e.printStackTrace();
        }
    }

    public String createOrder(double amount) throws RazorpayException {
        if (client == null) {
            // Mock behavior for development if keys are missing
            return "order_mock_" + System.currentTimeMillis();
        }

        JSONObject options = new JSONObject();
        options.put("amount", (int) (amount * 100)); // Amount in paise
        options.put("currency", "INR");
        options.put("receipt", "txn_" + System.currentTimeMillis());
        options.put("payment_capture", 1); // Auto capture

        Order order = client.orders.create(options);
        return order.get("id");
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) throws RazorpayException {
        if (client == null || orderId.startsWith("order_mock_")) {
            return true; // Always verify true for mock
        }

        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", orderId);
        options.put("razorpay_payment_id", paymentId);
        options.put("razorpay_signature", signature);

        return Utils.verifyPaymentSignature(options, keySecret);
    }
}
