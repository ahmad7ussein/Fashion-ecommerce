import apiClient from './client';
import type { PartnerProductData } from './partners';

export type PartnerPanelStore = {
  _id: string;
  name: string;
  slug: string;
  website?: string;
  defaultCommissionRate: number;
  status: 'active' | 'disabled';
};

export type PartnerPanelProduct = {
  _id: string;
  productData: PartnerProductData;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type PartnerPanelAnalytics = {
  clicks: number;
  sales: number;
  revenue: number;
  earnedCommission: number;
};

export const partnerPanelApi = {
  getStore(): Promise<PartnerPanelStore> {
    return apiClient.get('/partner/store');
  },
  getProducts(): Promise<PartnerPanelProduct[]> {
    return apiClient.get('/partner/products');
  },
  createProduct(payload: { productData: PartnerProductData }): Promise<PartnerPanelProduct> {
    return apiClient.post('/partner/products', payload);
  },
  updateProduct(id: string, payload: { productData: Partial<PartnerProductData> }): Promise<PartnerPanelProduct> {
    return apiClient.put(`/partner/products/${id}`, payload);
  },
  getAnalytics(): Promise<PartnerPanelAnalytics> {
    return apiClient.get('/partner/analytics');
  },
};
