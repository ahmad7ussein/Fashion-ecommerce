// Server component wrapper for static export
import ProductDetailPageClient from './ProductDetailPageClient'
import { listProducts } from '@/lib/api/products'

// Required for static export with dynamic routes
export async function generateStaticParams() {
  try {
    // Fetch all products to generate static paths
    const products = await listProducts({})
    
    // Filter out invalid IDs and map to params
    const params = products
      .map((product) => {
        const id = product._id || product.id
        return id ? { id: id.toString() } : null
      })
      .filter((param): param is { id: string } => param !== null)
    
    return params
  } catch (error: any) {
    // If API is not available during build, return empty array
    // The page will still work at runtime with dynamic rendering
    // Silently fail during build - this is expected if backend is not running
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not fetch products for static generation (backend may be offline):', error?.message || error)
    }
    return []
  }
}

// This is a server component that wraps the client component
export default function ProductDetailPage() {
  return <ProductDetailPageClient />
}
