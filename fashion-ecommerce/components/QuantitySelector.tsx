"use client"

import type { FC } from "react"
import { Minus, Plus } from "lucide-react"

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
}

export const QuantitySelector: FC<QuantitySelectorProps> = ({ quantity, onQuantityChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-center text-foreground">() الكمية</h3>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          disabled={quantity <= 1}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
        <button
          onClick={() => onQuantityChange(quantity + 1)}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
