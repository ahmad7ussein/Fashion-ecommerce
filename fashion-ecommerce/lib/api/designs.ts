import apiClient from "./client"

export type Design = {
  _id: string
  name: string
  baseProduct: {
    type: string
    color: string
    size: string
  }
  baseProductId?: string
  user: string | {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  elements: Array<{
    id: string
    type: "text" | "image"
    content: string
    x: number
    y: number
    width: number
    height: number
    rotation?: number
    fontSize?: number
    fontFamily?: string
    color?: string
    fontWeight?: string
  }>
  thumbnail?: string
  designImageURL?: string
  designMetadata?: Record<string, any>
  userDescription?: string
  type?: "manual" | "ai-enhanced"
  sourceDesign?: string
  aiModelUsed?: string
  promptUsed?: string
  price: number
  status: "draft" | "published" | "archived"
  createdAt: string
  updatedAt: string
}

export const designsApi = {
  async getMyDesigns(): Promise<Design[]> {
    const response = await apiClient.get<Design[] | { data: Design[] }>("/designs/my-designs")
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return []
  },

  async getDesign(id: string): Promise<Design> {
    return await apiClient.get<Design>(`/designs/${id}`)
  },

  async createDesign(designData: Partial<Design> & {
    name: string
    baseProduct: {
      type: string
      color: string
      size: string
    }
    baseProductId?: string
    elements: Array<{
      id: string
      type: "text" | "image"
      content: string
      x: number
      y: number
      width?: number
      height?: number
      rotation?: number
      fontSize?: number
      fontFamily?: string
      color?: string
      fontWeight?: string
    }>
    thumbnail?: string
    designImageURL?: string
    designMetadata?: Record<string, any>
    price?: number
    status?: "draft" | "published" | "archived"
  }): Promise<Design> {
    return await apiClient.post<Design>("/designs", designData)
  },

  async updateDesign(id: string, designData: Partial<Design>): Promise<Design> {
    return await apiClient.put<Design>(`/designs/${id}`, designData)
  },

  async deleteDesign(id: string): Promise<void> {
    return await apiClient.delete(`/designs/${id}`)
  },

  async publishDesign(id: string): Promise<Design> {
    return await apiClient.put<Design>(`/designs/${id}/publish`, {})
  },
}
