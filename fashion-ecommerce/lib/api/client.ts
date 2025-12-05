import logger from "@/lib/logger"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    // Add timeout to fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Handle network errors (Failed to fetch, CORS, timeout, etc.)
      if (fetchError.name === 'AbortError') {
        throw new ApiError(504, "Request timeout. Please try again.")
      }
      
      if (fetchError instanceof TypeError && (fetchError.message === "Failed to fetch" || fetchError.message.includes("fetch"))) {
        try {
          logger.error("Network Error - Backend may be offline:")
          logger.error("URL:", url)
          logger.error("Error:", fetchError.message || "Failed to fetch")
        } catch {
          // Silent fail for logging
        }
        throw new ApiError(
          503,
          `Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL.replace("/api", "")}`
        )
      }
      
      // Re-throw if it's already an ApiError
      if (fetchError instanceof ApiError) {
        throw fetchError
      }
      
      // Unknown network error
      throw new ApiError(500, fetchError.message || "Network error occurred")
    }

    if (!response.ok) {
      // Read error response body
      let errorText = '';
      let errorMessage = response.statusText || 'Unknown error';
      
      try {
        errorText = await response.text();
        
        if (errorText && errorText.trim().length > 0) {
          try {
            const errorData = JSON.parse(errorText);
            // Extract error message from response
            errorMessage = errorData.message || 
                          errorData.error || 
                          errorData.data?.message ||
                          errorMessage;
          } catch {
            // Not JSON, use as text
            errorMessage = errorText || errorMessage;
          }
        }
      } catch (readError) {
        // If reading fails, use statusText
        errorMessage = response.statusText || `HTTP ${response.status} Error`;
      }
      
      // Log detailed error information
      // Skip logging for expected 404 errors on numeric product IDs (fallback catalog)
      const isNumericProductId = /\/products\/\d+$/.test(url) && response.status === 404
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
        } catch {
          // Silent fail for logging
        }
      }
      
      // Create detailed error with all available information
      const detailedError = new ApiError(response.status, errorMessage);
      (detailedError as any).url = url;
      (detailedError as any).method = options.method || "GET";
      (detailedError as any).responseBody = errorText;
      (detailedError as any).responseHeaders = Object.fromEntries(response.headers.entries());
      
      throw detailedError;
    }

    // Parse response JSON safely
    let data: any
    try {
      const text = await response.text()
      if (!text || text.trim().length === 0) {
        // Empty response
        return {} as T
      }
      data = JSON.parse(text)
    } catch (parseError) {
      // Invalid JSON response
      try {
        logger.error("Failed to parse JSON response")
      } catch {
        // Silent fail
      }
      throw new ApiError(500, "Invalid response from server")
    }
    
    // Backend returns: {success: true, data: {...}} or {success: true, count, total, page, pages, data: [...]}
    // For endpoints that return paginated data with metadata (like getAllUsers), return the full object
    // For other endpoints, extract just the data part
    if (data && typeof data === 'object' && 'data' in data) {
      // If the response has pagination metadata (count, total, page, pages), return full object
      if ('total' in data || 'count' in data || 'page' in data || 'pages' in data) {
        return data
      }
      // Otherwise, extract just the data part
      return data.data
    } else {
      return data
    }
  } catch (error) {
    // Handle ApiError (already formatted) - re-throw as is
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle other unexpected errors
    try {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        ...(error as any),
      } : { message: String(error), raw: error };
      
      logger.error("Unexpected error in API request", {
        endpoint,
        url,
        error: errorDetails,
      });
    } catch {
      // Silent fail for logging
    }
    
    // Wrap unknown errors with full details
    const wrappedError = new ApiError(500, error instanceof Error ? error.message : "An unexpected error occurred");
    (wrappedError as any).originalError = error;
    (wrappedError as any).endpoint = endpoint;
    (wrappedError as any).url = url;
    throw wrappedError;
  }
}

export const apiClient = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "GET" })
  },

  post<T>(endpoint: string, data?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  put<T>(endpoint: string, data?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" })
  },
}

export default apiClient

