import apiClient from "./client"

export type DashboardStats = {
  overview: {
    totalUsers: number
    totalOrders: number
    totalProducts: number
    totalDesigns: number
    totalRevenue: number
  }
  ordersByStatus: {
    pending: number
    processing: number
    shipped: number
    delivered: number
  }
  recentOrders: any[]
  topProducts: any[]
}

export type User = {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: "customer" | "employee" | "admin"
  phone?: string
  createdAt: string
}

export type SalesReport = {
  salesByDay: Array<{
    _id: string
    totalSales: number
    orderCount: number
  }>
  summary: {
    total: number
    count: number
  }
}

export const adminApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return await apiClient.get<DashboardStats>("/admin/dashboard/stats")
  },

  async getAllUsers(params?: {
    role?: string
    page?: number
    limit?: number
    search?: string
  }): Promise<{ data: User[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams()
    if (params?.role) queryParams.append("role", params.role)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)

    const response = await apiClient.get<{ 
      success: boolean
      count: number
      total: number
      page: number
      pages: number
      data: User[]
    }>(`/admin/users?${queryParams.toString()}`)
    
    // Handle response structure - apiClient extracts data.data, but we need the full object
    // If response is already the full object, use it; otherwise wrap it
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
      }
    }
    
    // Fallback: if response is just the array, wrap it
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: 1,
        pages: 1,
      }
    }
    
    // Default fallback
    return {
      data: [],
      total: 0,
      page: 1,
      pages: 0,
    }
  },

  async getUser(id: string): Promise<{ user: User; orders: any[]; designs: any[] }> {
    return await apiClient.get(`/admin/users/${id}`)
  },

  async updateUserRole(id: string, role: "customer" | "employee" | "admin"): Promise<User> {
    return await apiClient.put(`/admin/users/${id}/role`, { role })
  },

  async deleteUser(id: string): Promise<void> {
    return await apiClient.delete(`/admin/users/${id}`)
  },

  async createEmployee(employeeData: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
  }): Promise<User> {
    const response = await apiClient.post<{ data: User }>("/admin/employees", employeeData)
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data
    }
    return response as User
  },

  async getSalesReport(startDate?: string, endDate?: string): Promise<SalesReport> {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)

    // FIXED: Backend returns { success: true, data: { salesByDay, summary } }
    const response = await apiClient.get<{ data: SalesReport } | SalesReport>(`/admin/reports/sales?${params.toString()}`)
    
    // If response has data property, extract it
    if (response && typeof response === 'object' && 'data' in response && 'salesByDay' in (response as any).data) {
      return (response as { data: SalesReport }).data
    }
    
    // Otherwise, assume response is already the SalesReport
    return response as SalesReport
  },

  async getEmployeeActivities(params?: {
    employeeId?: string
    page?: number
    limit?: number
  }): Promise<{
    data: any[]
    statistics: any[]
    total: number
    page: number
    pages: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.employeeId) queryParams.append("employeeId", params.employeeId)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    // FIXED: Handle response structure correctly
    const response = await apiClient.get<{
      success: boolean
      count: number
      total: number
      page: number
      pages: number
      data: any[]
      statistics: any[]
    }>(`/admin/employee-activities?${queryParams.toString()}`)
    
    // FIXED: apiClient extracts data.data, but we need the full object with statistics
    // If response is the full object, use it directly
    if (response && typeof response === 'object' && 'data' in response && 'statistics' in response) {
      return {
        data: Array.isArray(response.data) ? response.data : [],
        statistics: Array.isArray(response.statistics) ? response.statistics : [],
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 0,
      }
    }
    
    // Fallback
    return {
      data: [],
      statistics: [],
      total: 0,
      page: 1,
      pages: 0,
    }
  },
}

