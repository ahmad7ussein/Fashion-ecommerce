import type { ProductType, DesignSide } from "../types"

export function getProductImagePath(productType: ProductType, side: DesignSide): string {
  const imageMap: Partial<Record<ProductType, Partial<Record<DesignSide, string>>>> = {
    tshirt: {
      front: "/white-t-shirt-front.png",
      back: "/white-t-shirt-back.png",
      "left-sleeve": "/white-t-shirt-sleeve-left.png",
      "right-sleeve": "/white-t-shirt-sleeve-right.png",
    },
    hoodie: {
      front: "/black-hoodie-front.png",
      back: "/black-hoodie-back.png",
      "left-sleeve": "/black-hoodie-sleeve-left.png",
      "right-sleeve": "/black-hoodie-sleeve-right.png",
      hood: "/black-hoodie-hood.png",
    },
    sweatshirt: {
      front: "/gray-sweatshirt-front.png",
      back: "/gray-sweatshirt-back.png",
      "left-sleeve": "/gray-sweatshirt-sleeve-left.png",
      "right-sleeve": "/gray-sweatshirt-sleeve-right.png",
    },
  }

  return (
    imageMap[productType]?.[side] ||
    imageMap[productType]?.front ||
    "/white-t-shirt.png"
  )
}

