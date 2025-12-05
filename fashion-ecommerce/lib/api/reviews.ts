import apiClient from "./client"

export type Review = {
  _id: string
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  order?: string
  rating: number
  title: string
  comment: string
  status: "pending" | "approved" | "rejected"
  adminResponse?: string
  createdAt: string
  updatedAt: string
}

export const reviewsApi = {
  async getApprovedReviews(params?: {
    page?: number
    limit?: number
  }): Promise<{ data: Review[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    const response = await apiClient.get<{ 
      success: boolean
      count: number
      total: number
      page: number
      pages: number
      data: Review[]
    }>(`/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
    
    if (response && typeof response === 'object' && 'data' in response) {
      return {
        data: response.data,
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
      }
    }
    
    return {
      data: [],
      total: 0,
      page: 1,
      pages: 0,
    }
  },

  async getMyReviews(): Promise<Review[]> {
    const response = await apiClient.get<Review[] | { data: Review[]; count?: number }>("/reviews/my-reviews")
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return []
  },

  async createReview(reviewData: {
    order?: string
    rating: number
    title: string
    comment: string
  }): Promise<Review> {
    const response = await apiClient.post<Review | { data: Review }>("/reviews", reviewData)
    if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
      return (response as { data: Review }).data
    }
    return response as Review
  },

  async getAllReviews(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: Review[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    const response = await apiClient.get<{ 
      success: boolean
      count: number
      total: number
      page: number
      pages: number
      data: Review[]
    }>(`/reviews/all${queryParams.toString() ? `?${queryParams.toString()}` : ""}`)
    
    if (response && typeof response === 'object' && 'data' in response) {
      return {
        data: response.data,
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
      }
    }
    
    return {
      data: [],
      total: 0,
      page: 1,
      pages: 0,
    }
  },

  async updateReviewStatus(id: string, status: "pending" | "approved" | "rejected", adminResponse?: string): Promise<Review> {
    const response = await apiClient.put<Review | { data: Review }>(`/reviews/${id}/status`, { status, adminResponse })
    if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
      return (response as { data: Review }).data
    }
    return response as Review
  },

  async deleteReview(id: string): Promise<void> {
    return await apiClient.delete(`/reviews/${id}`)
  },
}

