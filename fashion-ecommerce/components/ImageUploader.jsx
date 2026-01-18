"use client";
import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { ImagePlus, Minus, Plus, Trash2, Wand2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
const createImage = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
});
const getCroppedImage = async (imageSrc, cropPixels, scale = 1, zoom = 1) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const targetWidth = Math.max(1, Math.round(cropPixels.width * scale));
    const targetHeight = Math.max(1, Math.round(cropPixels.height * scale));
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas context unavailable");
    }
    ctx.imageSmoothingQuality = "high";
    if (zoom < 1) {
        const fitScale = Math.min(targetWidth / image.width, targetHeight / image.height);
        const drawWidth = image.width * fitScale;
        const drawHeight = image.height * fitScale;
        const offsetX = (targetWidth - drawWidth) / 2;
        const offsetY = (targetHeight - drawHeight) / 2;
        ctx.drawImage(image, 0, 0, image.width, image.height, offsetX, offsetY, drawWidth, drawHeight);
    }
    else {
        ctx.drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, canvas.width, canvas.height);
    }
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
    });
};
export const ImageUploader = ({ onImageUpload, uploadedImage, imageSize = 80, onImageSizeChange, }) => {
    const inputRef = useRef(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [outputScale, setOutputScale] = useState(1);
    const [cropPixels, setCropPixels] = useState(null);
    const [removeBg, setRemoveBg] = useState(false);
    const [removeBgApplied, setRemoveBgApplied] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState(null);
    const [processedImageSrc, setProcessedImageSrc] = useState(null);
    const handleClick = () => {
        inputRef.current?.click();
    };
    const handleChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const url = URL.createObjectURL(file);
        setImageSrc(url);
        setOriginalImageSrc(url);
        setProcessedImageSrc(null);
        setEditorOpen(true);
    };
    const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
        setCropPixels(croppedAreaPixels);
    }, []);
    const handleClose = () => {
        if (imageSrc?.startsWith("blob:")) {
            URL.revokeObjectURL(imageSrc);
        }
        if (processedImageSrc?.startsWith("blob:") && processedImageSrc !== imageSrc) {
            URL.revokeObjectURL(processedImageSrc);
        }
        setEditorOpen(false);
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setOutputScale(1);
        setCropPixels(null);
        setRemoveBg(false);
        setRemoveBgApplied(false);
        setIsProcessing(false);
        setOriginalImageSrc(null);
        setProcessedImageSrc(null);
    };
    const handleToggleRemoveBg = async (value) => {
        const nextValue = Boolean(value);
        setRemoveBg(nextValue);
        if (!nextValue) {
            if (originalImageSrc) {
                setImageSrc(originalImageSrc);
            }
            setRemoveBgApplied(false);
            if (processedImageSrc?.startsWith("blob:")) {
                URL.revokeObjectURL(processedImageSrc);
            }
            setProcessedImageSrc(null);
            return;
        }
        if (!imageSrc || removeBgApplied) {
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch(imageSrc);
            const sourceBlob = await response.blob();
            const module = await import("@imgly/background-removal");
            const removeBackground = module.removeBackground || module.default || module;
            if (typeof removeBackground !== "function") {
                throw new Error("Background removal module is unavailable");
            }
            const removedBlob = await removeBackground(sourceBlob);
            const removedUrl = URL.createObjectURL(removedBlob);
            if (processedImageSrc?.startsWith("blob:")) {
                URL.revokeObjectURL(processedImageSrc);
            }
            setProcessedImageSrc(removedUrl);
            setImageSrc(removedUrl);
            setRemoveBgApplied(true);
        }
        catch {
            setRemoveBg(false);
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleConfirm = async () => {
        if (!imageSrc || !cropPixels) {
            handleClose();
            return;
        }
        setIsProcessing(true);
        try {
            let blob = await getCroppedImage(imageSrc, cropPixels, outputScale, zoom);
            if (removeBg && !removeBgApplied && blob) {
                const module = await import("@imgly/background-removal");
                const removeBackground = module.removeBackground || module.default || module;
                if (typeof removeBackground !== "function") {
                    throw new Error("Background removal module is unavailable");
                }
                blob = await removeBackground(blob);
            }
            if (!blob) {
                throw new Error("Image processing failed");
            }
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            await onImageUpload({ blob, dataUrl });
            handleClose();
        }
        catch (error) {
            setIsProcessing(false);
        }
    };
    return (<div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground text-center">Add Image</h3>
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
              <span>Image size</span>
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

      <Dialog open={editorOpen} onOpenChange={(open) => (open ? setEditorOpen(true) : handleClose())}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit upload</DialogTitle>
            <DialogDescription>Crop, resize, or remove background before adding to canvas.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-4">
            <div className="relative w-full h-72 md:h-96 bg-muted rounded-lg overflow-hidden">
              {imageSrc && (<Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}/>)}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Zoom</div>
                <Slider value={[zoom]} onValueChange={([value]) => setZoom(value)} min={0.5} max={3} step={0.05}/>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Output size</div>
                <Slider value={[outputScale]} onValueChange={([value]) => setOutputScale(value)} min={0.5} max={3} step={0.1}/>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remove-bg" checked={removeBg} onCheckedChange={handleToggleRemoveBg} disabled={isProcessing}/>
                <label htmlFor="remove-bg" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wand2 className="h-4 w-4"/>
                  {isProcessing ? "Removing background..." : "Remove background"}
                </label>
              </div>
              <Button type="button" variant="outline" onClick={handleClose} className="w-full" disabled={isProcessing}>
                <Trash2 className="h-4 w-4 mr-2"/>
                Delete
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={isProcessing}>{isProcessing ? "Processing..." : "Add to canvas"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);
};
