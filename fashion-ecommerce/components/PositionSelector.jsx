"use client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";

const positions = [
    { id: "front", label: { en: "Front", ar: "الأمام" } },
    { id: "back", label: { en: "Back", ar: "الخلف" } },
];

export const PositionSelector = ({ selectedPosition, onPositionChange }) => {
    const { language } = useLanguage();

    return (<div className="flex flex-wrap items-center justify-center gap-2">
      {positions.map((position) => {
        const label = language === "ar" ? position.label.ar : position.label.en;
        const isActive = selectedPosition === position.id;
        return (<button key={position.id} onClick={() => onPositionChange(position.id)} className={cn("px-5 py-2 rounded-full border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95", isActive
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-background text-muted-foreground border-border hover:border-rose-300 hover:text-foreground hover:bg-rose-50")}>
            {label}
          </button>);
    })}
    </div>);
};
