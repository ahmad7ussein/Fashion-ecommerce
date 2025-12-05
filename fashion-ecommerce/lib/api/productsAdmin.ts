import apiClient from "./client"
import type { Product } from "./products"

export const productsAdminApi = {
  async createProduct(productData: {
    name: string
    nameAr?: string
    description?: string
    descriptionAr?: string
    price: number
    image: string
    images?: string[]
    category: string
    gender: string
    season: string
    style: string
    occasion: string
    sizes?: string[]
    colors?: string[]
    stock?: number
    featured?: boolean
    active?: boolean
  }): Promise<Product> {
    return await apiClient.post<Product>("/products", productData)
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    return await apiClient.put<Product>(`/products/${id}`, productData)
  },

  async deleteProduct(id: string): Promise<void> {
    return await apiClient.delete(`/products/${id}`)
  },

  async getAllProducts(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }): Promise<{ data: Product[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.category) queryParams.append("category", params.category)

    const response = await apiClient.get(`/products?${queryParams.toString()}`)
    
    // Handle response structure - backend returns { success: true, data: [...], total, page, pages }
    if (response && typeof response === 'object') {
      if ('data' in response && Array.isArray(response.data)) {
        return {
          data: response.data,
          total: (response as any).total || response.data.length,
          page: (response as any).page || 1,
          pages: (response as any).pages || 1,
        }
      }
      // If response is already in the correct format
      if ('total' in response && 'data' in response) {
        return response as { data: Product[]; total: number; page: number; pages: number }
      }
      // If response is an array
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          pages: 1,
        }
      }
    }
    
    return {
      data: [],
      total: 0,
      page: 1,
      pages: 1,
    }
  },
}

