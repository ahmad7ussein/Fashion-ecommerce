import apiClient from './client';

export type PartnerStore = {
  _id: string;
  name: string;
  slug: string;
  website?: string;
  defaultCommissionRate: number;
  status: 'active' | 'disabled';
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
};

export type PartnerProductData = {
  name: string;
  description?: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  gender: string;
  season: string;
  style: string;
  occasion: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  productUrl?: string;
  commissionRate?: number;
};

export type PartnerProduct = {
  _id: string;
  partnerStore: PartnerStore | string;
  productData: PartnerProductData;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: string;
};

export type PartnerAnalytics = {
  clicks: number;
  sales: number;
  revenue: number;
  earnedCommission: number;
};

export const partnersApi = {
  getPartnerStores(): Promise<PartnerStore[]> {
    return apiClient.get('/partner-stores');
  },
  createPartnerStore(payload: Partial<PartnerStore>): Promise<PartnerStore> {
    return apiClient.post('/partner-stores', payload);
  },
  updatePartnerStore(id: string, payload: Partial<PartnerStore>): Promise<PartnerStore> {
    return apiClient.put(`/partner-stores/${id}`, payload);
  },
  updatePartnerStoreStatus(id: string, status: 'active' | 'disabled'): Promise<PartnerStore> {
    return apiClient.put(`/partner-stores/${id}/status`, { status });
  },
  getPartnerAnalytics(id: string): Promise<PartnerAnalytics> {
    return apiClient.get(`/partner-stores/${id}/analytics`);
  },
  getPartnerProducts(params?: { status?: string; storeId?: string }): Promise<PartnerProduct[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.storeId) query.append('storeId', params.storeId);
    const qs = query.toString();
    return apiClient.get(`/partner-products${qs ? `?${qs}` : ''}`);
  },
  createPartnerProduct(payload: { partnerStoreId: string; productData: PartnerProductData }): Promise<PartnerProduct> {
    return apiClient.post('/partner-products', payload);
  },
  approvePartnerProduct(id: string, reviewNotes?: string): Promise<PartnerProduct> {
    return apiClient.put(`/partner-products/${id}/approve`, { reviewNotes });
  },
  rejectPartnerProduct(id: string, reviewNotes?: string): Promise<PartnerProduct> {
    return apiClient.put(`/partner-products/${id}/reject`, { reviewNotes });
  },
};
