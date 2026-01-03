import apiClient from "./client"

export type CartItem = {
  _id?: string
  product?: string
  design?: string
  name: string
  price: number
  quantity: number
  size: string
  color: string
  image: string
  isCustom: boolean
}

export type Cart = {
  _id: string
  user?: string
  guestSessionId?: string
  items: CartItem[]
  subtotal: number
  createdAt: string
  updatedAt: string
}

export const cartApi = {
  async getCart(): Promise<Cart> {
    try {
      const response = await apiClient.get<Cart | { data: Cart }>("/cart")
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as Cart
    } catch (error: any) {
      
      if (error instanceof Error) {
        const enhancedError = new Error(`Failed to get cart: ${error.message}`);
        (enhancedError as any).status = (error as any).status;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      throw error;
    }
  },

  async addItem(item: {
    product?: string
    design?: string
    name: string
    price: number
    quantity: number
    size: string
    color: string
    image: string
    isCustom?: boolean
  }): Promise<Cart> {
    try {
      const response = await apiClient.post<Cart | { data: Cart }>("/cart/items", item)
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as Cart
    } catch (error: any) {
      if (error instanceof Error) {
        const enhancedError = new Error(`Failed to add item to cart: ${error.message}`);
        (enhancedError as any).status = (error as any).status;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      throw error;
    }
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<Cart> {
    try {
      const response = await apiClient.put<Cart | { data: Cart }>(`/cart/items/${itemId}`, { quantity })
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as Cart
    } catch (error: any) {
      if (error instanceof Error) {
        const enhancedError = new Error(`Failed to update cart item quantity: ${error.message}`);
        (enhancedError as any).status = (error as any).status;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      throw error;
    }
  },

  async removeItem(itemId: string): Promise<Cart> {
    try {
      const response = await apiClient.delete<Cart | { data: Cart }>(`/cart/items/${itemId}`)
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as Cart
    } catch (error: any) {
      if (error instanceof Error) {
        const enhancedError = new Error(`Failed to remove item from cart: ${error.message}`);
        (enhancedError as any).status = (error as any).status;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      throw error;
    }
  },

  async clearCart(): Promise<Cart> {
    try {
      const response = await apiClient.delete<Cart | { data: Cart }>("/cart")
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data
      }
      return response as Cart
    } catch (error: any) {
      if (error instanceof Error) {
        const enhancedError = new Error(`Failed to clear cart: ${error.message}`);
        (enhancedError as any).status = (error as any).status;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      throw error;
    }
  },
}

