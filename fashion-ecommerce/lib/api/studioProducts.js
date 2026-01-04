import apiClient from "./client";
export const studioProductsApi = {
    async getActive() {
        const res = await apiClient.get("/studio-products/active");
        if (Array.isArray(res))
            return res;
        if (res && typeof res === "object" && "data" in res)
            return Array.isArray(res.data) ? res.data : [];
        return [];
    },
    async getAll() {
        const res = await apiClient.get("/studio-products");
        if (Array.isArray(res))
            return res;
        if (res && typeof res === "object" && "data" in res)
            return Array.isArray(res.data) ? res.data : [];
        return [];
    },
    async create(data) {
        return apiClient.post("/studio-products", data);
    },
    async update(id, data) {
        return apiClient.put(`/studio-products/${id}`, data);
    },
    async remove(id) {
        await apiClient.delete(`/studio-products/${id}`);
    },
};
