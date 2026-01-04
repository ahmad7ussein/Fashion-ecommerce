"use client";
import { cn } from "@/lib/utils";
const positions = [
    { id: "front", label: "الأمام" },
    { id: "chest", label: "الصدر" },
    { id: "back", label: "الخلف" },
];
export const PositionSelector = ({ selectedPosition, onPositionChange }) => {
    return (<div className="flex justify-center gap-2">
      {positions.map((position) => (<button key={position.id} onClick={() => onPositionChange(position.id)} className={cn("px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200", selectedPosition === position.id
                ? "bg-muted text-foreground shadow-sm"
                : "bg-transparent text-muted-foreground hover:bg-muted/50")}>
          {position.label}
        </button>))}
    </div>);
};
