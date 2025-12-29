"use client"

import type React from "react"
import { forwardRef } from "react"
import { X, Move } from "lucide-react"

interface HoodiePreviewProps {
  color: string
  text: string
  textColor: string
  fontSize: number
  textAlign: "right" | "center" | "left"
  position: "front" | "back" | "chest"
  fontFamily: string
  uploadedImage?: string | null
  imagePosition?: { x: number; y: number }
  imageSize?: number
  onImagePositionChange?: (pos: { x: number; y: number }) => void
  onRemoveImage?: () => void
}

const hoodieImages: Record<string, string> = {
  white: "/black-hoodie-streetwear.png",
  black: "/black-hoodie-streetwear.png",
  navy: "/black-hoodie-streetwear.png",
  gray: "/black-hoodie-streetwear.png",
  blue: "/black-hoodie-streetwear.png",
  charcoal: "/black-hoodie-streetwear.png",
  green: "/black-hoodie-streetwear.png",
  peach: "/black-hoodie-streetwear.png",
  pink: "/black-hoodie-streetwear.png",
  sky: "/black-hoodie-streetwear.png",
  burgundy: "/black-hoodie-streetwear.png",
  olive: "/black-hoodie-streetwear.png",
  cream: "/black-hoodie-streetwear.png",
  lavender: "/black-hoodie-streetwear.png",
}

export const HoodiePreview = forwardRef<HTMLDivElement, HoodiePreviewProps>(
  (
    {
      color,
      text,
      textColor,
      fontSize,
      textAlign,
      position,
      fontFamily,
      uploadedImage,
      imagePosition = { x: 50, y: 50 },
      imageSize = 80,
      onImagePositionChange,
      onRemoveImage,
    },
    ref,
  ) => {
    const hoodieImage = hoodieImages[color] || hoodieImages.black

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onImagePositionChange) return

      const container = e.currentTarget.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const x = ((moveEvent.clientX - rect.left) / rect.width) * 100
        const y = ((moveEvent.clientY - rect.top) / rect.height) * 100
        onImagePositionChange({
          x: Math.max(10, Math.min(90, x)),
          y: Math.max(10, Math.min(90, y)),
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return (
      <div ref={ref} className="relative w-full max-w-lg mx-auto animate-scale-in">
        <div className="absolute inset-0 bg-muted/30 rounded-2xl" />

        <div className="relative p-4">
          <img
            src={hoodieImage}
            alt="Hoodie preview"
            className="w-full h-auto rounded-xl object-contain"
            crossOrigin="anonymous"
          />

          <div
            className="absolute border-2 border-dashed border-foreground/30 rounded-sm pointer-events-none"
            style={{
              top: "22%",
              left: "25%",
              width: "35%",
              height: "22%",
            }}
          />

          {uploadedImage && (
            <div
              className="absolute cursor-move group"
              style={{
                left: `${imagePosition.x}%`,
                top: `${imagePosition.y}%`,
                transform: "translate(-50%, -50%)",
                width: `${imageSize}px`,
                height: `${imageSize}px`,
              }}
              onMouseDown={handleDragStart}
            >
              <img src={uploadedImage} alt="Uploaded design" className="w-full h-full object-contain" draggable={false} />
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveImage?.()
                  }}
                  className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Move className="w-6 h-6 text-foreground/50" />
              </div>
            </div>
          )}

          {text && (
            <div
              className="absolute flex items-center justify-center p-2 overflow-hidden pointer-events-none"
              style={{
                top: "22%",
                left: "25%",
                width: "35%",
                height: "22%",
                textAlign,
              }}
            >
              <span
                className="font-bold leading-tight break-words w-full"
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  textAlign,
                  fontFamily,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {text}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  },
)

HoodiePreview.displayName = "HoodiePreview"
