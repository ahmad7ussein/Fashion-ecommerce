import apiClient from "./client";

export const accountDeletionsApi = {
    async requestDeletion(reason) {
        return await apiClient.post("/account-deletions", reason ? { reason } : {});
    },
    async getMyRequest() {
        return await apiClient.get("/account-deletions/my");
    },
    async getAllRequests(params) {
        const queryParams = new URLSearchParams();
        if (params?.status)
            queryParams.append("status", params.status);
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        const response = await apiClient.get(`/account-deletions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`);
        if (response && typeof response === "object" && "data" in response && Array.isArray(response.data)) {
            return {
                data: response.data,
                total: response.total || 0,
                page: response.page || 1,
                pages: response.pages || 1,
            };
        }
        if (Array.isArray(response)) {
            return {
                data: response,
                total: response.length,
                page: 1,
                pages: 1,
            };
        }
        return {
            data: [],
            total: 0,
            page: 1,
            pages: 0,
        };
    },
    async updateStatus(id, status, adminResponse) {
        return await apiClient.put(`/account-deletions/${id}/status`, {
            status,
            adminResponse,
        });
    },
};
