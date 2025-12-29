"use client"

import type { FC } from "react"
import { cn } from "@/lib/utils"

interface PositionSelectorProps {
  selectedPosition: "front" | "back" | "chest"
  onPositionChange: (position: "front" | "back" | "chest") => void
}

const positions = [
  { id: "front" as const, label: "الأمام" },
  { id: "chest" as const, label: "الصدر" },
  { id: "back" as const, label: "الخلف" },
]

export const PositionSelector: FC<PositionSelectorProps> = ({ selectedPosition, onPositionChange }) => {
  return (
    <div className="flex justify-center gap-2">
      {positions.map((position) => (
        <button
          key={position.id}
          onClick={() => onPositionChange(position.id)}
          className={cn(
            "px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
            selectedPosition === position.id
              ? "bg-muted text-foreground shadow-sm"
              : "bg-transparent text-muted-foreground hover:bg-muted/50",
          )}
        >
          {position.label}
        </button>
      ))}
    </div>
  )
}
