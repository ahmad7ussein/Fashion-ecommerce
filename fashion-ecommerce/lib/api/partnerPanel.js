import apiClient from './client';
export const partnerPanelApi = {
    getStore() {
        return apiClient.get('/partner/store');
    },
    getProducts() {
        return apiClient.get('/partner/products');
    },
    createProduct(payload) {
        return apiClient.post('/partner/products', payload);
    },
    updateProduct(id, payload) {
        return apiClient.put(`/partner/products/${id}`, payload);
    },
    getAnalytics() {
        return apiClient.get('/partner/analytics');
    },
};
