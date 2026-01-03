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
      
      try {
        console.warn("[WARNING] Failed to get preferences, using defaults")
      } catch {
        
      }
      
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

      
      const cleanedPreferences = removeUndefined(preferences);

      
      const dataToSend = cleanedPreferences && Object.keys(cleanedPreferences).length > 0 
        ? cleanedPreferences 
        : {};

      const response = await apiClient.put<UserPreferences | { data: UserPreferences }>("/user-preferences", dataToSend)
      
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as UserPreferences
    } catch (error: any) {
      
      
      try {
        const errorMessage = error?.message || "Unknown error"
        const errorStatus = error?.status
        const errorName = error?.name || "Error"
        
        
        try {
          console.warn("[WARNING] Failed to update preferences (non-critical)")
          console.warn("Error Message:", errorMessage)
          if (errorStatus) console.warn("Error Status:", errorStatus)
          console.warn("Error Name:", errorName)
        } catch {
          
        }
      } catch {
        
      }
      
      
      
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

