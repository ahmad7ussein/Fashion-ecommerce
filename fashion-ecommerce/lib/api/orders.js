import apiClient from "./client";
export const ordersApi = {
    async getMyOrders() {
        const response = await apiClient.get("/orders/my-orders");
        if (Array.isArray(response)) {
            return response;
        }
        if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data : [];
        }
        return [];
    },
    async getAllOrders(params) {
        const queryParams = new URLSearchParams();
        if (params?.status)
            queryParams.append("status", params.status);
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        const queryString = queryParams.toString();
        const response = await apiClient.get(`/orders${queryString ? `?${queryString}` : ""}`);
        if (Array.isArray(response)) {
            return response;
        }
        if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data : [];
        }
        return [];
    },
    async getOrder(id) {
        return await apiClient.get(`/orders/${id}`);
    },
    async updateOrderStatus(id, data) {
        return await apiClient.put(`/orders/${id}/status`, data);
    },
    async deleteOrder(id) {
        await apiClient.delete(`/orders/${id}`);
    },
    async createOrder(orderData) {
        const response = await apiClient.post("/orders", orderData);
        if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
            return response.data;
        }
        return response;
    },
};
