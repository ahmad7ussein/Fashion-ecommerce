import apiClient from "./client"

export type Notification = {
  _id: string
  user: string
  type: 'order_status' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'payment' | 'general'
  title: string
  message: string
  order?: {
    _id: string
    orderNumber: string
    status: string
  }
  read: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export type NotificationFilters = {
  read?: boolean
  page?: number
  limit?: number
}

export type NotificationResponse = {
  success: boolean
  count?: number
  total?: number
  unreadCount?: number
  page?: number
  pages?: number
  data: Notification[]
}


export async function getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
  const params = new URLSearchParams()
  if (filters.read !== undefined) params.append("read", filters.read.toString())
  if (filters.page) params.append("page", filters.page.toString())
  if (filters.limit) params.append("limit", filters.limit.toString())

  return apiClient.get<NotificationResponse>(`/notifications?${params.toString()}`)
}


export async function markAsRead(id: string): Promise<{ success: boolean; message: string; data: Notification }> {
  return apiClient.put(`/notifications/${id}/read`, {})
}


export async function markAllAsRead(): Promise<{ success: boolean; message: string }> {
  return apiClient.put("/notifications/read-all", {})
}


export async function deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient.delete(`/notifications/${id}`)
}

