import apiClient from "@/lib/api/client";

export const paymentsApi = {
  createCheckoutSession(orderId) {
    return apiClient.post("/payments/create-checkout-session", { orderId });
  },
  verifyCheckoutSession(sessionId) {
    return apiClient.get(`/payments/verify?session_id=${encodeURIComponent(sessionId)}`);
  },
};

export default paymentsApi;
