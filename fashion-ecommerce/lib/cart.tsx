"use client"

import React from "react"
import { useAuth } from "./auth"
import { cartApi, type CartItem as ApiCartItem } from "./api/cart"
import logger from "./logger"

export type CartItem = {
  id: string
  _id?: string
  product?: string
  design?: string
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

const LOCAL_CART_KEY = "fashionhub_local_cart"
const parseProductIdFromItem = (item: CartItem) => {
  if (item.product) return item.product
  const [maybeId] = (item.id || "").split("-")
  if (/^[0-9a-fA-F]{24}$/.test(maybeId) || /^\d+$/.test(maybeId)) return maybeId
  return undefined
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const { user, isAuthenticated } = useAuth()

  const loadGuestCart = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CART_KEY)
      if (!raw) {
        setItems([])
        return
      }
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setItems(parsed)
      } else {
        setItems([])
      }
    } catch (error) {
      logger.warn("Failed to load guest cart from localStorage", error)
      setItems([])
    }
  }, [])

  const persistGuestCart = React.useCallback((next: CartItem[]) => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(next))
    } catch (error) {
      logger.warn("Failed to persist guest cart", error)
    }
  }, [])

  // Load cart from database (only for authenticated users)
  const loadCart = React.useCallback(async () => {
    // Only load cart if user is authenticated
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      loadGuestCart()
      return
    }
    
    setIsLoading(true)
    try {
      // Load from database (only for authenticated users)
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
        product: item.product,
        design: item.design,
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
  }, [isAuthenticated, user, loadGuestCart])

  // Load cart only when user exists (not when user is null)
  React.useEffect(() => {
    if (isAuthenticated && user) {
      loadCart()
    } else {
      loadGuestCart()
    }
  }, [user, isAuthenticated, loadCart, loadGuestCart])

  const addItem = async (item: CartItem) => {
    try {
      if (isAuthenticated && user) {
        // Extract product ID from item.id if it's a product (format: "productId-size-color")
        const productId = parseProductIdFromItem(item)
        
        await cartApi.addItem({
          product: productId,
          design: item.design,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
          isCustom: item.isCustom || false,
        })
        await loadCart()
        return
      }

      // Guest cart: update local state and persist
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === item.id)
        const productId = parseProductIdFromItem(item)
        if (existingIndex !== -1) {
          const copy = [...prev]
          copy[existingIndex] = { ...copy[existingIndex], quantity: copy[existingIndex].quantity + item.quantity, product: productId || copy[existingIndex].product }
          persistGuestCart(copy)
          return copy
        }
        const next = [...prev, { ...item, product: productId }]
        persistGuestCart(next)
        return next
      })
    } catch (error: any) {
      logger.error("Failed to add item to cart:", error)
      // On other errors, update local state optimistically
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id)
        if (idx !== -1) {
          const copy = [...prev]
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity }
          if (!isAuthenticated) persistGuestCart(copy)
          return copy
        }
        const next = [...prev, item]
        if (!isAuthenticated) persistGuestCart(next)
        return next
      })
    }
  }

  const removeItem = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id || i._id === id)
      
      // If user is authenticated and item has _id, remove from database
      if (isAuthenticated && item?._id) {
        try {
          await cartApi.removeItem(item._id)
          await loadCart()
          return
        } catch (error: any) {
          // If API call fails (e.g., user not authenticated), fallback to local removal
          logger.warn("Failed to remove item from database, removing from local state:", error)
          // Continue to local removal below
        }
      }
      
      // Remove from local state (for guest users or if API call failed)
      setItems((prev) => {
        const next = prev.filter((i) => (i.id !== id && i._id !== id))
        if (!isAuthenticated) persistGuestCart(next)
        return next
      })
    } catch (error: any) {
      logger.error("Failed to remove item from cart:", error)
      // Fallback: remove from local state anyway
      setItems((prev) => {
        const next = prev.filter((i) => (i.id !== id && i._id !== id))
        if (!isAuthenticated) persistGuestCart(next)
        return next
      })
    }
  }

  const updateQuantity = async (id: string, qty: number) => {
    const finalQty = Math.max(1, qty)
    try {
      const item = items.find((i) => i.id === id || i._id === id)
      
      // If user is authenticated and item has _id, update in database
      if (isAuthenticated && item?._id) {
        try {
          // Update in database immediately
          await cartApi.updateItemQuantity(item._id, finalQty)
          // Update local state immediately for better UX
          setItems((prev) => prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i)))
          // Reload from database to ensure sync
          await loadCart()
          return
        } catch (error: any) {
          // If API call fails (e.g., user not authenticated), fallback to local update
          logger.warn("Failed to update item in database, updating local state:", error)
          // Continue to local update below
        }
      }
      
      // Update local state (for guest users or if API call failed)
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i))
        if (!isAuthenticated) persistGuestCart(next)
        return next
      })
    } catch (error: any) {
      logger.error("Failed to update cart item:", error)
      // Fallback: update local state anyway
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i))
        if (!isAuthenticated) persistGuestCart(next)
        return next
      })
    }
  }

  const clear = async () => {
    try {
      // If user is authenticated, clear from database
      if (isAuthenticated) {
        try {
          await cartApi.clearCart()
          await loadCart()
          return
        } catch (error: any) {
          // If API call fails, fallback to local clear
          logger.warn("Failed to clear cart in database, clearing local state:", error)
        }
      }
      
      // Clear local state (for guest users or if API call failed)
      setItems([])
      if (!isAuthenticated) persistGuestCart([])
    } catch (error: any) {
      logger.error("Failed to clear cart:", error)
      // Fallback: clear local state anyway
      setItems([])
      if (!isAuthenticated) persistGuestCart([])
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
