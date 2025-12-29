import apiClient from './client';

export type RoleAssignment = {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  role: 'service_provider' | 'partner';
  status: 'active' | 'disabled';
  partnerStore?: { _id: string; name: string; slug: string } | string;
  notes?: string;
};

export const roleAssignmentsApi = {
  getAssignments(): Promise<RoleAssignment[]> {
    return apiClient.get('/role-assignments');
  },
  getMyAssignments(): Promise<RoleAssignment[]> {
    return apiClient.get('/role-assignments/me');
  },
  createAssignment(payload: {
    role: 'service_provider' | 'partner';
    userId?: string;
    email?: string;
    partnerStoreId?: string;
    notes?: string;
  }): Promise<RoleAssignment> {
    return apiClient.post('/role-assignments', payload);
  },
  updateAssignmentStatus(id: string, payload: { status: 'active' | 'disabled'; notes?: string }): Promise<RoleAssignment> {
    return apiClient.put(`/role-assignments/${id}/status`, payload);
  },
};
