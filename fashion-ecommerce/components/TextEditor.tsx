"use client"

import type { FC } from "react"
import { AlignLeft, AlignCenter, AlignRight, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TextEditorProps {
  text: string
  onTextChange: (text: string) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  textAlign: "right" | "center" | "left"
  onTextAlignChange: (align: "right" | "center" | "left") => void
  fontFamily: string
}

const textColors = [
  { value: "#000000", label: "#000000" },
  { value: "#ffffff", label: "#ffffff" },
  { value: "#7c3aed", label: "#7c3aed" },
  { value: "#06b6d4", label: "#06b6d4" },
  { value: "#ef4444", label: "#ef4444" },
  { value: "#22c55e", label: "#22c55e" },
  { value: "#f59e0b", label: "#f59e0b" },
  { value: "#ec4899", label: "#ec4899" },
  { value: "#3b82f6", label: "#3b82f6" },
  { value: "#8b5cf6", label: "#8b5cf6" },
]

const arabicFonts = [
  { id: "tajawal", name: "تجوال", family: "Tajawal", style: "حديث" },
  { id: "cairo", name: "القاهرة", family: "Cairo", style: "حديث" },
  { id: "kufi", name: "الكوفي", family: "Noto Kufi Arabic", style: "كوفي" },
  { id: "reem-kufi", name: "ريم كوفي", family: "Reem Kufi", style: "كوفي" },
  { id: "amiri", name: "الأميري", family: "Amiri", style: "نسخ" },
  { id: "scheherazade", name: "شهرزاد", family: "Scheherazade New", style: "نسخ" },
  { id: "lateef", name: "لطيف", family: "Lateef", style: "نستعليق" },
  { id: "ruqaa", name: "الرقعة", family: "Aref Ruqaa", style: "رقعة" },
]

export const TextEditor: FC<TextEditorProps> = ({
  text,
  onTextChange,
  fontSize,
  onFontSizeChange,
  textAlign,
  onTextAlignChange,
  fontFamily,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">النص</h3>
        <textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="اكتب النص هنا..."
          className="w-full h-24 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          dir="rtl"
          style={{ fontFamily }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
            className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-medium min-w-[40px] text-center">
            A<span className="text-xs">A</span>A
          </span>
          <button
            onClick={() => onFontSizeChange(Math.min(48, fontSize + 2))}
            className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            onClick={() => onTextAlignChange("right")}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center transition-colors",
              textAlign === "right" ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTextAlignChange("center")}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center transition-colors",
              textAlign === "center" ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTextAlignChange("left")}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center transition-colors",
              textAlign === "left" ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  )
}

interface TextStyleControlsProps {
  fontFamily: string
  onFontFamilyChange: (font: string) => void
  textColor: string
  onTextColorChange: (color: string) => void
}

export const TextStyleControls: FC<TextStyleControlsProps> = ({
  fontFamily,
  onFontFamilyChange,
  textColor,
  onTextColorChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-3 min-w-0">
        <h3 className="text-sm font-medium text-foreground text-center">????</h3>
        <Select value={fontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-right">
            {arabicFonts.map((font) => (
              <SelectItem key={font.id} value={font.family}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm" style={{ fontFamily: font.family }}>
                    {font.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{font.style}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 min-w-0">
        <h3 className="text-sm font-medium text-foreground text-center">??? ????</h3>
        <Select value={textColor} onValueChange={onTextColorChange}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-right">
            {textColors.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn("h-4 w-4 rounded-full border", color.value === "#ffffff" && "border-border")}
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-sm">{color.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
