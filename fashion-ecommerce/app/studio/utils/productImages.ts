import type { ProductType, DesignSide } from "../types"

export function getProductImagePath(productType: ProductType, side: DesignSide): string {
  const imageMap: Partial<Record<ProductType, Partial<Record<DesignSide, string>>>> = {
    tshirt: {
      front: "/white-t-shirt-model.png",
      back: "/white-t-shirt-model.png",
      "left-sleeve": "/white-t-shirt-model.png",
      "right-sleeve": "/white-t-shirt-model.png",
    },
    hoodie: {
      front: "/black-hoodie-streetwear.png",
      back: "/black-hoodie-streetwear.png",
      "left-sleeve": "/black-hoodie-streetwear.png",
      "right-sleeve": "/black-hoodie-streetwear.png",
      hood: "/black-hoodie-streetwear.png",
    },
    sweatshirt: {
      front: "/gray-sweatshirt-casual.jpg",
      back: "/gray-sweatshirt-casual.jpg",
      "left-sleeve": "/gray-sweatshirt-casual.jpg",
      "right-sleeve": "/gray-sweatshirt-casual.jpg",
    },
  }

  return (
    imageMap[productType]?.[side] ||
    imageMap[productType]?.front ||
    "/white-t-shirt-model.png"
  )
}

