"use client"

import type { FC } from "react"
import { cn } from "@/lib/utils"

interface SizeSelectorProps {
  selectedSize: string
  onSizeChange: (size: string) => void
}

const sizes = ["XS", "S", "M", "L", "XL", "2XL"]

export const SizeSelector: FC<SizeSelectorProps> = ({ selectedSize, onSizeChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-center text-foreground">Size</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={cn(
              "min-w-[48px] h-10 px-3 rounded-full border-2 font-medium text-sm transition-all duration-200",
              selectedSize === size
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-foreground/50",
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
