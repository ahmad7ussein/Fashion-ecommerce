import apiClient from "./client";
export const reviewsApi = {
    async getApprovedReviews(params) {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        const response = await apiClient.get(`/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ""}`);
        if (response && typeof response === 'object' && 'data' in response) {
            return {
                data: response.data,
                total: response.total || 0,
                page: response.page || 1,
                pages: response.pages || 1,
            };
        }
        return {
            data: [],
            total: 0,
            page: 1,
            pages: 0,
        };
    },
    async getMyReviews() {
        const response = await apiClient.get("/reviews/my-reviews");
        if (Array.isArray(response)) {
            return response;
        }
        if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data : [];
        }
        return [];
    },
    async createReview(reviewData) {
        const response = await apiClient.post("/reviews", reviewData);
        if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
            return response.data;
        }
        return response;
    },
    async getAllReviews(params) {
        const queryParams = new URLSearchParams();
        if (params?.status)
            queryParams.append("status", params.status);
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        const response = await apiClient.get(`/reviews/all${queryParams.toString() ? `?${queryParams.toString()}` : ""}`);
        if (response && typeof response === 'object' && 'data' in response) {
            return {
                data: response.data,
                total: response.total || 0,
                page: response.page || 1,
                pages: response.pages || 1,
            };
        }
        return {
            data: [],
            total: 0,
            page: 1,
            pages: 0,
        };
    },
    async updateReviewStatus(id, status, adminResponse) {
        const response = await apiClient.put(`/reviews/${id}/status`, { status, adminResponse });
        if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
            return response.data;
        }
        return response;
    },
    async deleteReview(id) {
        return await apiClient.delete(`/reviews/${id}`);
    },
};
