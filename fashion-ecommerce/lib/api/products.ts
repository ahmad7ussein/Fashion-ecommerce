import apiClient from "./client"

export type Product = {
  _id?: string
  id?: string | number
  name: string
  nameAr?: string // Arabic name (optional)
  price: number
  image: string
  category: string
  categoryAr?: string // Arabic category (optional)
  gender: string
  genderAr?: string // Arabic gender (optional)
  season: string
  seasonAr?: string // Arabic season (optional)
  style: string
  styleAr?: string // Arabic style (optional)
  occasion: string
  occasionAr?: string // Arabic occasion (optional)
  description?: string
  descriptionAr?: string // Arabic description (optional)
  images?: string[]
  sizes?: string[]
  colors?: string[]
  stock?: number
  featured?: boolean
  active?: boolean
  onSale?: boolean
  salePercentage?: number
  inCollection?: boolean
}

// Fallback catalog for offline mode (will be replaced by MongoDB)
// Note: Similar products to the new ones (Men's Summer T-Shirts, Polo Shirts, Tops) have been removed
const CATALOG: Product[] = [
  { id: 11, name: "Urban Black Hoodie", price: 59.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 12, name: "Oversized Hoodie", price: 64.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 13, name: "Zip-Up Hoodie", price: 62.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 14, name: "Pullover Hoodie Gray", price: 58.99, image: "/gray-sweatshirt-casual.jpg", category: "Hoodies", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 18, name: "Color Block Hoodie", price: 66.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Men", season: "Winter", style: "Graphic", occasion: "Casual" },
  { id: 19, name: "Comfort Sweatshirt", price: 49.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 20, name: "Vintage Sweatshirt", price: 54.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Men", season: "Winter", style: "Graphic", occasion: "Casual" },
  { id: 21, name: "Crewneck Sweatshirt", price: 47.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 15, name: "Tech Fleece Hoodie", price: 74.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Men", season: "Winter", style: "Plain", occasion: "Sports" },
  { id: 29, name: "Track Jacket", price: 84.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Men", season: "Winter", style: "Plain", occasion: "Sports" },
  { id: 31, name: "Jogger Pants", price: 54.99, image: "/white-t-shirt-model.png", category: "Pants", gender: "Men", season: "Winter", style: "Plain", occasion: "Sports" },
  { id: 34, name: "Track Pants", price: 52.99, image: "/white-t-shirt-model.png", category: "Pants", gender: "Men", season: "Winter", style: "Plain", occasion: "Sports" },
  { id: 25, name: "Classic Denim Jacket", price: 89.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Men", season: "Winter", style: "Plain", occasion: "Classic" },
  { id: 26, name: "Bomber Jacket", price: 94.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Men", season: "Winter", style: "Plain", occasion: "Classic" },
  { id: 30, name: "Leather Jacket", price: 199.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Men", season: "Winter", style: "Plain", occasion: "Formal" },
  { id: 28, name: "Puffer Jacket", price: 124.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Men", season: "Winter", style: "Plain", occasion: "Formal" },
  { id: 35, name: "Chino Pants", price: 59.99, image: "/white-t-shirt-model.png", category: "Pants", gender: "Men", season: "Winter", style: "Plain", occasion: "Formal" },
  { id: 101, name: "Women's Basic White Tee", price: 27.99, image: "/white-t-shirt-model.png", category: "T-Shirts", gender: "Women", season: "Summer", style: "Plain", occasion: "Casual" },
  { id: 102, name: "Women's V-Neck Tee", price: 29.99, image: "/white-t-shirt-model.png", category: "T-Shirts", gender: "Women", season: "Summer", style: "Plain", occasion: "Casual" },
  { id: 103, name: "Women's Fitted Tee", price: 31.99, image: "/graphic-t-shirt-fashion.jpg", category: "T-Shirts", gender: "Women", season: "Summer", style: "Plain", occasion: "Casual" },
  { id: 104, name: "Women's Graphic Tee", price: 33.99, image: "/graphic-t-shirt-fashion.jpg", category: "T-Shirts", gender: "Women", season: "Summer", style: "Graphic", occasion: "Casual" },
  { id: 105, name: "Women's Striped Tee", price: 32.99, image: "/graphic-t-shirt-fashion.jpg", category: "T-Shirts", gender: "Women", season: "Summer", style: "Graphic", occasion: "Casual" },
  { id: 106, name: "Women's Crop Top", price: 26.99, image: "/white-t-shirt-model.png", category: "Tank Tops", gender: "Women", season: "Summer", style: "Plain", occasion: "Sports" },
  { id: 107, name: "Women's Racerback Tank", price: 27.99, image: "/white-t-shirt-model.png", category: "Tank Tops", gender: "Women", season: "Summer", style: "Plain", occasion: "Sports" },
  { id: 108, name: "Women's Athletic Shorts", price: 32.99, image: "/white-t-shirt-model.png", category: "Shorts", gender: "Women", season: "Summer", style: "Plain", occasion: "Sports" },
  { id: 109, name: "Women's Polo Shirt", price: 42.99, image: "/white-t-shirt-model.png", category: "Polo Shirts", gender: "Women", season: "Summer", style: "Plain", occasion: "Classic" },
  { id: 110, name: "Women's Elegant Blouse", price: 54.99, image: "/white-t-shirt-model.png", category: "T-Shirts", gender: "Women", season: "Summer", style: "Plain", occasion: "Formal" },
  { id: 111, name: "Women's Cropped Hoodie", price: 54.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Women", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 112, name: "Women's Oversized Hoodie", price: 62.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Women", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 113, name: "Women's Zip Hoodie", price: 59.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Women", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 114, name: "Women's Sweatshirt", price: 49.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Women", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 115, name: "Women's Embroidered Sweatshirt", price: 57.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Women", season: "Winter", style: "Graphic", occasion: "Casual" },
  { id: 116, name: "Women's Denim Jacket", price: 84.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Women", season: "Winter", style: "Plain", occasion: "Classic" },
  { id: 117, name: "Women's Puffer Jacket", price: 119.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Women", season: "Winter", style: "Plain", occasion: "Formal" },
  { id: 118, name: "Women's Sherpa Jacket", price: 89.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Women", season: "Winter", style: "Plain", occasion: "Classic" },
  { id: 119, name: "Women's Wide Leg Pants", price: 62.99, image: "/white-t-shirt-model.png", category: "Pants", gender: "Women", season: "Winter", style: "Plain", occasion: "Formal" },
  { id: 120, name: "Women's Elegant Evening Top", price: 74.99, image: "/white-t-shirt-model.png", category: "T-Shirts", gender: "Women", season: "All Season", style: "Plain", occasion: "Wedding" },
  { id: 121, name: "Women's Formal Blazer", price: 149.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Women", season: "All Season", style: "Plain", occasion: "Wedding" },
  { id: 201, name: "Kids Basic Tee", price: 19.99, image: "/white-t-shirt-model.png", category: "T-Shirts", gender: "Kids", season: "Summer", style: "Plain", occasion: "Casual" },
  { id: 202, name: "Kids Graphic Tee", price: 22.99, image: "/graphic-t-shirt-fashion.jpg", category: "T-Shirts", gender: "Kids", season: "Summer", style: "Graphic", occasion: "Casual" },
  { id: 203, name: "Kids Striped Tee", price: 21.99, image: "/graphic-t-shirt-fashion.jpg", category: "T-Shirts", gender: "Kids", season: "Summer", style: "Graphic", occasion: "Casual" },
  { id: 204, name: "Kids Tank Top", price: 17.99, image: "/white-t-shirt-model.png", category: "Tank Tops", gender: "Kids", season: "Summer", style: "Plain", occasion: "Casual" },
  { id: 205, name: "Kids Athletic Shorts", price: 24.99, image: "/white-t-shirt-model.png", category: "Shorts", gender: "Kids", season: "Summer", style: "Plain", occasion: "Sports" },
  { id: 206, name: "Kids Sports Tee", price: 23.99, image: "/graphic-t-shirt-fashion.jpg", category: "T-Shirts", gender: "Kids", season: "Summer", style: "Graphic", occasion: "Sports" },
  { id: 207, name: "Kids Hoodie", price: 39.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Kids", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 208, name: "Kids Zip Hoodie", price: 42.99, image: "/black-hoodie-streetwear.png", category: "Hoodies", gender: "Kids", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 209, name: "Kids Sweatshirt", price: 34.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Kids", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 210, name: "Kids Graphic Sweatshirt", price: 37.99, image: "/gray-sweatshirt-casual.jpg", category: "Sweatshirts", gender: "Kids", season: "Winter", style: "Graphic", occasion: "Casual" },
  { id: 211, name: "Kids Track Jacket", price: 49.99, image: "/graphic-t-shirt-fashion.jpg", category: "Jackets", gender: "Kids", season: "Winter", style: "Plain", occasion: "Sports" },
  { id: 212, name: "Kids Jogger Pants", price: 34.99, image: "/white-t-shirt-model.png", category: "Pants", gender: "Kids", season: "Winter", style: "Plain", occasion: "Sports" },
  { id: 303, name: "Men's Cargo Pants", price: 64.99, image: "/jogger-pants.png", category: "Pants", gender: "Men", season: "All Season", style: "Plain", occasion: "Casual" },
  { id: 306, name: "Men's Windbreaker", price: 79.99, image: "/track-jacket.jpg", category: "Jackets", gender: "Men", season: "All Season", style: "Plain", occasion: "Sports" },
  { id: 307, name: "Men's Sweatpants", price: 49.99, image: "/track-pants.jpg", category: "Pants", gender: "Men", season: "Winter", style: "Plain", occasion: "Casual" },
  { id: 308, name: "Men's Quarter Zip Sweatshirt", price: 56.99, image: "/crewneck-sweatshirt.jpg", category: "Sweatshirts", gender: "Men", season: "Winter", style: "Plain", occasion: "Classic" },
]

export type ProductFilters = {
  search?: string
  category?: string
  gender?: string
  season?: string
  style?: string
  occasion?: string
  sortBy?: "featured" | "price-low" | "price-high" | "newest"
  onSale?: boolean
  inCollection?: boolean
  featured?: boolean
  active?: boolean
  limit?: number
  page?: number
}

// Try to fetch from backend API, fallback to local catalog if offline
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    if (filters.search) params.append("search", filters.search)
    if (filters.category && filters.category !== "all") params.append("category", filters.category)
    if (filters.gender && filters.gender !== "all") params.append("gender", filters.gender)
    if (filters.season && filters.season !== "all") params.append("season", filters.season)
    if (filters.style && filters.style !== "all") params.append("style", filters.style)
    if (filters.occasion && filters.occasion !== "all") params.append("occasion", filters.occasion)
    if (filters.sortBy) params.append("sortBy", filters.sortBy)
    if (filters.onSale !== undefined) params.append("onSale", filters.onSale.toString())
    if (filters.inCollection !== undefined) params.append("inCollection", filters.inCollection.toString())
    if (filters.featured !== undefined) params.append("featured", filters.featured.toString())
    if (filters.active !== undefined) params.append("active", filters.active.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    if (filters.page) params.append("page", filters.page.toString())

    const response = await apiClient.get<{ data: Product[]; total?: number; page?: number; pages?: number } | Product[]>(`/products?${params.toString()}`)
    // Backend returns { success: true, data: [...], total, page, pages }
    // apiClient extracts data for paginated responses, but we need to handle it
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return []
  } catch (error: any) {
    const isNetworkError = error?.status === 503 || 
                          error?.status === 504 ||
                          error?.status === 500 && error?.errorMessage?.includes('timeout') ||
                          error?.message?.includes('fetch failed') || 
                          error?.message?.includes('Cannot connect') ||
                          error?.message?.includes('timeout') ||
                          error?.errorMessage?.includes('timeout')
    
    // If it's a timeout or connection error, throw it to let the UI handle it properly
    // instead of silently falling back to empty catalog
    if (isNetworkError && (error?.status === 503 || error?.status === 504 || error?.message?.includes('timeout'))) {
      throw error; // Re-throw to let UI show proper error message
    }
    
    if (!isNetworkError || process.env.NODE_ENV === 'development') {
      console.warn("Backend API unavailable, using fallback catalog", error?.message || error?.errorMessage || error)
    }
    const q = (filters.search ?? "").toLowerCase()
    let results = CATALOG.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(q) ||
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.categoryAr && p.categoryAr.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q))
      const matchesCategory = !filters.category || filters.category === "all" || p.category === filters.category
      const matchesGender = !filters.gender || filters.gender === "all" || p.gender === filters.gender
      const matchesSeason =
        !filters.season || filters.season === "all" || p.season === filters.season || p.season === "All Season"
      const matchesStyle = !filters.style || filters.style === "all" || p.style === filters.style
      const matchesOccasion = !filters.occasion || filters.occasion === "all" || p.occasion === filters.occasion
      return matchesSearch && matchesCategory && matchesGender && matchesSeason && matchesStyle && matchesOccasion
    })

    if (filters.sortBy === "price-low") results = results.sort((a, b) => a.price - b.price)
    if (filters.sortBy === "price-high") results = results.sort((a, b) => b.price - a.price)
    return results
  }
}

export async function getProductById(id: string | number): Promise<Product | null> {
  // Convert to string for API call
  const idString = String(id)
  
  // Check if it's a numeric ID (from fallback catalog)
  const isNumericId = /^\d+$/.test(idString)
  
  // If it's a numeric ID, check fallback catalog first (faster and expected)
  if (isNumericId) {
    const fallbackProduct = CATALOG.find((p) => p.id === id || p._id === id)
    if (fallbackProduct) {
      // Also try to fetch from backend in the background (for updated data)
      // But don't wait for it or log errors if it fails
      apiClient.get<Product | { data: Product }>(`/products/${idString}`).catch(() => {
        // Silently fail - we already have fallback product
      })
      return fallbackProduct
    }
  }
  
  try {
    // Try backend API for ObjectId or if numeric ID not in catalog
    const response = await apiClient.get<Product | { data: Product }>(`/products/${idString}`)
    
    // Backend returns { success: true, data: {...} }
    if (response && typeof response === 'object' && 'data' in response && !('_id' in response)) {
      return (response as { data: Product }).data || null
    }
    return (response as Product) || null
  } catch (error: any) {
    // If it's a 404 error (product not found), throw it so the component can handle it properly
    // This is especially important for ObjectId products that have been deleted
    if (error?.status === 404 || 
        error?.errorMessage?.toLowerCase().includes("not found") || 
        error?.errorBody?.toLowerCase().includes("not found") ||
        error?.message?.toLowerCase().includes("not found")) {
      // Re-throw 404 errors so the component can show "Product not found" message
      throw error
    }
    // If it's a 400 error and ID is numeric, use fallback catalog silently
    if (error?.status === 400 && isNumericId) {
      // Silently use fallback catalog for numeric IDs (expected behavior)
      return CATALOG.find((p) => p.id === id || p._id === id) ?? null
    }
    
    // For other errors or non-numeric IDs, try fallback but log only in development
    if (process.env.NODE_ENV === 'development') {
      console.warn("Backend API unavailable, using fallback catalog", error?.message || error)
    }
    return CATALOG.find((p) => p.id === id || p._id === id) ?? null
  }
}

export async function listCategories(): Promise<string[]> {
  try {
    return await apiClient.get<string[]>("/products/meta/categories")
  } catch (error) {
    console.warn("Backend API unavailable, using fallback", error)
    return Array.from(new Set(CATALOG.map((p) => p.category)))
  }
}

export async function listGenders(): Promise<string[]> {
  try {
    return await apiClient.get<string[]>("/products/meta/genders")
  } catch (error) {
    console.warn("Backend API unavailable, using fallback", error)
    return Array.from(new Set(CATALOG.map((p) => p.gender)))
  }
}

