import apiClient from './client';
export const partnersApi = {
    getPartnerStores() {
        return apiClient.get('/partner-stores');
    },
    createPartnerStore(payload) {
        return apiClient.post('/partner-stores', payload);
    },
    updatePartnerStore(id, payload) {
        return apiClient.put(`/partner-stores/${id}`, payload);
    },
    updatePartnerStoreStatus(id, status) {
        return apiClient.put(`/partner-stores/${id}/status`, { status });
    },
    getPartnerAnalytics(id) {
        return apiClient.get(`/partner-stores/${id}/analytics`);
    },
    getPartnerProducts(params) {
        const query = new URLSearchParams();
        if (params?.status)
            query.append('status', params.status);
        if (params?.storeId)
            query.append('storeId', params.storeId);
        const qs = query.toString();
        return apiClient.get(`/partner-products${qs ? `?${qs}` : ''}`);
    },
    createPartnerProduct(payload) {
        return apiClient.post('/partner-products', payload);
    },
    approvePartnerProduct(id, reviewNotes) {
        return apiClient.put(`/partner-products/${id}/approve`, { reviewNotes });
    },
    rejectPartnerProduct(id, reviewNotes) {
        return apiClient.put(`/partner-products/${id}/reject`, { reviewNotes });
    },
};
