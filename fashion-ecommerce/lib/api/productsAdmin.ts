import apiClient from "./client"
import type { Product } from "./products"

export const productsAdminApi = {
  async createProduct(productData: {
    name: string
    nameAr?: string
    description?: string
    descriptionAr?: string
    price: number
    image?: File | string // Can be File or URL string
    images?: File[] | string[] // Can be File array or URL array
    category: string
    gender: string
    season: string
    style: string
    occasion: string
    sizes?: string[]
    colors?: string[]
    stock?: number
    featured?: boolean
    active?: boolean
    onSale?: boolean
    salePercentage?: number
    inCollection?: boolean
  }): Promise<Product> {
    // Check if we have files to upload
    const hasFiles = productData.image instanceof File || 
                     (productData.images && productData.images.length > 0 && productData.images[0] instanceof File);
    
    if (hasFiles) {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', productData.name);
      if (productData.nameAr) formData.append('nameAr', productData.nameAr);
      if (productData.description) formData.append('description', productData.description);
      if (productData.descriptionAr) formData.append('descriptionAr', productData.descriptionAr);
      formData.append('price', productData.price.toString());
      formData.append('category', productData.category);
      formData.append('gender', productData.gender);
      formData.append('season', productData.season);
      formData.append('style', productData.style);
      formData.append('occasion', productData.occasion);
      if (productData.stock) formData.append('stock', productData.stock.toString());
      if (productData.featured !== undefined) formData.append('featured', productData.featured.toString());
      if (productData.active !== undefined) formData.append('active', productData.active.toString());
      if (productData.onSale !== undefined) formData.append('onSale', productData.onSale.toString());
      if (productData.inCollection !== undefined) formData.append('inCollection', productData.inCollection.toString());
      if (productData.salePercentage) formData.append('salePercentage', productData.salePercentage.toString());
      
      // Add sizes array
      if (productData.sizes && productData.sizes.length > 0) {
        productData.sizes.forEach(size => formData.append('sizes[]', size));
      }
      
      // Add colors array
      if (productData.colors && productData.colors.length > 0) {
        productData.colors.forEach(color => formData.append('colors[]', color));
      }
      
      // Add main image
      if (productData.image instanceof File) {
        formData.append('image', productData.image);
      } else if (productData.image) {
        // If it's a URL string, append it
        formData.append('image', productData.image);
      }
      
      // Add additional images
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach((img) => {
          if (img instanceof File) {
            formData.append('images', img);
          } else if (typeof img === 'string') {
            // If it's a URL string, append it (backend will handle it)
            formData.append('images', img);
          }
        });
      }
      
      return await apiClient.post<Product>("/products", formData);
    } else {
      // No files, send as JSON (backward compatibility)
      return await apiClient.post<Product>("/products", productData);
    }
  },

  async updateProduct(
    id: string,
    productData: Partial<
      Omit<Product, "image" | "images"> & {
        image?: File | string
        images?: File[] | string[]
      }
    >
  ): Promise<Product> {
    // Check if we have files to upload
    const hasFiles = productData.image instanceof File || 
                     (productData.images && productData.images.length > 0 && productData.images[0] instanceof File);
    
    if (hasFiles) {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all text fields
      Object.keys(productData).forEach(key => {
        const value = (productData as any)[key];
        if (value === undefined || value === null) return;
        
        // Skip file fields, handle them separately
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
          return;
        }
        if (key === 'images' && Array.isArray(value) && value[0] instanceof File) {
          value.forEach((img: File) => formData.append('images', img));
          return;
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
          value.forEach((item: any) => {
            if (typeof item === 'string' || typeof item === 'number') {
              formData.append(`${key}[]`, item.toString());
            }
          });
        } else if (typeof value === 'object') {
          // Skip objects (they'll be stringified if needed)
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });
      
      // Handle image URLs if they're strings
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
      
      return await apiClient.put<Product>(`/products/${id}`, formData);
    } else {
      // No files, send as JSON (backward compatibility)
      return await apiClient.put<Product>(`/products/${id}`, productData);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    return await apiClient.delete(`/products/${id}`)
  },

  async getAllProducts(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }): Promise<{ data: Product[]; total: number; page: number; pages: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.category) queryParams.append("category", params.category)

    const response = await apiClient.get(`/products?${queryParams.toString()}`)
    
    // Handle response structure - backend returns { success: true, data: [...], total, page, pages }
    if (response && typeof response === 'object') {
      if ('data' in response && Array.isArray(response.data)) {
        return {
          data: response.data,
          total: (response as any).total || response.data.length,
          page: (response as any).page || 1,
          pages: (response as any).pages || 1,
        }
      }
      // If response is already in the correct format
      if ('total' in response && 'data' in response) {
        return response as { data: Product[]; total: number; page: number; pages: number }
      }
      // If response is an array
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          pages: 1,
        }
      }
    }
    
    return {
      data: [],
      total: 0,
      page: 1,
      pages: 1,
    }
  },
}
