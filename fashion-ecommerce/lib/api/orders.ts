import apiClient from "./client"

export type Order = {
  _id: string
  orderNumber: string
  user: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  items: Array<{
    product?: string
    design?: string
    name: string
    price: number
    quantity: number
    size: string
    color: string
    image: string
    isCustom: boolean
  }>
  shippingAddress: {
    firstName: string
    lastName: string
    email: string
    phone: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  paymentInfo: {
    method: string
    status: "pending" | "completed" | "failed" | "refunded"
    transactionId?: string
  }
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  trackingNumber?: string
  trackingHistory?: Array<{
    status: string
    location?: string
    note?: string
    updatedBy?: {
      _id: string
      firstName: string
      lastName: string
    }
    updatedAt: string
  }>
  carrier?: string
  estimatedDelivery?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export const ordersApi = {
  async getMyOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[] | { data: Order[]; count?: number }>("/orders/my-orders")
    
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return []
  },

  async getAllOrders(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<Order[]> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    const queryString = queryParams.toString()
    const response = await apiClient.get<{ data: Order[] } | Order[]>(`/orders${queryString ? `?${queryString}` : ""}`)
    
    
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return []
  },

  async getOrder(id: string): Promise<Order> {
    return await apiClient.get<Order>(`/orders/${id}`)
  },

  async updateOrderStatus(id: string, data: {
    status?: Order["status"]
    trackingNumber?: string
    carrier?: string
    estimatedDelivery?: string
    location?: string
    note?: string
  }): Promise<Order> {
    return await apiClient.put(`/orders/${id}/status`, data)
  },

  async deleteOrder(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`)
  },

  async createOrder(orderData: {
    items: Order["items"]
    shippingAddress: Order["shippingAddress"]
    paymentInfo: Order["paymentInfo"]
    subtotal?: number
    tax?: number
    shipping?: number
    total?: number
  }): Promise<Order> {
    const response = await apiClient.post<Order | { data: Order }>("/orders", orderData)
    
    if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
      return (response as { data: Order }).data
    }
    return response as Order
  },
}

