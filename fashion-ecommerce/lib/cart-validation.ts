import apiClient from "./api/client"
import { getProductById } from "./api/products"

export type CartValidationResult = {
  validItems: Array<{ id?: string; product?: string; design?: string; quantity: number }>
  invalidItems: Array<{ id?: string; reason: string }>
}

const isObjectId = (id?: string) => !!id && /^[0-9a-fA-F]{24}$/.test(id)







export async function validateCartItems(items: Array<{ id?: string; product?: string; quantity: number }>): Promise<CartValidationResult> {
  const validItems: CartValidationResult["validItems"] = []
  const invalidItems: CartValidationResult["invalidItems"] = []

  for (const item of items) {
    const productId = item.product || (item.id ? item.id.split("-")[0] : undefined)

    if (!isObjectId(productId)) {
      invalidItems.push({ id: item.id, reason: "Invalid product id" })
      continue
    }

    const product = await getProductById(productId as string)
    if (!product || (product as any).active === false) {
      invalidItems.push({ id: item.id, reason: "Product not found or inactive" })
      continue
    }

    if ((product as any).stock !== undefined && (product as any).stock < item.quantity) {
      invalidItems.push({ id: item.id, reason: "Insufficient stock" })
      continue
    }

    validItems.push({ id: item.id, product: productId, quantity: item.quantity })
  }

  return { validItems, invalidItems }
}
