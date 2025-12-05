import apiClient from "./client"

export type DashboardPreferences = {
  activeTab?: string
  chartSettings?: {
    revenueChartType?: 'line' | 'bar' | 'area'
    ordersChartType?: 'pie' | 'bar' | 'line'
    dateRange?: string
    selectedMetrics?: string[]
  }
  tableSettings?: {
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
}

export type SidebarPreferences = {
  collapsed?: boolean
  width?: number
}

export type UserPreferences = {
  _id: string
  user: string
  dashboardPreferences?: DashboardPreferences
  sidebarPreferences?: SidebarPreferences
  theme?: 'light' | 'dark' | 'system'
  language?: 'en' | 'ar'
  notifications?: {
    email?: boolean
    push?: boolean
    orderUpdates?: boolean
    productUpdates?: boolean
  }
  createdAt: string
  updatedAt: string
}

export const userPreferencesApi = {
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<UserPreferences | { data: UserPreferences }>("/user-preferences")
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as UserPreferences
    } catch (error: any) {
      // Safe error handling - return default preferences instead of crashing
      try {
        console.warn("[WARNING] Failed to get preferences, using defaults")
      } catch {
        // Silent fail
      }
      // Return default preferences to prevent UI crashes
      return {
        _id: '',
        user: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserPreferences
    }
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      // Helper function to remove undefined values
      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) return undefined;
        if (Array.isArray(obj)) return obj.map(removeUndefined);
        if (typeof obj !== 'object') return obj;
        
        const cleaned: any = {};
        for (const key in obj) {
          if (obj[key] !== undefined) {
            const cleanedValue = removeUndefined(obj[key]);
            if (cleanedValue !== undefined) {
              cleaned[key] = cleanedValue;
            }
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      };

      // Clean preferences before sending
      const cleanedPreferences = removeUndefined(preferences);

      // If cleanedPreferences is undefined or empty, send at least an empty object
      const dataToSend = cleanedPreferences && Object.keys(cleanedPreferences).length > 0 
        ? cleanedPreferences 
        : {};

      const response = await apiClient.put<UserPreferences | { data: UserPreferences }>("/user-preferences", dataToSend)
      
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as UserPreferences
    } catch (error: any) {
      // Log error safely - preferences saving is not critical
      // Use try-catch to ensure UI doesn't crash
      try {
        const errorMessage = error?.message || "Unknown error"
        const errorStatus = error?.status
        const errorName = error?.name || "Error"
        
        // Safe logging - never throw
        try {
          console.warn("[WARNING] Failed to update preferences (non-critical)")
          console.warn("Error Message:", errorMessage)
          if (errorStatus) console.warn("Error Status:", errorStatus)
          console.warn("Error Name:", errorName)
        } catch {
          // Silent fail for logging
        }
      } catch {
        // Ultimate fallback - do nothing
      }
      
      // Return a mock preferences object to prevent errors
      // This ensures the UI continues to work even if preferences save fails
      return {
        _id: '',
        user: '',
        ...preferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as UserPreferences
    }
  },
}

