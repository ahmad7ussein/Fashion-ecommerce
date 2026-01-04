import apiClient from "./client";
export const cartApi = {
    async getCart() {
        try {
            const response = await apiClient.get("/cart");
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                const enhancedError = new Error(`Failed to get cart: ${error.message}`);
                enhancedError.status = error.status;
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },
    async addItem(item) {
        try {
            const response = await apiClient.post("/cart/items", item);
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                const enhancedError = new Error(`Failed to add item to cart: ${error.message}`);
                enhancedError.status = error.status;
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },
    async updateItemQuantity(itemId, quantity) {
        try {
            const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                const enhancedError = new Error(`Failed to update cart item quantity: ${error.message}`);
                enhancedError.status = error.status;
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },
    async removeItem(itemId) {
        try {
            const response = await apiClient.delete(`/cart/items/${itemId}`);
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                const enhancedError = new Error(`Failed to remove item from cart: ${error.message}`);
                enhancedError.status = error.status;
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },
    async clearCart() {
        try {
            const response = await apiClient.delete("/cart");
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                const enhancedError = new Error(`Failed to clear cart: ${error.message}`);
                enhancedError.status = error.status;
                enhancedError.originalError = error;
                throw enhancedError;
            }
            throw error;
        }
    },
};
