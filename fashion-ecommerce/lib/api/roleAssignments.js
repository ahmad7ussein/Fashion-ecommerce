import apiClient from './client';
export const roleAssignmentsApi = {
    getAssignments() {
        return apiClient.get('/role-assignments');
    },
    getMyAssignments() {
        return apiClient.get('/role-assignments/me');
    },
    createAssignment(payload) {
        return apiClient.post('/role-assignments', payload);
    },
    updateAssignmentStatus(id, payload) {
        return apiClient.put(`/role-assignments/${id}/status`, payload);
    },
};
