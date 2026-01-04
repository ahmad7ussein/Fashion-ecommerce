import apiClient from "./client";
export const userPreferencesApi = {
    async getPreferences() {
        try {
            const response = await apiClient.get("/user-preferences");
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            try {
                console.warn("[WARNING] Failed to get preferences, using defaults");
            }
            catch {
            }
            return {
                _id: '',
                user: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
    },
    async updatePreferences(preferences) {
        try {
            const removeUndefined = (obj) => {
                if (obj === null || obj === undefined)
                    return undefined;
                if (Array.isArray(obj))
                    return obj.map(removeUndefined);
                if (typeof obj !== 'object')
                    return obj;
                const cleaned = {};
                for (const key in obj) {
                    if (obj[key] !== undefined) {
                        const cleanedValue = removeUndefined(obj[key]);
                        if (cleanedValue !== undefined) {
                            cleaned[key] = cleanedValue;
                        }
                    }
                }
                return Object.keys(cleaned).length > 0 ? cleaned : undefined;
            };
            const cleanedPreferences = removeUndefined(preferences);
            const dataToSend = cleanedPreferences && Object.keys(cleanedPreferences).length > 0
                ? cleanedPreferences
                : {};
            const response = await apiClient.put("/user-preferences", dataToSend);
            if (response && typeof response === 'object' && 'data' in response) {
                return response.data;
            }
            return response;
        }
        catch (error) {
            try {
                const errorMessage = error?.message || "Unknown error";
                const errorStatus = error?.status;
                const errorName = error?.name || "Error";
                try {
                    console.warn("[WARNING] Failed to update preferences (non-critical)");
                    console.warn("Error Message:", errorMessage);
                    if (errorStatus)
                        console.warn("Error Status:", errorStatus);
                    console.warn("Error Name:", errorName);
                }
                catch {
                }
            }
            catch {
            }
            return {
                _id: '',
                user: '',
                ...preferences,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }
    },
};
