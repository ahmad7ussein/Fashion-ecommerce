import apiClient from "./client";
export const favoritesApi = {
    async getFavorites() {
        const response = await apiClient.get("/favorites");
        if (Array.isArray(response)) {
            return response;
        }
        if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data : [];
        }
        return [];
    },
    async checkFavorite(productId) {
        try {
            const response = await apiClient.get(`/favorites/check/${productId}`);
            return response?.isFavorite === true;
        }
        catch (error) {
            return false;
        }
    },
    async toggleFavorite(productId) {
        const response = await apiClient.post(`/favorites/toggle/${productId}`);
        return response;
    },
    async addFavorite(productId) {
        return apiClient.post(`/favorites/${productId}`);
    },
    async removeFavorite(productId) {
        return apiClient.delete(`/favorites/${productId}`);
    },
};
