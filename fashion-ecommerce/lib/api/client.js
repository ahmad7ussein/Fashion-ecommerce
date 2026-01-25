import logger from "@/lib/logger";
import { API_BASE_URL } from "@/lib/api";
export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "ApiError";
    }
}
async function request(endpoint, options = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers = {};
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const url = `${API_BASE_URL()}${endpoint}`;
    const maxRetries = 2;
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const isFileUpload = options.body instanceof FormData;
            const requestMethod = options.method || 'GET';
            const isProductList = url.includes('/products') && requestMethod === 'GET';
            const timeoutDuration = isFileUpload
                ? (attempt === 0 ? 120000 : 180000)
                : isProductList
                    ? (attempt === 0 ? 120000 : 150000)
                    : (attempt === 0 ? 60000 : 90000);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
            let response;
            try {
                response = await fetch(url, {
                    ...options,
                    headers,
                    credentials: 'include',
                    mode: 'cors',
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
            }
            catch (fetchError) {
                clearTimeout(timeoutId);
                if (attempt === maxRetries) {
                    lastError = fetchError;
                    break;
                }
                if (fetchError.name === 'AbortError') {
                    logger.warn(`⚠️ Request timeout (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                if (fetchError instanceof TypeError && (fetchError.message === "Failed to fetch" || fetchError.message.includes("fetch"))) {
                    logger.warn(`⚠️ Network error (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
                lastError = fetchError;
                break;
            }
            if (!response.ok) {
                let errorText = '';
                let errorMessage = response.statusText || 'Unknown error';
                try {
                    errorText = await response.text();
                    if (errorText && errorText.trim().length > 0) {
                        try {
                            const errorData = JSON.parse(errorText);
                            errorMessage = errorData.message ||
                                errorData.error ||
                                errorData.data?.message ||
                                errorMessage;
                        }
                        catch {
                            errorMessage = errorText || errorMessage;
                        }
                    }
                }
                catch (readError) {
                    errorMessage = response.statusText || `HTTP ${response.status} Error`;
                }
                if (response.status === 401) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('auth_token');
                        logger.warn("⚠️ 401 Unauthorized - Token cleared. Redirecting to login...");
                        const currentPath = window.location.pathname;
                        if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
                            setTimeout(() => {
                                window.location.href = '/login';
                            }, 100);
                        }
                    }
                }
                const isNumericProductId = /\/products\/\d+$/.test(url) && response.status === 404;
                if (!isNumericProductId) {
                    try {
                        logger.error("API Request Failed", {
                            url,
                            method: options.method || "GET",
                            status: response.status,
                            statusText: response.statusText,
                            errorMessage,
                            errorBody: errorText || "(empty)",
                            headers: Object.fromEntries(response.headers.entries()),
                        });
                    }
                    catch {
                    }
                }
                const detailedError = new ApiError(response.status, errorMessage);
                detailedError.url = url;
                detailedError.method = options.method || "GET";
                detailedError.responseBody = errorText;
                detailedError.responseHeaders = Object.fromEntries(response.headers.entries());
                throw detailedError;
            }
            let data;
            let responseText = "";
            const responseStatus = response.status;
            const responseContentType = response.headers.get("content-type");
            try {
                responseText = await response.text();
                if (!responseText || responseText.trim().length === 0) {
                    return {};
                }
                data = JSON.parse(responseText);
            }
            catch (parseError) {
                try {
                    const preview = typeof responseText === "string" ? responseText.slice(0, 200) : "";
                    logger.error("Failed to parse JSON response", {
                        url,
                        status: responseStatus,
                        contentType: responseContentType || "(missing)",
                        preview,
                    });
                }
                catch {
                }
                throw new ApiError(500, "Invalid response from server");
            }
            if (data && typeof data === 'object' && 'data' in data) {
                if ('total' in data || 'count' in data || 'page' in data || 'pages' in data) {
                    return data;
                }
                return data.data;
            }
            else {
                return data;
            }
        }
        catch (error) {
            if (attempt === maxRetries) {
                if (lastError) {
                    if (lastError.name === 'AbortError') {
                        throw new ApiError(504, "Request timeout. Please try again.");
                    }
                    if (lastError instanceof TypeError && (lastError.message === "Failed to fetch" || lastError.message.includes("fetch"))) {
                        try {
                            logger.error("Network Error - Backend may be offline:");
                            logger.error("URL:", url);
                            logger.error("Error:", lastError.message || "Failed to fetch");
                        }
                        catch {
                        }
                        throw new ApiError(503, `Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL().replace("/api", "")}`);
                    }
                    if (lastError instanceof ApiError) {
                        throw lastError;
                    }
                    throw new ApiError(500, lastError.message || "Network error occurred");
                }
                if (error instanceof ApiError) {
                    throw error;
                }
                try {
                    const errorDetails = error instanceof Error ? {
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        ...error,
                    } : { message: String(error), raw: error };
                    logger.error("Unexpected error in API request", {
                        endpoint,
                        url,
                        error: errorDetails,
                    });
                }
                catch {
                }
                const wrappedError = new ApiError(500, error instanceof Error ? error.message : "An unexpected error occurred");
                wrappedError.originalError = error;
                wrappedError.endpoint = endpoint;
                wrappedError.url = url;
                throw wrappedError;
            }
            if (error instanceof TypeError || error?.name === 'AbortError') {
                continue;
            }
            throw error;
        }
    }
    if (lastError) {
        if (lastError.name === 'AbortError') {
            throw new ApiError(504, "Request timeout. Please try again.");
        }
        if (lastError instanceof TypeError && (lastError.message === "Failed to fetch" || lastError.message.includes("fetch"))) {
            throw new ApiError(503, `Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL().replace("/api", "")}`);
        }
        if (lastError instanceof ApiError) {
            throw lastError;
        }
        throw new ApiError(500, lastError.message || "Network error occurred");
    }
    throw new ApiError(500, "Unexpected error in request");
}
export const apiClient = {
    get(endpoint, options = {}) {
        return request(endpoint, { method: "GET", ...options });
    },
    post(endpoint, data, options = {}) {
        const isFormData = data instanceof FormData;
        return request(endpoint, {
            method: "POST",
            body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
            headers: isFormData ? {} : undefined,
            ...options,
        });
    },
    put(endpoint, data, options = {}) {
        const isFormData = data instanceof FormData;
        return request(endpoint, {
            method: "PUT",
            body: isFormData ? data : JSON.stringify(data),
            headers: isFormData ? {} : undefined,
            ...options,
        });
    },
    delete(endpoint, options = {}) {
        return request(endpoint, { method: "DELETE", ...options });
    },
};
export default apiClient;
