export type ProductType = "tshirt" | "hoodie" | "sweatshirt" | "tank-top" | "long-sleeve" | "polo" | "crop-top" | "zip-hoodie"

export type DesignSide = "front" | "back" | "left-sleeve" | "right-sleeve" | "hood" | "pocket"

export type DesignElement = {
  id: string
  type: "text" | "image"
  content: string
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  color?: string
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  rotation?: number
  opacity?: number
  layer?: number
  side?: DesignSide
  visible?: boolean
}

