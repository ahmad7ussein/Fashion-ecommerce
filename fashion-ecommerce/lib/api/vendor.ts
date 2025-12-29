import apiClient from './client';

export type VendorProductData = {
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
};

export type VendorProduct = {
  _id: string;
  vendorUser: string;
  productData: VendorProductData;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  publishedProductId?: string;
  createdAt: string;
};

export type VendorOrdersSummary = {
  orders: any[];
  totalSales: number;
  revenue: number;
};

export const vendorApi = {
  getProducts(params?: { vendorUserId?: string; all?: boolean }): Promise<VendorProduct[]> {
    const query = new URLSearchParams();
    if (params?.vendorUserId) query.append('vendorUserId', params.vendorUserId);
    if (params?.all) query.append('all', 'true');
    const qs = query.toString();
    return apiClient.get(`/vendor/products${qs ? `?${qs}` : ''}`);
  },
  createProduct(payload: { productData: VendorProductData }): Promise<VendorProduct> {
    return apiClient.post('/vendor/products', payload);
  },
  updateProduct(id: string, payload: { productData: Partial<VendorProductData> }): Promise<VendorProduct> {
    return apiClient.put(`/vendor/products/${id}`, payload);
  },
  getOrders(): Promise<VendorOrdersSummary> {
    return apiClient.get('/vendor/orders');
  },
  getReport(): Promise<{ totalSales: number; revenue: number }> {
    return apiClient.get('/vendor/reports');
  },
  approveProduct(id: string, reviewNotes?: string): Promise<VendorProduct> {
    return apiClient.put(`/vendor/products/${id}/approve`, { reviewNotes });
  },
  rejectProduct(id: string, reviewNotes?: string): Promise<VendorProduct> {
    return apiClient.put(`/vendor/products/${id}/reject`, { reviewNotes });
  },
};
