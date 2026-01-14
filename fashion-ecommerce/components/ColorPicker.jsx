"use client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";

const baseColors = [
  { id: "white", value: "#ffffff", label: "White", needsBorder: true },
  { id: "black", value: "#111111", label: "Black" },
  { id: "navy", value: "#1f2a44", label: "Navy" },
  { id: "gray", value: "#b6b6b6", label: "Gray" },
  { id: "blue", value: "#5aa7e0", label: "Blue" },
  { id: "charcoal", value: "#4a4a4a", label: "Charcoal" },
  { id: "green", value: "#4fa884", label: "Green" },
  { id: "peach", value: "#f2b6a0", label: "Peach" },
  { id: "pink", value: "#f2a8c7", label: "Pink" },
  { id: "burgundy", value: "#722F37", label: "Burgundy" },
  { id: "olive", value: "#556B2F", label: "Olive" },
  { id: "cream", value: "#FFFDD0", label: "Cream", needsBorder: true },
  { id: "lavender", value: "#E6E6FA", label: "Lavender" },
  { id: "beige", value: "#f5f5dc", label: "Beige", needsBorder: true },
  { id: "brown", value: "#8b5e3c", label: "Brown" },
  { id: "red", value: "#ef4444", label: "Red" },
  { id: "yellow", value: "#facc15", label: "Yellow" },
  { id: "orange", value: "#f97316", label: "Orange" },
  { id: "purple", value: "#8b5cf6", label: "Purple" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "cyan", value: "#06b6d4", label: "Cyan" },
];

const colorNameToHex = baseColors.reduce((acc, color) => {
  acc[color.id] = color.value;
  return acc;
}, {});

const isColorValue = (value) => value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl");

const resolveColorValue = (color) => {
  const normalized = color.trim().toLowerCase();
  if (!normalized) return "#d4d4d4";
  if (isColorValue(normalized)) return color;
  return colorNameToHex[normalized] || color;
};

const buildColorOptions = (colors) => {
  if (!colors || colors.length === 0) return baseColors;
  const options = colors
    .map((color) => {
      const normalized = color.trim().toLowerCase();
      if (!normalized) return null;
      const base = baseColors.find((item) => item.id === normalized);
      if (base) return base;
      if (isColorValue(normalized)) {
        return { id: normalized, value: normalized, label: color, needsBorder: false };
      }
      const value = colorNameToHex[normalized] || "#d4d4d4";
      const needsBorder = value.toLowerCase() in { "#ffffff": 1, "#fffdd0": 1 };
      return { id: normalized, value, label: color, needsBorder };
    })
    .filter(Boolean);
  const unique = new Map();
  options.forEach((item) => unique.set(item.id, item));
  return unique.size ? Array.from(unique.values()) : baseColors;
};

export const ColorPicker = ({ selectedColor, onColorChange, colors }) => {
  const { language } = useLanguage();
  const options = buildColorOptions(colors);
  const selectedValue = resolveColorValue(selectedColor).toLowerCase();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-center text-foreground">
        {language === "ar" ? "اللون " : "Color"}
      </h3>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {options.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorChange(color.value)}
            className="flex flex-col items-center gap-1"
            type="button"
            title={color.label}
            aria-label={color.label}
          >
            <span
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                color.needsBorder && "border border-border",
                selectedValue === color.value.toLowerCase() &&
                  "ring-2 ring-blue-900 ring-offset-2 ring-offset-background scale-110"
              )}
              style={{ backgroundColor: color.value }}
            />
            <span className="text-[11px] font-medium text-foreground">{color.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
