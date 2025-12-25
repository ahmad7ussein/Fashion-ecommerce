import apiClient from "./client"

export type ContactMessage = {
  _id?: string
  name: string
  email: string
  subject: string
  message: string
  status?: 'new' | 'read' | 'replied' | 'archived'
  readAt?: string
  repliedAt?: string
  repliedBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  replyMessage?: string
  createdAt?: string
  updatedAt?: string
}

export type ContactMessageFilters = {
  status?: string
  page?: number
  limit?: number
  search?: string
}

export type ContactMessageResponse = {
  success: boolean
  count?: number
  total?: number
  page?: number
  pages?: number
  statusCounts?: {
    new: number
    read: number
    replied: number
    archived: number
  }
  data: ContactMessage[]
}

// Create a new contact message (Public)
export async function createContactMessage(data: {
  name: string
  email: string
  subject: string
  message: string
}): Promise<{ success: boolean; message: string; data: ContactMessage }> {
  return apiClient.post("/contact", data)
}

// Get all contact messages (Admin/Employee only)
export async function getContactMessages(
  filters: ContactMessageFilters = {}
): Promise<ContactMessageResponse> {
  const params = new URLSearchParams()
  if (filters.status) params.append("status", filters.status)
  if (filters.page) params.append("page", filters.page.toString())
  if (filters.limit) params.append("limit", filters.limit.toString())
  if (filters.search) params.append("search", filters.search)

  return apiClient.get<ContactMessageResponse>(`/contact?${params.toString()}`)
}

// Get single contact message (Admin/Employee only)
export async function getContactMessage(id: string): Promise<{ success: boolean; data: ContactMessage }> {
  return apiClient.get(`/contact/${id}`)
}

// Update contact message (Admin/Employee only)
export async function updateContactMessage(
  id: string,
  data: {
    status?: string
    replyMessage?: string
  }
): Promise<{ success: boolean; message: string; data: ContactMessage }> {
  return apiClient.put(`/contact/${id}`, data)
}

// Delete contact message (Admin only)
export async function deleteContactMessage(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient.delete(`/contact/${id}`)
}

