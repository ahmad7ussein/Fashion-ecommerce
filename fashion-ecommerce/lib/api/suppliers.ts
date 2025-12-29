import apiClient from './client';

export type Supplier = {
  _id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  commissionRate: number;
  deliveryTime?: string;
  returnPolicy?: string;
  status: 'active' | 'disabled';
  ratingAverage: number;
  ratingCount: number;
};

export type SupplierProductData = {
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
  featured?: boolean;
  onSale?: boolean;
  salePercentage?: number;
  newArrival?: boolean;
  inCollection?: boolean;
};

export type SupplierProduct = {
  _id: string;
  supplier: Supplier | string;
  productData: SupplierProductData;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  publishedProductId?: string;
  createdAt: string;
};

export type SupplierAnalytics = {
  totalSales: number;
  revenue: number;
  ratings: {
    average: number;
    count: number;
  };
};

export const suppliersApi = {
  getSuppliers(): Promise<Supplier[]> {
    return apiClient.get('/suppliers');
  },
  createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
    return apiClient.post('/suppliers', payload);
  },
  updateSupplier(id: string, payload: Partial<Supplier>): Promise<Supplier> {
    return apiClient.put(`/suppliers/${id}`, payload);
  },
  updateSupplierStatus(id: string, status: 'active' | 'disabled'): Promise<Supplier> {
    return apiClient.put(`/suppliers/${id}/status`, { status });
  },
  getSupplierAnalytics(id: string): Promise<SupplierAnalytics> {
    return apiClient.get(`/suppliers/${id}/analytics`);
  },
  getSupplierProducts(params?: { status?: string; supplierId?: string }): Promise<SupplierProduct[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    const qs = query.toString();
    return apiClient.get(`/supplier-products${qs ? `?${qs}` : ''}`);
  },
  createSupplierProduct(payload: { supplierId: string; productData: SupplierProductData }): Promise<SupplierProduct> {
    return apiClient.post('/supplier-products', payload);
  },
  approveSupplierProduct(id: string, reviewNotes?: string): Promise<SupplierProduct> {
    return apiClient.put(`/supplier-products/${id}/approve`, { reviewNotes });
  },
  rejectSupplierProduct(id: string, reviewNotes?: string): Promise<SupplierProduct> {
    return apiClient.put(`/supplier-products/${id}/reject`, { reviewNotes });
  },
};
