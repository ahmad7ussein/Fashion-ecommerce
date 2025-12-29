import apiClient from "./client"

export type StudioProduct = {
  _id: string
  name: string
  type: string
  description?: string
  baseMockupUrl: string
  colorMockups?: Record<string, string>
  safeArea?: {
    x: number
    y: number
    width: number
    height: number
  }
  colors: string[]
  sizes: string[]
  price: number
  active: boolean
  aiEnhanceEnabled: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export const studioProductsApi = {
  async getActive(): Promise<StudioProduct[]> {
    const res = await apiClient.get<StudioProduct[] | { data: StudioProduct[] }>("/studio-products/active")
    if (Array.isArray(res)) return res
    if (res && typeof res === "object" && "data" in res) return Array.isArray(res.data) ? res.data : []
    return []
  },
  async getAll(): Promise<StudioProduct[]> {
    const res = await apiClient.get<StudioProduct[] | { data: StudioProduct[] }>("/studio-products")
    if (Array.isArray(res)) return res
    if (res && typeof res === "object" && "data" in res) return Array.isArray(res.data) ? res.data : []
    return []
  },
  async create(data: Partial<StudioProduct>): Promise<StudioProduct> {
    return apiClient.post<StudioProduct>("/studio-products", data)
  },
  async update(id: string, data: Partial<StudioProduct>): Promise<StudioProduct> {
    return apiClient.put<StudioProduct>(`/studio-products/${id}`, data)
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/studio-products/${id}`)
  },
}
