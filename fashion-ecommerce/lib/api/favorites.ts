import apiClient from "./client"
import type { Product } from "./products"

export const favoritesApi = {
  async getFavorites(): Promise<Product[]> {
    const response = await apiClient.get<Product[] | { data: Product[]; count?: number }>("/favorites")
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return []
  },

  async checkFavorite(productId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isFavorite: boolean }>(`/favorites/check/${productId}`)
      
      return response?.isFavorite === true
    } catch (error) {
      
      return false
    }
  },

  async toggleFavorite(productId: string): Promise<{ isFavorite: boolean; message: string }> {
    const response = await apiClient.post<{ isFavorite: boolean; message: string }>(`/favorites/toggle/${productId}`)
    return response
  },

  async addFavorite(productId: string): Promise<void> {
    await apiClient.post(`/favorites/${productId}`)
  },

  async removeFavorite(productId: string): Promise<void> {
    await apiClient.delete(`/favorites/${productId}`)
  },
}
