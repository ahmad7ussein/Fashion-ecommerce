import apiClient from './client';
export const vendorApi = {
    getProducts(params) {
        const query = new URLSearchParams();
        if (params?.vendorUserId)
            query.append('vendorUserId', params.vendorUserId);
        if (params?.all)
            query.append('all', 'true');
        const qs = query.toString();
        return apiClient.get(`/vendor/products${qs ? `?${qs}` : ''}`);
    },
    createProduct(payload) {
        return apiClient.post('/vendor/products', payload);
    },
    updateProduct(id, payload) {
        return apiClient.put(`/vendor/products/${id}`, payload);
    },
    getOrders() {
        return apiClient.get('/vendor/orders');
    },
    getReport() {
        return apiClient.get('/vendor/reports');
    },
    approveProduct(id, reviewNotes) {
        return apiClient.put(`/vendor/products/${id}/approve`, { reviewNotes });
    },
    rejectProduct(id, reviewNotes) {
        return apiClient.put(`/vendor/products/${id}/reject`, { reviewNotes });
    },
};
