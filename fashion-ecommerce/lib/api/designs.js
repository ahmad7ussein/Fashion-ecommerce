import apiClient from "./client";
export const designsApi = {
    async getMyDesigns() {
        const response = await apiClient.get("/designs/my-designs", {
            cache: "no-store",
            headers: { "Cache-Control": "no-store" },
        });
        if (Array.isArray(response)) {
            return response;
        }
        if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data : [];
        }
        return [];
    },
    async getDesign(id) {
        return await apiClient.get(`/designs/${id}`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-store" },
        });
    },
    async createDesign(designData) {
        return await apiClient.post("/designs", designData);
    },
    async updateDesign(id, designData) {
        return await apiClient.put(`/designs/${id}`, designData);
    },
    async deleteDesign(id) {
        return await apiClient.delete(`/designs/${id}`);
    },
    async publishDesign(id) {
        return await apiClient.put(`/designs/${id}/publish`, {});
    },
    async uploadAsset(file) {
        const formData = new FormData();
        formData.append("image", file);
        return await apiClient.post("/designs/upload", formData);
    },
    async exportDesign(id, imageData) {
        return await apiClient.post(`/designs/${id}/export`, { imageData });
    },
};
