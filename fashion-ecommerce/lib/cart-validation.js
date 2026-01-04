import { getProductById } from "./api/products";
const isObjectId = (id) => !!id && /^[0-9a-fA-F]{24}$/.test(id);
export async function validateCartItems(items) {
    const validItems = [];
    const invalidItems = [];
    for (const item of items) {
        const productId = item.product || (item.id ? item.id.split("-")[0] : undefined);
        if (!isObjectId(productId)) {
            invalidItems.push({ id: item.id, reason: "Invalid product id" });
            continue;
        }
        const product = await getProductById(productId);
        if (!product || product.active === false) {
            invalidItems.push({ id: item.id, reason: "Product not found or inactive" });
            continue;
        }
        if (product.stock !== undefined && product.stock < item.quantity) {
            invalidItems.push({ id: item.id, reason: "Insufficient stock" });
            continue;
        }
        validItems.push({ id: item.id, product: productId, quantity: item.quantity });
    }
    return { validItems, invalidItems };
}
