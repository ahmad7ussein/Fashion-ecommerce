// Server component wrapper for static export
import ProductDetailPageClient from './ProductDetailPageClient'
import { listProducts } from '@/lib/api/products'

// Required for static export with dynamic routes
export async function generateStaticParams() {
  try {
    // Fetch all products to generate static paths
    const products = await listProducts({})
    return products.map((product) => ({
      id: (product._id || product.id || '').toString(),
    }))
  } catch (error) {
    // If API is not available during build, return empty array
    // The page will still work at runtime
    console.warn('Could not fetch products for static generation:', error)
    return []
  }
}

// This is a server component that wraps the client component
export default function ProductDetailPage() {
  return <ProductDetailPageClient />
}
