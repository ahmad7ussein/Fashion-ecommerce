import apiClient from './client';

export type SimilarProductsSettings = {
  _id?: string;
  enabled: boolean;
  maxItems: number;
  prioritizeInStore: boolean;
  prioritizePartner: boolean;
  autoWhenNoPurchase: boolean;
};

export type VirtualExperienceSettings = {
  _id?: string;
  enabled: boolean;
  supportedProductIds: string[];
  supportedCategories: string[];
  usageCount: number;
  conversionCount: number;
};

export type PrintArea = {
  name: string;
  width: number;
  height: number;
  unit: string;
};

export type CustomDesignSettings = {
  _id?: string;
  enabled: boolean;
  allowedFonts: string[];
  printAreas: PrintArea[];
  allowText: boolean;
  allowImages: boolean;
  maxTextLength: number;
  additionalPrices: {
    text: number;
    image: number;
    size: number;
  };
  requireApproval: boolean;
};

export const featureControlsApi = {
  getSimilarProductsSettings(): Promise<SimilarProductsSettings> {
    return apiClient.get('/feature-controls/similar-products');
  },
  updateSimilarProductsSettings(payload: Partial<SimilarProductsSettings>): Promise<SimilarProductsSettings> {
    return apiClient.put('/feature-controls/similar-products', payload);
  },
  getSimilarProductsRecommendations(params?: { productId?: string; context?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.productId) query.append('productId', params.productId);
    if (params?.context) query.append('context', params.context);
    const qs = query.toString();
    return apiClient.get(`/feature-controls/similar-products/recommendations${qs ? `?${qs}` : ''}`);
  },
  getVirtualExperienceSettings(): Promise<VirtualExperienceSettings> {
    return apiClient.get('/feature-controls/virtual-experience');
  },
  updateVirtualExperienceSettings(payload: Partial<VirtualExperienceSettings>): Promise<VirtualExperienceSettings> {
    return apiClient.put('/feature-controls/virtual-experience', payload);
  },
  logVirtualExperienceUsage(): Promise<VirtualExperienceSettings> {
    return apiClient.post('/feature-controls/virtual-experience/usage');
  },
  logVirtualExperienceConversion(): Promise<VirtualExperienceSettings> {
    return apiClient.post('/feature-controls/virtual-experience/conversion');
  },
  getCustomDesignSettings(): Promise<CustomDesignSettings> {
    return apiClient.get('/feature-controls/custom-design');
  },
  updateCustomDesignSettings(payload: Partial<CustomDesignSettings>): Promise<CustomDesignSettings> {
    return apiClient.put('/feature-controls/custom-design', payload);
  },
};
