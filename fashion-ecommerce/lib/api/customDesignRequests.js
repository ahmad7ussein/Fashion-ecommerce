import apiClient from './client';
export const customDesignRequestsApi = {
    createRequest(payload) {
        return apiClient.post('/custom-design-requests', payload);
    },
    getRequests() {
        return apiClient.get('/custom-design-requests');
    },
    updateRequestStatus(id, payload) {
        return apiClient.put(`/custom-design-requests/${id}/status`, payload);
    },
};
