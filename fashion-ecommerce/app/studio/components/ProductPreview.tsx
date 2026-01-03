"use client"

import type { DesignElement, DesignSide, ProductType } from "../types"
import { getProductImagePath } from "../utils/productImages"

type ProductPreviewProps = {
  productType: ProductType
  productColor: string
  currentSide: DesignSide
  onSideChange: (side: DesignSide) => void
  designElements: DesignElement[]
  zoom?: number
  safeArea?: { x: number; y: number; width: number; height: number }
  mockupUrl?: string
}

export function ProductPreview({
  productType,
  productColor,
  currentSide,
  onSideChange: _onSideChange,
  designElements,
  zoom = 100,
  safeArea,
  mockupUrl,
}: ProductPreviewProps) {
  const currentImage = mockupUrl || getProductImagePath(productType, currentSide)

  const currentSideElements = designElements.filter((el) => (el.side || "front") === currentSide)

  const isWhite = productColor.toLowerCase() === "#ffffff"

  return (
    <div className="flex flex-col h-full bg-muted/30">
      { }
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          className="relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center",
          }}
        >
          { }
          <div
            className="relative"
            style={{
              filter: !isWhite ? `hue-rotate(0deg) saturate(1.5) brightness(1.1)` : undefined,
            }}
          >
            <img
              src={currentImage}
              alt={`${productType} ${currentSide}`}
              className="w-[400px] h-auto object-contain"
              style={{
                filter: !isWhite ? "brightness(0.9)" : undefined,
              }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = mockupUrl || "/placeholder-logo.png"
              }}
            />

            { }
            {safeArea && safeArea.width > 0 && safeArea.height > 0 && (
              <div
                className="absolute pointer-events-none border-2 border-dashed border-rose-400/80 bg-rose-200/10"
                style={{
                  left: `${safeArea.x}px`,
                  top: `${safeArea.y}px`,
                  width: `${safeArea.width}px`,
                  height: `${safeArea.height}px`,
                  boxShadow: "0 0 0 9999px rgba(255,255,255,0.35)",
                }}
              />
            )}

            { }
            <div className="absolute inset-0 pointer-events-none">
              {currentSideElements.map((element) => {
                if (element.type === "text") {
                  return (
                    <div
                      key={element.id}
                      className="absolute"
                      style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        fontSize: `${element.fontSize || 32}px`,
                        color: element.color || "#000000",
                        fontFamily: element.fontFamily || "Arial",
                        fontWeight: element.fontWeight || "normal",
                        fontStyle: element.fontStyle || "normal",
                        textDecoration: element.textDecoration || "none",
                        textAlign: (element.textAlign || "left") as "left" | "center" | "right" | "justify" | "start" | "end",
                        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                        opacity: element.opacity || 1,
                        transformOrigin: "center",
                      }}
                    >
                      {element.content}
                    </div>
                  )
                } else if (element.type === "image") {
                  return (
                    <img
                      key={element.id}
                      src={element.content}
                      alt="Design element"
                      className="absolute"
                      style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                        opacity: element.opacity || 1,
                        transformOrigin: "center",
                        maxWidth: "200px",
                        maxHeight: "200px",
                      }}
                    />
                  )
                }
                return null
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
