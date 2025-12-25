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

  // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  // Merge any additional headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint}`

  const maxRetries = 2
  let lastError: any = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Longer timeout for file uploads (FormData) and product listings
      const isFileUpload = options.body instanceof FormData
      const requestMethod = options.method || 'GET'
      const isProductList = url.includes('/products') && requestMethod === 'GET'
      const timeoutDuration = isFileUpload 
        ? (attempt === 0 ? 120000 : 180000) // 2-3 minutes for file uploads
        : isProductList
        ? (attempt === 0 ? 120000 : 150000) // 2-2.5 minutes for product listings
        : (attempt === 0 ? 60000 : 90000) // 1-1.5 minutes for regular requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

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
        
        if (attempt === maxRetries) {
          lastError = fetchError
          break
        }
        
        if (fetchError.name === 'AbortError') {
          logger.warn(`⚠️ Request timeout (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        
        if (fetchError instanceof TypeError && (fetchError.message === "Failed to fetch" || fetchError.message.includes("fetch"))) {
          logger.warn(`⚠️ Network error (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        
        lastError = fetchError
        break
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
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }
      } catch (readError) {
        // If reading fails, use statusText
        errorMessage = response.statusText || `HTTP ${response.status} Error`;
      }
      
      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        // Clear token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          logger.warn("⚠️ 401 Unauthorized - Token cleared. Redirecting to login...");
          
          // Only redirect if we're not already on login/signup page
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
            // Use setTimeout to avoid navigation during render
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
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
      // If it's the last attempt, handle the error
      if (attempt === maxRetries) {
        // Handle network errors (Failed to fetch, CORS, timeout, etc.)
        if (lastError) {
          if (lastError.name === 'AbortError') {
            throw new ApiError(504, "Request timeout. Please try again.")
          }
          
          if (lastError instanceof TypeError && (lastError.message === "Failed to fetch" || lastError.message.includes("fetch"))) {
            try {
              logger.error("Network Error - Backend may be offline:")
              logger.error("URL:", url)
              logger.error("Error:", lastError.message || "Failed to fetch")
            } catch {
              // Silent fail for logging
            }
            throw new ApiError(
              503,
              `Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL.replace("/api", "")}`
            )
          }
          
          // Re-throw if it's already an ApiError
          if (lastError instanceof ApiError) {
            throw lastError
          }
          
          // Unknown network error
          throw new ApiError(500, lastError.message || "Network error occurred")
        }
        
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
      
      // If not the last attempt and it's a retryable error, continue
      if (error instanceof TypeError || (error as any)?.name === 'AbortError') {
        continue
      }
      
      // For non-retryable errors, throw immediately
      throw error
    }
  }
  
  // If we exit the loop without returning, handle lastError
  if (lastError) {
    if (lastError.name === 'AbortError') {
      throw new ApiError(504, "Request timeout. Please try again.")
    }
    
    if (lastError instanceof TypeError && (lastError.message === "Failed to fetch" || lastError.message.includes("fetch"))) {
      throw new ApiError(
        503,
        `Cannot connect to the server. Please make sure the backend is running on ${API_BASE_URL.replace("/api", "")}`
      )
    }
    
    if (lastError instanceof ApiError) {
      throw lastError
    }
    
    throw new ApiError(500, lastError.message || "Network error occurred")
  }
  
  // This should never happen, but TypeScript needs it
  throw new ApiError(500, "Unexpected error in request")
}

export const apiClient = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "GET" })
  },

  post<T>(endpoint: string, data?: any): Promise<T> {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return request<T>(endpoint, {
      method: "POST",
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers: isFormData ? {} : undefined, // Let browser set Content-Type for FormData
    })
  },

  put<T>(endpoint: string, data?: any): Promise<T> {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return request<T>(endpoint, {
      method: "PUT",
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : undefined, // Let browser set Content-Type for FormData
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" })
  },
}

export default apiClient

