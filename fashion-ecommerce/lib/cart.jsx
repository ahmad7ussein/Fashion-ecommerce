"use client";
import React from "react";
import { useAuth } from "./auth";
import { cartApi } from "./api/cart";
import logger from "./logger";
const CartContext = React.createContext(null);
const LOCAL_CART_KEY = "fashionhub_local_cart";
const parseProductIdFromItem = (item) => {
    if (item.product)
        return item.product;
    const [maybeId] = (item.id || "").split("-");
    if (/^[0-9a-fA-F]{24}$/.test(maybeId) || /^\d+$/.test(maybeId))
        return maybeId;
    return undefined;
};
export function CartProvider({ children }) {
    const [items, setItems] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const { user, isAuthenticated } = useAuth();
    const loadGuestCart = React.useCallback(() => {
        try {
            const raw = localStorage.getItem(LOCAL_CART_KEY);
            if (!raw) {
                setItems([]);
                return;
            }
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setItems(parsed);
            }
            else {
                setItems([]);
            }
        }
        catch (error) {
            logger.warn("Failed to load guest cart from localStorage", error);
            setItems([]);
        }
    }, []);
    const persistGuestCart = React.useCallback((next) => {
        try {
            localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(next));
        }
        catch (error) {
            logger.warn("Failed to persist guest cart", error);
        }
    }, []);
    const loadCart = React.useCallback(async () => {
        if (!isAuthenticated || !user) {
            setIsLoading(false);
            loadGuestCart();
            return;
        }
        setIsLoading(true);
        try {
            const cart = await cartApi.getCart();
            if (!cart) {
                logger.warn("Cart response is null or undefined");
                setItems([]);
                setIsLoading(false);
                return;
            }
            if (!cart.items || !Array.isArray(cart.items)) {
                logger.warn("Cart items is not an array:", cart.items);
                setItems([]);
                setIsLoading(false);
                return;
            }
            const cartItems = cart.items.map((item) => ({
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
                notes: item.notes || "",
                baseProductId: item.baseProductId,
                baseProduct: item.baseProduct || null,
                designMetadata: item.designMetadata || null,
                designKey: item.designKey || "",
            }));
            setItems(cartItems);
            logger.log("Cart loaded successfully:", { itemsCount: cartItems.length });
        }
        catch (error) {
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
            logger.error("Failed to load cart from API", errorDetails);
            console.error("[CartProvider] Cart loading failed with details:", errorDetails);
            setItems([]);
            setIsLoading(false);
        }
    }, [isAuthenticated, user, loadGuestCart]);
    React.useEffect(() => {
        if (isAuthenticated && user) {
            loadCart();
        }
        else {
            loadGuestCart();
        }
    }, [user, isAuthenticated, loadCart, loadGuestCart]);
    const addItem = async (item) => {
        try {
            if (isAuthenticated && user) {
                const productId = parseProductIdFromItem(item);
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
                    notes: item.notes || "",
                    baseProductId: item.baseProductId,
                    baseProduct: item.baseProduct,
                    designMetadata: item.designMetadata,
                    designKey: item.designKey,
                });
                await loadCart();
                return;
            }
            setItems((prev) => {
                const existingIndex = prev.findIndex((i) => i.id === item.id);
                const productId = parseProductIdFromItem(item);
                if (existingIndex !== -1) {
                    const copy = [...prev];
                    copy[existingIndex] = { ...copy[existingIndex], quantity: copy[existingIndex].quantity + item.quantity, product: productId || copy[existingIndex].product };
                    persistGuestCart(copy);
                    return copy;
                }
                const next = [...prev, { ...item, product: productId }];
                persistGuestCart(next);
                return next;
            });
        }
        catch (error) {
            logger.error("Failed to add item to cart:", error);
            setItems((prev) => {
                const idx = prev.findIndex((i) => i.id === item.id);
                if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
                    if (!isAuthenticated)
                        persistGuestCart(copy);
                    return copy;
                }
                const next = [...prev, item];
                if (!isAuthenticated)
                    persistGuestCart(next);
                return next;
            });
        }
    };
    const removeItem = async (id) => {
        try {
            const item = items.find((i) => i.id === id || i._id === id);
            if (isAuthenticated && item?._id) {
                try {
                    await cartApi.removeItem(item._id);
                    await loadCart();
                    return;
                }
                catch (error) {
                    logger.warn("Failed to remove item from database, removing from local state:", error);
                }
            }
            setItems((prev) => {
                const next = prev.filter((i) => (i.id !== id && i._id !== id));
                if (!isAuthenticated)
                    persistGuestCart(next);
                return next;
            });
        }
        catch (error) {
            logger.error("Failed to remove item from cart:", error);
            setItems((prev) => {
                const next = prev.filter((i) => (i.id !== id && i._id !== id));
                if (!isAuthenticated)
                    persistGuestCart(next);
                return next;
            });
        }
    };
    const updateQuantity = async (id, qty) => {
        const finalQty = Math.max(1, qty);
        try {
            const item = items.find((i) => i.id === id || i._id === id);
            if (isAuthenticated && item?._id) {
                try {
                    await cartApi.updateItemQuantity(item._id, finalQty);
                    setItems((prev) => prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i)));
                    await loadCart();
                    return;
                }
                catch (error) {
                    logger.warn("Failed to update item in database, updating local state:", error);
                }
            }
            setItems((prev) => {
                const next = prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i));
                if (!isAuthenticated)
                    persistGuestCart(next);
                return next;
            });
        }
        catch (error) {
            logger.error("Failed to update cart item:", error);
            setItems((prev) => {
                const next = prev.map((i) => (i.id === id || i._id === id ? { ...i, quantity: finalQty } : i));
                if (!isAuthenticated)
                    persistGuestCart(next);
                return next;
            });
        }
    };
    const clear = async () => {
        try {
            if (isAuthenticated) {
                try {
                    await cartApi.clearCart();
                    await loadCart();
                    return;
                }
                catch (error) {
                    logger.warn("Failed to clear cart in database, clearing local state:", error);
                }
            }
            setItems([]);
            if (!isAuthenticated)
                persistGuestCart([]);
        }
        catch (error) {
            logger.error("Failed to clear cart:", error);
            setItems([]);
            if (!isAuthenticated)
                persistGuestCart([]);
        }
    };
    const subtotal = React.useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
    const itemCount = React.useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
    const value = {
        items,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        refreshCart: loadCart,
        subtotal,
        itemCount,
    };
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
    const ctx = React.useContext(CartContext);
    if (!ctx)
        throw new Error("useCart must be used within CartProvider");
    return ctx;
}
