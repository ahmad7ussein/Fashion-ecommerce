"use client"

import type { FC } from "react"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  colors?: string[]
}

const baseColors = [
  { id: "white", value: "#ffffff", label: "أبيض", needsBorder: true },
  { id: "black", value: "#111111", label: "أسود" },
  { id: "navy", value: "#1f2a44", label: "كحلي" },
  { id: "gray", value: "#b6b6b6", label: "رمادي" },
  { id: "blue", value: "#5aa7e0", label: "أزرق" },
  { id: "charcoal", value: "#4a4a4a", label: "فحمي" },
  { id: "green", value: "#4fa884", label: "أخضر" },
  { id: "peach", value: "#f2b6a0", label: "خوخي" },
  { id: "pink", value: "#f2a8c7", label: "وردي" },
  { id: "burgundy", value: "#722F37", label: "عنابي" },
  { id: "olive", value: "#556B2F", label: "زيتوني" },
  { id: "cream", value: "#FFFDD0", label: "كريمي", needsBorder: true },
  { id: "lavender", value: "#E6E6FA", label: "لافندر" },
  { id: "beige", value: "#f5f5dc", label: "بيج", needsBorder: true },
  { id: "brown", value: "#8b5e3c", label: "بني" },
  { id: "red", value: "#ef4444", label: "أحمر" },
  { id: "yellow", value: "#facc15", label: "أصفر" },
  { id: "orange", value: "#f97316", label: "برتقالي" },
  { id: "purple", value: "#8b5cf6", label: "بنفسجي" },
  { id: "teal", value: "#14b8a6", label: "تركواز" },
  { id: "cyan", value: "#06b6d4", label: "سماوي" },
]

const colorNameToHex: Record<string, string> = baseColors.reduce((acc, color) => {
  acc[color.id] = color.value
  return acc
}, {} as Record<string, string>)

const isColorValue = (value: string) =>
  value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl")

const resolveColorValue = (color: string) => {
  const normalized = color.trim().toLowerCase()
  if (!normalized) return "#d4d4d4"
  if (isColorValue(normalized)) return color
  return colorNameToHex[normalized] || color
}

const buildColorOptions = (colors?: string[]) => {
  if (!colors || colors.length === 0) return baseColors
  const options = colors
    .map((color) => {
      const normalized = color.trim().toLowerCase()
      if (!normalized) return null
      const base = baseColors.find((item) => item.id === normalized)
      if (base) return base
      if (isColorValue(normalized)) {
        return { id: normalized, value: normalized, label: color, needsBorder: false }
      }
      const value = colorNameToHex[normalized] || "#d4d4d4"
      const needsBorder = value.toLowerCase() === "#ffffff" || value.toLowerCase() === "#fffdd0"
      return { id: normalized, value, label: color, needsBorder }
    })
    .filter(Boolean) as typeof baseColors

  const unique = new Map<string, (typeof baseColors)[number]>()
  options.forEach((item) => unique.set(item.id, item))
  return unique.size ? Array.from(unique.values()) : baseColors
}

export const ColorPicker: FC<ColorPickerProps> = ({ selectedColor, onColorChange, colors }) => {
  const options = buildColorOptions(colors)
  const selectedValue = resolveColorValue(selectedColor).toLowerCase()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-center text-foreground">اللون</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorChange(color.value)}
            className={cn(
              "w-9 h-9 rounded-full transition-all duration-200 hover:scale-110",
              color.needsBorder && "border border-border",
              selectedValue === color.value.toLowerCase() && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110",
            )}
            style={{ backgroundColor: color.value }}
            title={color.label}
            aria-label={color.label}
          />
        ))}
      </div>
    </div>
  )
}
