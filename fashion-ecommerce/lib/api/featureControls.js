import apiClient from './client';
export const featureControlsApi = {
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
    getHomeSliderSettings() {
        return apiClient.get('/feature-controls/home-slider');
    },
    updateHomeSliderSettings(payload) {
        return apiClient.put('/feature-controls/home-slider', payload);
    },
    uploadHomeSliderImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        return apiClient.post('/feature-controls/home-slider/upload', formData);
    },
};
