import apiClient from "./client";
export const productsAdminApi = {
    async createProduct(productData) {
        const hasFiles = productData.image instanceof File ||
            (productData.images && productData.images.length > 0 && productData.images[0] instanceof File);
        if (hasFiles) {
            const formData = new FormData();
            formData.append('name', productData.name);
            if (productData.nameAr)
                formData.append('nameAr', productData.nameAr);
            if (productData.description)
                formData.append('description', productData.description);
            if (productData.descriptionAr)
                formData.append('descriptionAr', productData.descriptionAr);
            formData.append('price', productData.price.toString());
            formData.append('category', productData.category);
            formData.append('gender', productData.gender);
            formData.append('season', productData.season);
            formData.append('style', productData.style);
            formData.append('occasion', productData.occasion);
            if (productData.stock)
                formData.append('stock', productData.stock.toString());
            if (productData.featured !== undefined)
                formData.append('featured', productData.featured.toString());
            if (productData.active !== undefined)
                formData.append('active', productData.active.toString());
            if (productData.onSale !== undefined)
                formData.append('onSale', productData.onSale.toString());
            if (productData.inCollection !== undefined)
                formData.append('inCollection', productData.inCollection.toString());
            if (productData.salePercentage)
                formData.append('salePercentage', productData.salePercentage.toString());
            if (productData.sizes && productData.sizes.length > 0) {
                productData.sizes.forEach(size => formData.append('sizes[]', size));
            }
            if (productData.colors && productData.colors.length > 0) {
                productData.colors.forEach(color => formData.append('colors[]', color));
            }
            if (productData.image instanceof File) {
                formData.append('image', productData.image);
            }
            else if (productData.image) {
                formData.append('image', productData.image);
            }
            if (productData.images && productData.images.length > 0) {
                productData.images.forEach((img) => {
                    if (img instanceof File) {
                        formData.append('images', img);
                    }
                    else if (typeof img === 'string') {
                        formData.append('images', img);
                    }
                });
            }
            return await apiClient.post("/products", formData);
        }
        else {
            return await apiClient.post("/products", productData);
        }
    },
    async updateProduct(id, productData) {
        const hasFiles = productData.image instanceof File ||
            (productData.images && productData.images.length > 0 && productData.images[0] instanceof File);
        if (hasFiles) {
            const formData = new FormData();
            Object.keys(productData).forEach(key => {
                const value = productData[key];
                if (value === undefined || value === null)
                    return;
                if (key === 'image' && value instanceof File) {
                    formData.append('image', value);
                    return;
                }
                if (key === 'images' && Array.isArray(value) && value[0] instanceof File) {
                    value.forEach((img) => formData.append('images', img));
                    return;
                }
                if (Array.isArray(value)) {
                    value.forEach((item) => {
                        if (typeof item === 'string' || typeof item === 'number') {
                            formData.append(`${key}[]`, item.toString());
                        }
                    });
                }
                else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                }
                else {
                    formData.append(key, value.toString());
                }
            });
            if (productData.image && typeof productData.image === 'string') {
                formData.append('image', productData.image);
            }
            if (productData.images && Array.isArray(productData.images)) {
                productData.images.forEach((img) => {
                    if (typeof img === 'string') {
                        formData.append('images', img);
                    }
                });
            }
            return await apiClient.put(`/products/${id}`, formData);
        }
        else {
            return await apiClient.put(`/products/${id}`, productData);
        }
    },
    async deleteProduct(id) {
        return await apiClient.delete(`/products/${id}`);
    },
    async getAllProducts(params) {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append("page", params.page.toString());
        if (params?.limit)
            queryParams.append("limit", params.limit.toString());
        if (params?.search)
            queryParams.append("search", params.search);
        if (params?.category)
            queryParams.append("category", params.category);
        queryParams.append("includeInactive", "true");
        const response = await apiClient.get(`/products?${queryParams.toString()}`);
        if (response && typeof response === 'object') {
            if ('data' in response && Array.isArray(response.data)) {
                return {
                    data: response.data,
                    total: response.total || response.data.length,
                    page: response.page || 1,
                    pages: response.pages || 1,
                };
            }
            if ('total' in response && 'data' in response) {
                return response;
            }
            if (Array.isArray(response)) {
                return {
                    data: response,
                    total: response.length,
                    page: 1,
                    pages: 1,
                };
            }
        }
        return {
            data: [],
            total: 0,
            page: 1,
            pages: 1,
        };
    },
};
