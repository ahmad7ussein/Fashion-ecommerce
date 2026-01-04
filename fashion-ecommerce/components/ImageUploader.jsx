"use client";
import { useRef } from "react";
import { ImagePlus, Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
export const ImageUploader = ({ onImageUpload, uploadedImage, imageSize = 80, onImageSizeChange, }) => {
    const inputRef = useRef(null);
    const handleClick = () => {
        inputRef.current?.click();
    };
    const handleChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };
    return (<div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground text-center">اختيار الصورة</h3>
      <div className="flex flex-col items-center gap-3">
        <button onClick={handleClick} className="w-16 h-16 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center hover:bg-primary/10 hover:border-primary/60 transition-all group">
          {uploadedImage ? (<img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover rounded-lg"/>) : (<div className="relative">
              <ImagePlus className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors"/>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground font-bold">+</span>
              </div>
            </div>)}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden"/>

        {uploadedImage && onImageSizeChange && (<div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>حجم الصورة</span>
              <span>{imageSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onImageSizeChange(Math.max(30, imageSize - 10))} className="p-1 rounded bg-muted hover:bg-muted/80 transition-colors">
                <Minus className="w-4 h-4"/>
              </button>
              <Slider value={[imageSize]} onValueChange={([val]) => onImageSizeChange(val)} min={30} max={200} step={5} className="flex-1"/>
              <button onClick={() => onImageSizeChange(Math.min(200, imageSize + 10))} className="p-1 rounded bg-muted hover:bg-muted/80 transition-colors">
                <Plus className="w-4 h-4"/>
              </button>
            </div>
          </div>)}
      </div>
    </div>);
};
