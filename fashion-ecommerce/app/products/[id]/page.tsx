
import ProductDetailPageClient from './ProductDetailPageClient'
import { listProducts } from '@/lib/api/products'


export async function generateStaticParams() {
  try {
    
    const products = await listProducts({})
    return products.map((product) => ({
      id: (product._id || product.id || '').toString(),
    }))
  } catch (error) {
    
    
    console.warn('Could not fetch products for static generation:', error)
    return []
  }
}


export default function ProductDetailPage() {
  return <ProductDetailPageClient />
}
