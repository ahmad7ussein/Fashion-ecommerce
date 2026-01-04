import apiClient from './client';
export const suppliersApi = {
    getSuppliers() {
        return apiClient.get('/suppliers');
    },
    createSupplier(payload) {
        return apiClient.post('/suppliers', payload);
    },
    updateSupplier(id, payload) {
        return apiClient.put(`/suppliers/${id}`, payload);
    },
    updateSupplierStatus(id, status) {
        return apiClient.put(`/suppliers/${id}/status`, { status });
    },
    getSupplierAnalytics(id) {
        return apiClient.get(`/suppliers/${id}/analytics`);
    },
    getSupplierProducts(params) {
        const query = new URLSearchParams();
        if (params?.status)
            query.append('status', params.status);
        if (params?.supplierId)
            query.append('supplierId', params.supplierId);
        const qs = query.toString();
        return apiClient.get(`/supplier-products${qs ? `?${qs}` : ''}`);
    },
    createSupplierProduct(payload) {
        return apiClient.post('/supplier-products', payload);
    },
    approveSupplierProduct(id, reviewNotes) {
        return apiClient.put(`/supplier-products/${id}/approve`, { reviewNotes });
    },
    rejectSupplierProduct(id, reviewNotes) {
        return apiClient.put(`/supplier-products/${id}/reject`, { reviewNotes });
    },
};
