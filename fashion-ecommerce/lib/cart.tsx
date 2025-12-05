"use client"

import React from "react"
import { useAuth } from "./auth"
import { cartApi, type CartItem as ApiCartItem } from "./api/cart"
import logger from "./logger"

export type CartItem = {
  id: string
  _id?: string
  name: string
  price: number
  quantity: number
  size: string
  color: string
  image: string
  isCustom?: boolean
}

type CartState = {
  items: CartItem[]
  isLoading: boolean
}

type CartContextValue = CartState & {
  addItem: (item: CartItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, qty: number) => Promise<void>
  clear: () => Promise<void>
  refreshCart: () => Promise<void>
  subtotal: number
  itemCount: number
}

const CartContext = React.createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const { user, isAuthenticated } = useAuth()

  // Load cart from database (for both authenticated users and guests)
  const loadCart = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Always load from database (works for both authenticated and guest users)
      const cart = await cartApi.getCart()
      
      // Ensure cart and items exist
      if (!cart) {
        logger.warn("Cart response is null or undefined")
        setItems([])
        setIsLoading(false)
        return
      }
      
      if (!cart.items || !Array.isArray(cart.items)) {
        logger.warn("Cart items is not an array:", cart.items)
        setItems([])
        setIsLoading(false)
        return
      }
      
      const cartItems: CartItem[] = cart.items.map((item: ApiCartItem) => ({
        id: item._id || `${item.product || item.design}-${item.size}-${item.color}`,
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        isCustom: item.isCustom || false,
      }))
      setItems(cartItems)
      logger.log("Cart loaded successfully:", { itemsCount: cartItems.length })
    } catch (error: any) {
      // Always log detailed error information
      const errorDetails = {
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url,
        method: error?.method,
        responseBody: error?.responseBody,
        responseHeaders: error?.responseHeaders,
        stack: error?.stack,
        originalError: error?.originalError,
        fullError: error,
      };
      
      // Log full error details
      logger.error("Failed to load cart from API", errorDetails);
      
      // Also log to console for debugging
      console.error("[CartProvider] Cart loading failed with details:", errorDetails);
      
      // On error, set empty cart (graceful degradation)
      setItems([])
      setIsLoading(false)
    }
  }, [])

  // Load cart only when user exists (not when user is null)
  React.useEffect(() => {
    if (user) {
      loadCart()
    }
  }, [user, loadCart])

  const addItem = async (item: CartItem) => {
    // Check if user is authenticated - require login to add to cart
    if (!isAuthenticated || !user) {
      // Throw error that will be caught by the calling component
      const error = new Error("AUTHENTICATION_REQUIRED")
      error.name = "AuthenticationRequired"
      throw error
    }

    try {
      // Extract product ID from item.id if it's a product (format: "productId-size-color")
      let productId: string | undefined = undefined
      if (!item.isCustom && item.id) {
        const parts = item.id.split("-")
        // If it's a product ID (numeric or MongoDB ObjectId format)
        if (parts.length > 0) {
          // Try to extract product ID (first part before size/color)
          const possibleId = parts[0]
          // Check if it's a MongoDB ObjectId format (24 hex chars) or numeric
          if (/^[0-9a-fA-F]{24}$/.test(possibleId) || /^\d+$/.test(possibleId)) {
            productId = possibleId
          }
        }
      }
      
      // Add to database (only for authenticated users now)
      await cartApi.addItem({
        product: productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        isCustom: item.isCustom || false,
      })
      await loadCart()
    } catch (error: any) {
      logger.error("Failed to add item to cart:", error)
      // Re-throw authentication errors
      if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
        throw error
      }
      // On other errors, update local state optimistically
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id)
        if (idx !== -1) {
          const copy = [...prev]
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity }
          return copy
        }
        return [...prev, item]
      })
    }
  }

  const removeItem = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id || i._id === id)
      if (item?._id) {
        await cartApi.removeItem(item._id)
        await loadCart()
      } else {
        // If no _id, just remove from local state
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (error: any) {
      logger.error("Failed to remove item from cart:", error)
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const updateQuantity = async (id: string, qty: number) => {
    const finalQty = Math.max(1, qty)
    try {
      const item = items.find((i) => i.id === id || i._id === id)
      if (item?._id) {
        // Update in database immediately
        await cartApi.updateItemQuantity(item._id, finalQty)
        // Update local state immediately for better UX
        setItems((prev) => prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i)))
        // Reload from database to ensure sync
        await loadCart()
      } else {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: finalQty } : i)))
      }
    } catch (error: any) {
      logger.error("Failed to update cart item:", error)
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: finalQty } : i)))
    }
  }

  const clear = async () => {
    try {
      await cartApi.clearCart()
      await loadCart()
    } catch (error: any) {
      logger.error("Failed to clear cart:", error)
      setItems([])
    }
  }

  const subtotal = React.useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const itemCount = React.useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const value: CartContextValue = {
    items,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    refreshCart: loadCart,
    subtotal,
    itemCount,
  }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
