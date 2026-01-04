import apiClient from './client';
export const featureControlsApi = {
    getSimilarProductsSettings() {
        return apiClient.get('/feature-controls/similar-products');
    },
    updateSimilarProductsSettings(payload) {
        return apiClient.put('/feature-controls/similar-products', payload);
    },
    getSimilarProductsRecommendations(params) {
        const query = new URLSearchParams();
        if (params?.productId)
            query.append('productId', params.productId);
        if (params?.context)
            query.append('context', params.context);
        const qs = query.toString();
        return apiClient.get(`/feature-controls/similar-products/recommendations${qs ? `?${qs}` : ''}`);
    },
    getVirtualExperienceSettings() {
        return apiClient.get('/feature-controls/virtual-experience');
    },
    updateVirtualExperienceSettings(payload) {
        return apiClient.put('/feature-controls/virtual-experience', payload);
    },
    logVirtualExperienceUsage() {
        return apiClient.post('/feature-controls/virtual-experience/usage');
    },
    logVirtualExperienceConversion() {
        return apiClient.post('/feature-controls/virtual-experience/conversion');
    },
    getCustomDesignSettings() {
        return apiClient.get('/feature-controls/custom-design');
    },
    updateCustomDesignSettings(payload) {
        return apiClient.put('/feature-controls/custom-design', payload);
    },
};
