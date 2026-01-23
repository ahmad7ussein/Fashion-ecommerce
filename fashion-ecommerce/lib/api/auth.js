import apiClient from "./client";
import logger from "@/lib/logger";
import { getApiUrl } from "@/lib/api";
export const authApi = {
    async login(identifier, password) {
        const { API_BASE_URL } = await import("@/lib/api");
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        try {
            const loginUrl = getApiUrl("/auth/login");
            logger.log("🔍 Attempting login to:", loginUrl);
            const response = await fetch(loginUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ identifier, password }),
            });
            if (!response.ok) {
                let errorMessage = "Login failed";
                const contentType = response.headers.get("content-type");
                try {
                    const clonedResponse = response.clone();
                    const responseText = await clonedResponse.text();
                    logger.error("Login error response (raw):", responseText || "(empty)");
                    logger.error("Login error status:", response.status, response.statusText);
                    logger.error("Login error content-type:", contentType);
                    logger.error("Login error response length:", responseText?.length || 0);
                    if (responseText && responseText.trim().length > 0) {
                        try {
                            const errorData = JSON.parse(responseText);
                            logger.error("Login error response (parsed):", errorData);
                            if (errorData && typeof errorData === 'object') {
                                if (Object.keys(errorData).length === 0) {
                                    errorMessage = `HTTP ${response.status}: ${response.statusText || 'Login failed'}`;
                                }
                                else {
                                    errorMessage = errorData.message ||
                                        errorData.error ||
                                        errorData.data?.message ||
                                        (errorData.errors && Array.isArray(errorData.errors)
                                            ? errorData.errors.map((e) => e.msg || e.message || String(e)).join(', ')
                                            : null) ||
                                        (Object.keys(errorData).length > 0 ? JSON.stringify(errorData) : null) ||
                                        response.statusText ||
                                        "Login failed";
                                }
                            }
                        }
                        catch (jsonError) {
                            logger.error("Error response is not JSON, using as text");
                            errorMessage = responseText || response.statusText || `HTTP ${response.status}: Login failed`;
                        }
                    }
                    else {
                        logger.error("Error response has empty body");
                        if (response.status === 400) {
                            errorMessage = "Invalid request. Please check your email and password.";
                        }
                        else if (response.status === 401) {
                            errorMessage = "Invalid email or password. Please try again.";
                        }
                        else if (response.status === 403) {
                            errorMessage = "Access forbidden. Please contact support.";
                        }
                        else if (response.status === 404) {
                            errorMessage = "Login endpoint not found. Please check the server configuration.";
                        }
                        else if (response.status === 500) {
                            errorMessage = "Server error. Please try again later.";
                        }
                        else {
                            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Login failed'}`;
                        }
                    }
                }
                catch (readError) {
                    logger.error("Failed to read error response:", readError);
                    errorMessage = response.statusText || `HTTP ${response.status}: Login failed`;
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            logger.log("🔍 authApi.login raw response:", JSON.stringify(data, null, 2));
            if (data.success && data.data && data.data.user && data.data.token) {
                logger.log("✅ Response structure correct: {success, data: {user, token}}");
                return {
                    user: data.data.user,
                    token: data.data.token,
                };
            }
            if (data.user && data.token) {
                logger.log("✅ Response already has user and token");
                return {
                    user: data.user,
                    token: data.token,
                };
            }
            logger.error("❌ Unexpected response structure:", data);
            throw new Error("Invalid response structure from login API");
        }
        catch (error) {
            if (error instanceof TypeError && error.message === "Failed to fetch") {
                logger.error("❌ Network Error - Backend may be offline");
                logger.error("API URL:", getApiUrl("/auth/login"));
                logger.error("Error:", error);
                throw new Error(`Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL().replace("/api", "")}`);
            }
            if (error instanceof Error) {
                throw error;
            }
            logger.error("❌ Unexpected error during login:", error);
            throw new Error(error?.message || "An unexpected error occurred during login");
        }
    },
    async register(userData) {
        const response = await apiClient.post("/auth/register", userData);
        return response;
    },
    async getMe() {
        return await apiClient.get("/auth/me");
    },
    async updateProfile(profileData) {
        return await apiClient.put("/auth/profile", profileData);
    },
    async googleAuth(idToken) {
        const { API_BASE_URL } = await import("@/lib/api");
        try {
            const googleUrl = getApiUrl("/auth/google");
            logger.log("🔍 Attempting Google auth to:", googleUrl);
            const response = await fetch(googleUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ idToken }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Google authentication failed");
            }
            const data = await response.json();
            logger.log("✅ Google auth successful");
            if (data.success && data.data && data.data.user && data.data.token) {
                return {
                    user: data.data.user,
                    token: data.data.token,
                };
            }
            throw new Error("Invalid response structure from Google auth API");
        }
        catch (error) {
            logger.error("❌ Google auth error:", error);
            if (error instanceof TypeError && error.message === "Failed to fetch") {
                throw new Error(`Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL().replace("/api", "")}`);
            }
            throw error instanceof Error ? error : new Error(error?.message || "An unexpected error occurred during Google authentication");
        }
    },
};
