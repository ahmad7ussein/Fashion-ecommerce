import apiClient from './client';

export type CustomDesignRequest = {
  _id: string;
  user?: string;
  requesterName?: string;
  requesterEmail?: string;
  designName: string;
  textContent?: string;
  imageUrl?: string;
  printArea?: string;
  size?: string;
  additionalPrice?: number;
  totalPrice?: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: string;
};

export const customDesignRequestsApi = {
  createRequest(payload: Partial<CustomDesignRequest>): Promise<CustomDesignRequest> {
    return apiClient.post('/custom-design-requests', payload);
  },
  getRequests(): Promise<CustomDesignRequest[]> {
    return apiClient.get('/custom-design-requests');
  },
  updateRequestStatus(id: string, payload: { status: 'pending' | 'approved' | 'rejected'; reviewNotes?: string }): Promise<CustomDesignRequest> {
    return apiClient.put(`/custom-design-requests/${id}/status`, payload);
  },
};
