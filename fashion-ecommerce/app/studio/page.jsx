"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./studio.css";
import { ColorPicker } from "@/components/ColorPicker";
import { ImageUploader } from "@/components/ImageUploader";
import { PositionSelector } from "@/components/PositionSelector";
import { QuantitySelector } from "@/components/QuantitySelector";
import { SizeSelector } from "@/components/SizeSelector";
import { TextEditor, TextStyleControls } from "@/components/TextEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingBag, Undo, Redo, Trash2, Sparkles, Loader2, Search, MousePointer, Save, ZoomIn, ZoomOut, Grid3x3, AlignLeft, AlignCenter, AlignRight, Download, Copy, FolderOpen, Move, FileText, X, Check, } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { designsApi } from "@/lib/api/designs";
import { studioProductsApi } from "@/lib/api/studioProducts";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logger from "@/lib/logger";
import { Canvas, StaticCanvas, Image as FabricImage, Rect, IText, Textbox, Point } from "fabric";
import { v4 as uuidv4 } from "uuid";
const fabric = { Canvas, StaticCanvas, Image: FabricImage, Rect, IText, Textbox, Point };
const VIEW_KEYS = ["front", "chest", "back"];
const DEFAULT_DESIGN_AREA = { x: 0.18, y: 0.2, width: 0.64, height: 0.55 };
const EXPORT_MIN_SIZE = 4000;
const getOptimizedCloudinaryUrl = (url, width = 1600) => {
    if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/"))
        return url;
    if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto") || url.includes("/upload/w_"))
        return url;
    const parts = url.split("/upload/");
    if (parts.length < 2)
        return url;
    const [prefix, rest] = parts;
    return `${prefix}/upload/f_auto,q_auto,dpr_auto,w_${width}/${rest}`;
};
const colorNameToHex = {
    white: "#ffffff",
    black: "#111111",
    navy: "#1f2a44",
    gray: "#b6b6b6",
    blue: "#5aa7e0",
    charcoal: "#4a4a4a",
    green: "#4fa884",
    peach: "#f2b6a0",
    pink: "#f2a8c7",
    burgundy: "#722F37",
    olive: "#556B2F",
    cream: "#FFFDD0",
    lavender: "#E6E6FA",
    beige: "#f5f5dc",
    brown: "#8b5e3c",
    red: "#ef4444",
    yellow: "#facc15",
    orange: "#f97316",
    purple: "#8b5cf6",
    teal: "#14b8a6",
    cyan: "#06b6d4",
};
const isColorValue = (value) => value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl");
const resolveColorHex = (color) => {
    const normalized = color.trim().toLowerCase();
    if (!normalized)
        return "#ffffff";
    if (isColorValue(normalized))
        return color;
    return colorNameToHex[normalized] || color;
};
const resolveColorKey = (selectedColor, availableColors) => {
    if (!availableColors.length)
        return "";
    const normalizedSelected = selectedColor.trim().toLowerCase();
    if (normalizedSelected && !isColorValue(normalizedSelected)) {
        const direct = availableColors.find((c) => c.trim().toLowerCase() === normalizedSelected);
        if (direct)
            return direct.trim().toLowerCase();
    }
    const selectedHex = resolveColorHex(selectedColor).toLowerCase();
    const match = availableColors.find((c) => resolveColorHex(c).toLowerCase() === selectedHex);
    return match ? match.trim().toLowerCase() : "";
};
export default function DesignStudioPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { addItem } = useCart();
    const [selectedProduct, setSelectedProduct] = useState("tshirt");
    const [productColor, setProductColor] = useState("#ffffff");
    const [hasPickedColor, setHasPickedColor] = useState(false);
    const [productSize, setProductSize] = useState("M");
    const [productQuantity, setProductQuantity] = useState(1);
    const [selectedPosition, setSelectedPosition] = useState("front");
    const [textValue, setTextValue] = useState("");
    const [textFontSize, setTextFontSize] = useState(32);
    const [textAlign, setTextAlign] = useState("center");
    const [textColor, setTextColor] = useState("#000000");
    const [textFontFamily, setTextFontFamily] = useState("Tajawal");
    const [activeTextId, setActiveTextId] = useState(null);
    const [imageSize, setImageSize] = useState(120);
    const [activeImageId, setActiveImageId] = useState(null);
    const [designElements, setDesignElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyLength, setHistoryLength] = useState(0);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiVariations, setAiVariations] = useState([]);
    const [showAIResults, setShowAIResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const activeTab = "all";
    const [zoom, setZoom] = useState(100);
    const [showGrid, setShowGrid] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [gridSize, setGridSize] = useState(10);
    const [isSaving, setIsSaving] = useState(false);
    const [designName, setDesignName] = useState("");
    const [savedDesigns, setSavedDesigns] = useState([]);
    const [studioProducts, setStudioProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [currentDesignId, setCurrentDesignId] = useState(null);
    const [viewImageSize, setViewImageSize] = useState({ width: 1000, height: 1200 });
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const canvasRef = useRef(null);
    const canvasWrapperRef = useRef(null);
    const fabricRef = useRef(null);
    const guideRef = useRef(null);
    const designAreaRef = useRef(null);
    const viewStatesRef = useRef({});
    const historyRef = useRef({});
    const isRestoringRef = useRef(false);
    const lastViewKeyRef = useRef(null);
    const syncTimeoutRef = useRef(null);
    useEffect(() => {
        if (user) {
            designsApi.getMyDesigns().then(setSavedDesigns).catch(() => { });
        }
    }, [user]);
    useEffect(() => {
        setIsLoadingProducts(true);
        studioProductsApi
            .getActive()
            .then((data) => setStudioProducts(data))
            .catch(() => setStudioProducts([]))
            .finally(() => setIsLoadingProducts(false));
    }, []);
    const resolvedProductTemplates = useMemo(() => {
        const map = {};
        studioProducts.forEach((p) => {
            map[p.type] = { name: p.name, image: p.baseMockupUrl, price: p.price, category: "Studio" };
        });
        return map;
    }, [studioProducts]);
    const currentStudioProduct = useMemo(() => studioProducts.find((p) => p.type === selectedProduct), [studioProducts, selectedProduct]);
    const currentProduct = resolvedProductTemplates[selectedProduct];
    const activeStudioProduct = currentStudioProduct || studioProducts[0];
    const activeProduct = activeStudioProduct ? resolvedProductTemplates[activeStudioProduct.type] : undefined;
    const availableColors = useMemo(() => (activeStudioProduct?.colors || []).map((color) => color.trim()).filter(Boolean), [activeStudioProduct]);
    const colorOptions = useMemo(() => {
        const palette = Object.keys(colorNameToHex);
        if (!availableColors.length)
            return palette;
        const seen = new Set();
        const merged = [];
        const addColor = (color) => {
            const key = color.trim().toLowerCase();
            if (!key || seen.has(key))
                return;
            seen.add(key);
            merged.push(color);
        };
        availableColors.forEach(addColor);
        palette.forEach(addColor);
        return merged;
    }, [availableColors]);
    const selectedColorKey = resolveColorKey(productColor, availableColors);
    const activeColorKey = (selectedColorKey || productColor || "default").trim().toLowerCase();
    const rawViewImageUrl = useMemo(() => {
        if (!activeStudioProduct) {
            return "/placeholder-logo.png";
        }
        const colorViews = activeStudioProduct.colorViews?.[activeColorKey];
        const viewMockups = activeStudioProduct.viewMockups || {};
        const legacyColor = activeStudioProduct.colorMockups?.[activeColorKey];
        const rawUrl = colorViews?.[selectedPosition]
            || viewMockups?.[selectedPosition]
            || legacyColor
            || activeStudioProduct.baseMockupUrl
            || activeProduct?.image
            || "/placeholder-logo.png";
        return rawUrl;
    }, [activeStudioProduct, activeColorKey, selectedPosition, activeProduct]);
    const viewImageUrl = useMemo(() => getOptimizedCloudinaryUrl(rawViewImageUrl), [rawViewImageUrl]);
    const exportImageUrl = useMemo(() => getOptimizedCloudinaryUrl(rawViewImageUrl, EXPORT_MIN_SIZE), [rawViewImageUrl]);
    const designAreaRatio = useMemo(() => {
        const candidate = activeStudioProduct?.designAreas?.[selectedPosition];
        if (!candidate)
            return DEFAULT_DESIGN_AREA;
        const values = [candidate.x, candidate.y, candidate.width, candidate.height];
        if (values.some((value) => typeof value !== "number")) {
            return DEFAULT_DESIGN_AREA;
        }
        if (values.some((value) => value > 1)) {
            return DEFAULT_DESIGN_AREA;
        }
        return {
            x: Math.max(0, Math.min(1, candidate.x)),
            y: Math.max(0, Math.min(1, candidate.y)),
            width: Math.max(0, Math.min(1, candidate.width)),
            height: Math.max(0, Math.min(1, candidate.height)),
        };
    }, [activeStudioProduct, selectedPosition]);
    useEffect(() => {
        if (!availableColors.length)
            return;
        if (hasPickedColor)
            return;
        const match = resolveColorKey(productColor, availableColors);
        if (!match) {
            setProductColor(resolveColorHex(availableColors[0]));
        }
    }, [availableColors, productColor, hasPickedColor]);
    useEffect(() => {
        if (studioProducts.length === 0)
            return;
        const allowed = new Set(studioProducts.map((p) => p.type));
        if (!allowed.has(selectedProduct)) {
            setSelectedProduct(studioProducts[0].type);
        }
    }, [studioProducts, selectedProduct]);
    useEffect(() => {
        if (!viewImageUrl)
            return;
        let active = true;
        const image = new window.Image();
        image.onload = () => {
            if (!active)
                return;
            setViewImageSize({
                width: image.naturalWidth || 1000,
                height: image.naturalHeight || 1200,
            });
        };
        image.src = viewImageUrl;
        return () => {
            active = false;
        };
    }, [viewImageUrl]);
    useEffect(() => {
        const wrapper = canvasWrapperRef.current;
        if (!wrapper)
            return;
        const observer = new ResizeObserver(() => {
            const width = wrapper.clientWidth;
            const height = wrapper.clientHeight;
            if (!width || !height)
                return;
            setCanvasSize({ width, height });
        });
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [viewImageSize]);
    const getHistoryKey = useCallback((colorKey, view) => `${colorKey}::${view}`, []);
    const scheduleSyncElements = useCallback(() => {
        if (syncTimeoutRef.current)
            return;
        syncTimeoutRef.current = setTimeout(() => {
            syncTimeoutRef.current = null;
            const canvas = fabricRef.current;
            if (!canvas)
                return;
            const elements = canvas.getObjects().filter((obj) => !obj.excludeFromExport).map((obj) => {
                const id = obj.id || obj.data?.id || uuidv4();
                const isText = obj.type === "textbox" || obj.type === "i-text" || obj.type === "text";
                return {
                    id,
                    type: isText ? "text" : "image",
                    content: isText ? obj.text : (obj.data?.src || obj._originalElement?.currentSrc || obj._element?.currentSrc || ""),
                    x: obj.left || 0,
                    y: obj.top || 0,
                    width: obj.getScaledWidth(),
                    height: obj.getScaledHeight(),
                    rotation: obj.angle || 0,
                    opacity: obj.opacity ?? 1,
                    fontSize: obj.fontSize,
                    fontFamily: obj.fontFamily,
                    color: obj.fill,
                    fontWeight: obj.fontWeight,
                    textAlign: obj.textAlign,
                };
            });
            setDesignElements(elements);
        }, 60);
    }, []);
    const buildRatioState = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas)
            return null;
        const areaPx = designAreaRef.current;
        if (!areaPx)
            return null;
        const objects = canvas.getObjects().filter((obj) => !obj.excludeFromExport).map((obj) => {
            const id = obj.id || obj.data?.id || uuidv4();
            const isText = obj.type === "textbox" || obj.type === "i-text" || obj.type === "text";
            const width = obj.getScaledWidth();
            const height = obj.getScaledHeight();
            return {
                id,
                type: isText ? "text" : "image",
                text: isText ? obj.text : undefined,
                src: isText ? undefined : (obj.data?.src || obj._originalElement?.currentSrc || obj._element?.currentSrc || ""),
                left: areaPx.width > 0 ? (obj.left - areaPx.x) / areaPx.width : 0,
                top: areaPx.height > 0 ? (obj.top - areaPx.y) / areaPx.height : 0,
                width: areaPx.width > 0 ? width / areaPx.width : 0,
                height: areaPx.height > 0 ? height / areaPx.height : 0,
                angle: obj.angle || 0,
                opacity: obj.opacity ?? 1,
                fill: obj.fill,
                fontSize: isText && obj.fontSize ? obj.fontSize / areaPx.width : undefined,
                fontFamily: obj.fontFamily,
                fontWeight: obj.fontWeight,
                textAlign: obj.textAlign,
            };
        });
        return {
            area: { ...designAreaRatio },
            objects,
        };
    }, [designAreaRatio]);
    const setHistoryState = useCallback((colorKey, viewKey, state) => {
        historyRef.current[getHistoryKey(colorKey, viewKey)] = state;
        setHistoryIndex(state.index);
        setHistoryLength(state.stack.length);
    }, [getHistoryKey]);
    const pushHistory = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || isRestoringRef.current)
            return;
        const key = getHistoryKey(activeColorKey, selectedPosition);
        const historyState = historyRef.current[key] || { stack: [], index: -1 };
        const json = canvas.toJSON(["id", "data"]);
        const jsonString = JSON.stringify(json);
        const currentString = historyState.index >= 0 ? JSON.stringify(historyState.stack[historyState.index]) : "";
        if (jsonString === currentString)
            return;
        const nextStack = historyState.stack.slice(0, historyState.index + 1);
        nextStack.push(json);
        const nextState = { stack: nextStack, index: nextStack.length - 1 };
        setHistoryState(activeColorKey, selectedPosition, nextState);
    }, [activeColorKey, selectedPosition, getHistoryKey, setHistoryState]);
    const updateGuide = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || !canvasSize.width || !canvasSize.height)
            return;
        const areaPx = {
            x: designAreaRatio.x * canvasSize.width,
            y: designAreaRatio.y * canvasSize.height,
            width: designAreaRatio.width * canvasSize.width,
            height: designAreaRatio.height * canvasSize.height,
        };
        designAreaRef.current = areaPx;
        let guide = guideRef.current;
        if (!guide) {
            guide = new fabric.Rect({
                left: areaPx.x,
                top: areaPx.y,
                width: areaPx.width,
                height: areaPx.height,
                fill: "rgba(99,102,241,0.06)",
                stroke: "rgba(99,102,241,0.6)",
                strokeDashArray: [6, 6],
                selectable: false,
                evented: false,
                excludeFromExport: true,
            });
            guideRef.current = guide;
            canvas.add(guide);
        }
        else {
            guide.set({
                left: areaPx.x,
                top: areaPx.y,
                width: areaPx.width,
                height: areaPx.height,
            });
        }
        guide.bringToFront();
        canvas.clipPath = new fabric.Rect({
            left: areaPx.x,
            top: areaPx.y,
            width: areaPx.width,
            height: areaPx.height,
            absolutePositioned: true,
        });
        canvas.requestRenderAll();
    }, [canvasSize, designAreaRatio]);
    const applyBackground = useCallback((url) => {
        const canvas = fabricRef.current;
        if (!canvas || !url || !canvasSize.width || !canvasSize.height)
            return;
        fabric.Image.fromURL(url, (img) => {
            if (!img)
                return;
            const scaleX = canvasSize.width / img.width;
            const scaleY = canvasSize.height / img.height;
            img.set({
                originX: "left",
                originY: "top",
                scaleX,
                scaleY,
            });
            canvas.backgroundImage = img;
            canvas.requestRenderAll();
        }, { crossOrigin: "anonymous" });
    }, [canvasSize]);
    const clampToArea = useCallback((obj) => {
        const area = designAreaRef.current;
        if (!area || !obj)
            return;
        const bounds = obj.getBoundingRect(true);
        let deltaX = 0;
        let deltaY = 0;
        if (bounds.left < area.x) {
            deltaX = area.x - bounds.left;
        }
        if (bounds.top < area.y) {
            deltaY = area.y - bounds.top;
        }
        if (bounds.left + bounds.width > area.x + area.width) {
            deltaX = area.x + area.width - (bounds.left + bounds.width);
        }
        if (bounds.top + bounds.height > area.y + area.height) {
            deltaY = area.y + area.height - (bounds.top + bounds.height);
        }
        if (deltaX || deltaY) {
            obj.left = (obj.left || 0) + deltaX;
            obj.top = (obj.top || 0) + deltaY;
            obj.setCoords();
        }
    }, []);
    const initCanvas = useCallback(() => {
        if (!canvasRef.current || fabricRef.current)
            return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            preserveObjectStacking: true,
            selection: true,
        });
        fabricRef.current = canvas;
        canvas.on("selection:created", () => {
            const active = canvas.getActiveObject();
            if (!active || active.excludeFromExport) {
                setSelectedElement(null);
                return;
            }
            const id = active.id || active.data?.id;
            setSelectedElement(id || null);
            if (active.type === "image") {
                setActiveImageId(id || null);
                setActiveTextId(null);
                setImageSize(Math.round(active.getScaledWidth()));
            }
            else if (active.type === "textbox" || active.type === "i-text" || active.type === "text") {
                setActiveTextId(id || null);
                setActiveImageId(null);
                setTextValue(active.text || "");
                setTextFontSize(active.fontSize || 32);
                setTextAlign(active.textAlign || "center");
                setTextColor(active.fill || "#111111");
                setTextFontFamily(active.fontFamily || "Tajawal");
            }
        });
        canvas.on("selection:updated", () => {
            const active = canvas.getActiveObject();
            if (!active || active.excludeFromExport) {
                setSelectedElement(null);
                return;
            }
            const id = active.id || active.data?.id;
            setSelectedElement(id || null);
            if (active.type === "image") {
                setActiveImageId(id || null);
                setActiveTextId(null);
                setImageSize(Math.round(active.getScaledWidth()));
            }
            else if (active.type === "textbox" || active.type === "i-text" || active.type === "text") {
                setActiveTextId(id || null);
                setActiveImageId(null);
                setTextValue(active.text || "");
                setTextFontSize(active.fontSize || 32);
                setTextAlign(active.textAlign || "center");
                setTextColor(active.fill || "#111111");
                setTextFontFamily(active.fontFamily || "Tajawal");
            }
        });
        canvas.on("selection:cleared", () => {
            setSelectedElement(null);
        });
        canvas.on("object:moving", (event) => {
            if (snapToGrid) {
                const obj = event.target;
                if (obj) {
                    obj.left = Math.round((obj.left || 0) / gridSize) * gridSize;
                    obj.top = Math.round((obj.top || 0) / gridSize) * gridSize;
                }
            }
            clampToArea(event.target);
        });
        canvas.on("object:scaling", (event) => {
            clampToArea(event.target);
        });
        canvas.on("object:rotating", (event) => {
            clampToArea(event.target);
        });
        const handleObjectChange = () => {
            scheduleSyncElements();
            pushHistory();
        };
        canvas.on("object:added", handleObjectChange);
        canvas.on("object:modified", handleObjectChange);
        canvas.on("object:removed", handleObjectChange);
    }, [clampToArea, gridSize, pushHistory, scheduleSyncElements, snapToGrid]);
    useEffect(() => {
        initCanvas();
    }, [initCanvas]);
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || !canvasSize.width || !canvasSize.height)
            return;
        canvas.setWidth(canvasSize.width);
        canvas.setHeight(canvasSize.height);
        canvas.calcOffset();
        applyBackground(viewImageUrl);
        updateGuide();
    }, [canvasSize, applyBackground, updateGuide, viewImageUrl]);
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || !canvasSize.width || !canvasSize.height)
            return;
        canvas.zoomToPoint(new fabric.Point(canvasSize.width / 2, canvasSize.height / 2), zoom / 100);
        canvas.requestRenderAll();
    }, [zoom, canvasSize]);
    const persistCurrentView = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const ratioState = buildRatioState();
        const state = {
            view: selectedPosition,
            colorKey: activeColorKey,
            canvasJson: canvas.toJSON(["id", "data"]),
            ratioState,
            previewSize: { width: canvas.getWidth(), height: canvas.getHeight() },
            updatedAt: new Date().toISOString(),
        };
        if (!viewStatesRef.current[activeColorKey]) {
            viewStatesRef.current[activeColorKey] = {};
        }
        viewStatesRef.current[activeColorKey][selectedPosition] = state;
    }, [activeColorKey, buildRatioState, selectedPosition]);
    const loadViewState = useCallback(async (colorKey, viewKey) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        isRestoringRef.current = true;
        canvas.getObjects().forEach((obj) => canvas.remove(obj));
        const state = viewStatesRef.current?.[colorKey]?.[viewKey];
        if (state?.ratioState) {
            const areaRatio = state.ratioState.area || designAreaRatio;
            const areaPx = {
                x: areaRatio.x * canvasSize.width,
                y: areaRatio.y * canvasSize.height,
                width: areaRatio.width * canvasSize.width,
                height: areaRatio.height * canvasSize.height,
            };
            designAreaRef.current = areaPx;
            const objects = [];
            for (const obj of state.ratioState.objects || []) {
                if (obj.type === "image" && obj.src) {
                    const image = await new Promise((resolve) => {
                        fabric.Image.fromURL(obj.src, (img) => resolve(img), { crossOrigin: "anonymous" });
                    });
                    if (!image)
                        continue;
                    const width = obj.width * areaPx.width;
                    const height = obj.height * areaPx.height;
                    image.set({
                        left: areaPx.x + obj.left * areaPx.width,
                        top: areaPx.y + obj.top * areaPx.height,
                        angle: obj.angle || 0,
                        opacity: obj.opacity ?? 1,
                        id: obj.id || uuidv4(),
                        data: { id: obj.id || uuidv4(), src: obj.src },
                    });
                    image.scaleX = width / image.width;
                    image.scaleY = height / image.height;
                    objects.push(image);
                }
                if (obj.type === "text" && obj.text) {
                    const fontSize = obj.fontSize ? obj.fontSize * areaPx.width : 32;
                    const textObj = new fabric.Textbox(obj.text, {
                        left: areaPx.x + obj.left * areaPx.width,
                        top: areaPx.y + obj.top * areaPx.height,
                        fontSize,
                        fill: obj.fill || "#111111",
                        fontFamily: obj.fontFamily || "Tajawal",
                        fontWeight: obj.fontWeight || "normal",
                        textAlign: obj.textAlign || "center",
                        angle: obj.angle || 0,
                        opacity: obj.opacity ?? 1,
                    });
                    textObj.set({
                        id: obj.id || uuidv4(),
                        data: { id: obj.id || uuidv4() },
                    });
                    const width = obj.width * areaPx.width;
                    const height = obj.height * areaPx.height;
                    if (width > 0) {
                        textObj.set({ width });
                    }
                    if (height > 0 && textObj.height) {
                        textObj.scaleY = height / textObj.height;
                    }
                    objects.push(textObj);
                }
            }
            objects.forEach((obj) => canvas.add(obj));
        }
        else if (state?.canvasJson) {
            await new Promise((resolve) => {
                canvas.loadFromJSON(state.canvasJson, () => resolve());
            });
        }
        updateGuide();
        canvas.requestRenderAll();
        scheduleSyncElements();
        const historyState = {
            stack: state?.canvasJson ? [state.canvasJson] : [canvas.toJSON(["id", "data"])],
            index: 0,
        };
        setHistoryState(colorKey, viewKey, historyState);
        isRestoringRef.current = false;
    }, [canvasSize, designAreaRatio, scheduleSyncElements, setHistoryState, updateGuide]);
    useEffect(() => {
        const nextKey = `${activeColorKey}::${selectedPosition}`;
        if (lastViewKeyRef.current && lastViewKeyRef.current !== nextKey) {
            persistCurrentView();
        }
        lastViewKeyRef.current = nextKey;
        if (!canvasSize.width || !canvasSize.height)
            return;
        loadViewState(activeColorKey, selectedPosition);
        applyBackground(viewImageUrl);
    }, [activeColorKey, selectedPosition, canvasSize, persistCurrentView, loadViewState, applyBackground, viewImageUrl]);
    const addTextElement = useCallback((content) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const area = designAreaRef.current;
        const safe = area || { x: 0, y: 0, width: canvas.getWidth(), height: canvas.getHeight() };
        const text = new fabric.IText(content?.trim() ? content : "Your Text Here", {
            left: safe.x + safe.width / 2,
            top: safe.y + safe.height / 2,
            originX: "center",
            originY: "center",
            fontSize: textFontSize,
            fill: textColor,
            fontFamily: textFontFamily,
            textAlign,
        });
        const id = uuidv4();
        text.set({ id, data: { id } });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
        setSelectedElement(id);
        setActiveTextId(id);
    }, [pushHistory, scheduleSyncElements, textAlign, textColor, textFontFamily, textFontSize]);
    const addImageElement = useCallback((imageUrl) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const area = designAreaRef.current;
        const safe = area || { x: 0, y: 0, width: canvas.getWidth(), height: canvas.getHeight() };
        fabric.Image.fromURL(imageUrl, (img) => {
            if (!img)
                return;
            const maxSize = Math.min(safe.width, safe.height) * 0.6;
            img.scaleToWidth(maxSize);
            img.scaleToHeight(maxSize);
            const id = uuidv4();
            img.set({
                left: safe.x + safe.width / 2 - img.getScaledWidth() / 2,
                top: safe.y + safe.height / 2 - img.getScaledHeight() / 2,
                id,
                data: { id, src: imageUrl },
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
            scheduleSyncElements();
            pushHistory();
            setSelectedElement(id);
            setActiveImageId(id);
            setImageSize(Math.round(img.getScaledWidth()));
        }, { crossOrigin: "anonymous" });
    }, [pushHistory, scheduleSyncElements]);
    const handleImageUpload = async ({ blob, dataUrl }) => {
        if (!blob) {
            return;
        }
        try {
            const uploaded = await designsApi.uploadAsset(blob);
            const uploadedUrl = uploaded?.url || uploaded?.data?.url || dataUrl;
            addImageElement(uploadedUrl || dataUrl);
        }
        catch (error) {
            toast({
                title: "Upload failed",
                description: error.message || "Could not upload image",
                variant: "destructive",
            });
            addImageElement(dataUrl);
        }
    };
    const getActiveTextElement = () => {
        const canvas = fabricRef.current;
        if (!canvas)
            return null;
        const active = canvas.getActiveObject();
        if (active && (active.type === "textbox" || active.type === "i-text" || active.type === "text")) {
            return active;
        }
        if (!activeTextId)
            return null;
        return canvas.getObjects().find((obj) => obj.id === activeTextId) || null;
    };
    const getActiveImageElement = () => {
        const canvas = fabricRef.current;
        if (!canvas)
            return null;
        const active = canvas.getActiveObject();
        if (active && active.type === "image") {
            return active;
        }
        if (!activeImageId)
            return null;
        return canvas.getObjects().find((obj) => obj.id === activeImageId) || null;
    };
    const handleTextChange = (value) => {
        setTextValue(value);
        const target = getActiveTextElement();
        if (!target) {
            if (value.trim()) {
                addTextElement(value);
            }
            return;
        }
        target.set({ text: value });
        fabricRef.current?.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const handleFontSizeChange = (size) => {
        setTextFontSize(size);
        const target = getActiveTextElement();
        if (!target)
            return;
        target.set({ fontSize: size });
        fabricRef.current?.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const handleTextAlignChange = (align) => {
        setTextAlign(align);
        const target = getActiveTextElement();
        if (!target)
            return;
        target.set({ textAlign: align });
        fabricRef.current?.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const handleTextColorChange = (color) => {
        setTextColor(color);
        const target = getActiveTextElement();
        if (!target)
            return;
        target.set({ fill: color });
        fabricRef.current?.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const handleFontFamilyChange = (font) => {
        setTextFontFamily(font);
        const target = getActiveTextElement();
        if (!target)
            return;
        target.set({ fontFamily: font });
        fabricRef.current?.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const handleImageSizeChange = (size) => {
        setImageSize(size);
        const target = getActiveImageElement();
        if (!target)
            return;
        if (target.width && target.height) {
            target.scaleX = size / target.width;
            target.scaleY = size / target.height;
            target.setCoords();
            fabricRef.current?.requestRenderAll();
            scheduleSyncElements();
            pushHistory();
        }
    };
    const updateElement = (id, updates) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const target = canvas.getObjects().find((obj) => obj.id === id);
        if (!target)
            return;
        if (updates.rotation !== undefined) {
            target.set({ angle: updates.rotation });
        }
        if (updates.opacity !== undefined) {
            target.set({ opacity: updates.opacity });
        }
        if (target.type === "image" && (updates.width || updates.height)) {
            const width = updates.width || target.getScaledWidth();
            const height = updates.height || target.getScaledHeight();
            if (target.width && target.height) {
                target.scaleX = width / target.width;
                target.scaleY = height / target.height;
            }
        }
        target.setCoords();
        canvas.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const deleteElement = (id) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const target = canvas.getObjects().find((obj) => obj.id === id);
        if (!target)
            return;
        canvas.remove(target);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
        setSelectedElement(null);
    };
    const duplicateElement = (id) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const target = canvas.getObjects().find((obj) => obj.id === id);
        if (!target)
            return;
        target.clone((clone) => {
            const newId = uuidv4();
            clone.set({
                left: (clone.left || 0) + 20,
                top: (clone.top || 0) + 20,
                id: newId,
                data: { ...(clone.data || {}), id: newId },
            });
            canvas.add(clone);
            canvas.setActiveObject(clone);
            canvas.requestRenderAll();
            scheduleSyncElements();
            pushHistory();
            setSelectedElement(newId);
        });
    };
    const alignElements = (alignment) => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const elements = canvas.getObjects().filter((obj) => !obj.excludeFromExport);
        if (elements.length < 2) {
            toast({
                title: "Not enough elements",
                description: "You need at least 2 elements to align them",
                variant: "destructive",
            });
            return;
        }
        if (alignment === "left") {
            const minX = Math.min(...elements.map((el) => el.left || 0));
            elements.forEach((el) => el.set({ left: minX }));
        }
        else if (alignment === "right") {
            const maxX = Math.max(...elements.map((el) => (el.left || 0) + el.getScaledWidth()));
            elements.forEach((el) => el.set({ left: maxX - el.getScaledWidth() }));
        }
        else if (alignment === "center") {
            const avgX = elements.reduce((sum, el) => sum + (el.left || 0) + el.getScaledWidth() / 2, 0) / elements.length;
            elements.forEach((el) => el.set({ left: avgX - el.getScaledWidth() / 2 }));
        }
        canvas.requestRenderAll();
        scheduleSyncElements();
        pushHistory();
    };
    const undo = () => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const key = getHistoryKey(activeColorKey, selectedPosition);
        const historyState = historyRef.current[key];
        if (!historyState || historyState.index <= 0)
            return;
        isRestoringRef.current = true;
        const nextIndex = historyState.index - 1;
        canvas.loadFromJSON(historyState.stack[nextIndex], () => {
            historyState.index = nextIndex;
            setHistoryState(activeColorKey, selectedPosition, historyState);
            updateGuide();
            canvas.requestRenderAll();
            scheduleSyncElements();
            isRestoringRef.current = false;
        });
    };
    const redo = () => {
        const canvas = fabricRef.current;
        if (!canvas)
            return;
        const key = getHistoryKey(activeColorKey, selectedPosition);
        const historyState = historyRef.current[key];
        if (!historyState || historyState.index >= historyState.stack.length - 1)
            return;
        isRestoringRef.current = true;
        const nextIndex = historyState.index + 1;
        canvas.loadFromJSON(historyState.stack[nextIndex], () => {
            historyState.index = nextIndex;
            setHistoryState(activeColorKey, selectedPosition, historyState);
            updateGuide();
            canvas.requestRenderAll();
            scheduleSyncElements();
            isRestoringRef.current = false;
        });
    };
    const generateAIVariations = async () => {
        if (designElements.length === 0) {
            toast({
                title: "Nothing to enhance",
                description: "Please add some elements to your design first",
                variant: "destructive",
            });
            return;
        }
        setIsGeneratingAI(true);
        setShowAIResults(true);
        const hasText = designElements.some((el) => el.type === "text");
        const hasImage = designElements.some((el) => el.type === "image");
        const textContent = designElements.filter((el) => el.type === "text").map((el) => el.content).join(" ");
        setTimeout(() => {
            const variations = [];
            if (hasText && hasImage) {
                variations.push({
                    id: "1",
                    imageUrl: "/enhanced-modern-graphic-design-on-white-tshirt.jpg",
                    prompt: "Modern layout with balanced typography and artwork",
                    selected: false,
                }, {
                    id: "2",
                    imageUrl: "/artistic-colorful-design-on-white-tshirt.jpg",
                    prompt: "Colorful layout with playful typography",
                    selected: false,
                }, {
                    id: "3",
                    imageUrl: "/bold-typography-design-on-white-tshirt.jpg",
                    prompt: "Bold typographic layout with strong contrast",
                    selected: false,
                });
            }
            else if (hasText) {
                variations.push({
                    id: "1",
                    imageUrl: "/bold-typography-design-on-white-tshirt.jpg",
                    prompt: `"${textContent}" - bold typography`,
                    selected: false,
                }, {
                    id: "2",
                    imageUrl: "/enhanced-modern-graphic-design-on-white-tshirt.jpg",
                    prompt: `"${textContent}" - modern composition`,
                    selected: false,
                });
            }
            else if (hasImage) {
                variations.push({
                    id: "1",
                    imageUrl: "/enhanced-modern-graphic-design-on-white-tshirt.jpg",
                    prompt: "Refined graphic layout",
                    selected: false,
                }, {
                    id: "2",
                    imageUrl: "/artistic-colorful-design-on-white-tshirt.jpg",
                    prompt: "Vibrant artistic layout",
                    selected: false,
                });
            }
            setAiVariations(variations);
            setIsGeneratingAI(false);
            toast({
                title: "Variations ready",
                description: `${variations.length} AI-inspired variations generated`,
            });
        }, 2000);
    };
    const selectAIVariation = (id) => {
        setAiVariations(aiVariations.map((v) => ({ ...v, selected: v.id === id })));
    };
    const addAIDesignToCart = async () => {
        const selected = aiVariations.find((v) => v.selected);
        if (!selected) {
            toast({
                title: "No design selected",
                description: "Please select a design variation first",
                variant: "destructive",
            });
            return;
        }
        if (!user || !isAuthenticated) {
            toast({
                title: "Sign in required",
                description: "Please sign in or create an account to add designs to your cart",
                variant: "default",
            });
            setTimeout(() => {
                router.push("/login");
            }, 1500);
            return;
        }
        try {
            const product = activeProduct;
            if (!product) {
                toast({
                    title: "No studio product",
                    description: "No active studio products are available.",
                    variant: "destructive",
                });
                return;
            }
            await addItem({
                id: `ai-${Date.now()}-${selected.id}`,
                name: `AI Enhanced ${product.name}`,
                price: product.price,
                quantity: 1,
                size: productSize,
                color: selectedColorKey || productColor,
                image: selected.imageUrl,
                isCustom: true,
            });
            toast({
                title: "AI Design added to cart",
                description: `Custom ${product.name} (${selected.prompt}) - $${product.price}`,
            });
            setShowAIResults(false);
            setAiVariations([]);
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to add design to cart. Please try again.",
                variant: "destructive",
            });
        }
    };
    const generatePreview = async () => {
        const canvas = fabricRef.current;
        if (!canvas)
            return null;
        const guide = guideRef.current;
        if (guide) {
            guide.set({ visible: false });
        }
        canvas.requestRenderAll();
        const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
        if (guide) {
            guide.set({ visible: true });
        }
        canvas.requestRenderAll();
        return dataUrl;
    };
    const saveDesign = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please log in to save your design",
                variant: "destructive",
            });
            router.push("/login");
            return;
        }
        if (designElements.length === 0) {
            toast({
                title: "Nothing to save",
                description: "Please add some elements to your design first",
                variant: "destructive",
            });
            return;
        }
        if (!activeStudioProduct?._id) {
            toast({
                title: "Missing studio product",
                description: "Please select a studio product before saving.",
                variant: "destructive",
            });
            return;
        }
        const name = designName.trim() || `My Design ${new Date().toLocaleDateString()}`;
        setIsSaving(true);
        try {
            persistCurrentView();
            const preview = await generatePreview();
            const views = [];
            Object.entries(viewStatesRef.current || {}).forEach(([colorKey, viewMap]) => {
                Object.entries(viewMap || {}).forEach(([view, state]) => {
                    views.push({
                        view,
                        colorKey,
                        canvasJson: state.canvasJson,
                        ratioState: state.ratioState,
                        previewSize: state.previewSize,
                    });
                });
            });
            const designData = {
                name,
                baseProduct: {
                    type: selectedProduct,
                    color: selectedColorKey || productColor,
                    size: productSize,
                },
                baseProductId: activeStudioProduct._id,
                elements: designElements.map((el) => ({
                    id: el.id,
                    type: el.type,
                    content: el.content,
                    x: el.x,
                    y: el.y,
                    width: el.width || 100,
                    height: el.height || 100,
                    rotation: el.rotation || 0,
                    fontSize: el.fontSize,
                    fontFamily: el.fontFamily,
                    color: el.color,
                    fontWeight: el.fontWeight,
                })),
                views,
                thumbnail: preview || undefined,
                designImageURL: preview || undefined,
                designMetadata: {
                    productType: selectedProduct,
                    productColor: selectedColorKey || productColor,
                    productSize,
                    view: selectedPosition,
                    mockup: viewImageUrl,
                },
                price: activeProduct?.price || activeStudioProduct?.price || 0,
                status: "draft",
            };
            const savedDesign = await designsApi.createDesign(designData);
            setCurrentDesignId(savedDesign?._id || null);
            logger.log("Design saved successfully:", savedDesign);
            toast({
                title: "Design saved successfully!",
                description: "Your design has been saved to My Designs",
            });
            setTimeout(() => {
                router.push("/my-designs");
            }, 1200);
        }
        catch (error) {
            logger.error("Failed to save design:", error);
            toast({
                title: "Save Failed",
                description: error.message || "Failed to save design. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    const exportDesign = useCallback(async () => {
        if (designElements.length === 0) {
            toast({
                title: "Nothing to export",
                description: "Please add some elements to your design first",
                variant: "destructive",
            });
            return;
        }
        try {
            persistCurrentView();
            const viewState = viewStatesRef.current?.[activeColorKey]?.[selectedPosition];
            const ratioState = viewState?.ratioState || buildRatioState();
            if (!ratioState) {
                toast({
                    title: "Export failed",
                    description: "No design data available",
                    variant: "destructive",
                });
                return;
            }
            const baseImage = await new Promise((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
                img.src = exportImageUrl;
            });
            const scale = EXPORT_MIN_SIZE / Math.min(baseImage.naturalWidth, baseImage.naturalHeight);
            const exportWidth = Math.round(baseImage.naturalWidth * scale);
            const exportHeight = Math.round(baseImage.naturalHeight * scale);
            const exportCanvasEl = document.createElement("canvas");
            const exportCanvas = new fabric.StaticCanvas(exportCanvasEl, { width: exportWidth, height: exportHeight });
            await new Promise((resolve) => {
                fabric.Image.fromURL(exportImageUrl, (img) => {
                    if (img) {
                        img.set({
                            originX: "left",
                            originY: "top",
                            scaleX: exportWidth / img.width,
                            scaleY: exportHeight / img.height,
                        });
                        exportCanvas.backgroundImage = img;
                        exportCanvas.requestRenderAll();
                    }
                    resolve();
                }, { crossOrigin: "anonymous" });
            });
            const areaRatio = ratioState.area || DEFAULT_DESIGN_AREA;
            const areaPx = {
                x: areaRatio.x * exportWidth,
                y: areaRatio.y * exportHeight,
                width: areaRatio.width * exportWidth,
                height: areaRatio.height * exportHeight,
            };
            const objectPromises = (ratioState.objects || []).map(async (obj) => {
                if (obj.type === "image" && obj.src) {
                    const image = await new Promise((resolve) => {
                        fabric.Image.fromURL(obj.src, (img) => resolve(img), { crossOrigin: "anonymous" });
                    });
                    if (!image)
                        return;
                    const width = obj.width * areaPx.width;
                    const height = obj.height * areaPx.height;
                    image.set({
                        left: areaPx.x + obj.left * areaPx.width,
                        top: areaPx.y + obj.top * areaPx.height,
                        angle: obj.angle || 0,
                        opacity: obj.opacity ?? 1,
                    });
                    image.scaleX = width / image.width;
                    image.scaleY = height / image.height;
                    exportCanvas.add(image);
                }
                if (obj.type === "text" && obj.text) {
                    const fontSize = obj.fontSize ? obj.fontSize * areaPx.width : 32;
                    const textObj = new fabric.Textbox(obj.text, {
                        left: areaPx.x + obj.left * areaPx.width,
                        top: areaPx.y + obj.top * areaPx.height,
                        fontSize,
                        fill: obj.fill || "#111111",
                        fontFamily: obj.fontFamily || "Tajawal",
                        fontWeight: obj.fontWeight || "normal",
                        textAlign: obj.textAlign || "center",
                        angle: obj.angle || 0,
                        opacity: obj.opacity ?? 1,
                        width: obj.width * areaPx.width,
                    });
                    exportCanvas.add(textObj);
                }
            });
            await Promise.all(objectPromises);
            const dataUrl = exportCanvas.toDataURL({ format: "png", quality: 1 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${designName || "design"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (currentDesignId) {
                designsApi.exportDesign(currentDesignId, dataUrl).catch(() => { });
            }
            toast({
                title: "Design exported",
                description: "Your design has been downloaded as PNG",
            });
        }
        catch (error) {
            toast({
                title: "Export failed",
                description: error.message || "Could not export design",
                variant: "destructive",
            });
        }
    }, [activeColorKey, buildRatioState, currentDesignId, designElements.length, designName, exportImageUrl, persistCurrentView, selectedPosition, toast]);
    const loadDesign = async (design) => {
        try {
            const fullDesign = await designsApi.getDesign(design._id);
            setCurrentDesignId(fullDesign._id);
            setDesignName(fullDesign.name);
            setSelectedProduct(fullDesign.baseProduct?.type || selectedProduct);
            setProductColor(fullDesign.baseProduct?.color || productColor);
            setHasPickedColor(true);
            setProductSize(fullDesign.baseProduct?.size || productSize);
            const preferredView = fullDesign.designMetadata?.view || fullDesign.views?.[0]?.view || "front";
            const safeView = VIEW_KEYS.includes(preferredView) ? preferredView : "front";
            setSelectedPosition(safeView);
            const viewStates = {};
            if (Array.isArray(fullDesign.views) && fullDesign.views.length > 0) {
                fullDesign.views.forEach((view) => {
                    const colorKey = String(view.colorKey || "").toLowerCase();
                    if (!colorKey)
                        return;
                    if (!viewStates[colorKey]) {
                        viewStates[colorKey] = {};
                    }
                    viewStates[colorKey][view.view] = view;
                });
                viewStatesRef.current = viewStates;
            }
            else if (Array.isArray(fullDesign.elements)) {
                const fallbackColorKey = String(fullDesign.baseProduct?.color || activeColorKey || "").trim().toLowerCase();
                const targetColorKey = fallbackColorKey || activeColorKey;
                viewStatesRef.current = {};
                if (!viewStatesRef.current[targetColorKey]) {
                    viewStatesRef.current[targetColorKey] = {};
                }
                viewStatesRef.current[targetColorKey][safeView] = {
                    view: safeView,
                    colorKey: targetColorKey,
                    ratioState: buildRatioState(),
                    canvasJson: null,
                    previewSize: canvasSize,
                };
            }
            setShowLoadDialog(false);
            toast({
                title: "Design loaded",
                description: `${fullDesign.name} has been loaded successfully`,
            });
        }
        catch (error) {
            toast({
                title: "Failed to load design",
                description: error.message || "Could not load the design",
                variant: "destructive",
            });
        }
    };
    const handleAddToCart = async () => {
        if (!user || !isAuthenticated) {
            toast({
                title: "Sign in required",
                description: "Please sign in or create an account to add designs to your cart",
                variant: "default",
            });
            setTimeout(() => {
                router.push("/login");
            }, 1500);
            return;
        }
        try {
            const product = activeProduct;
            if (!product) {
                toast({
                    title: "No studio product",
                    description: "No active studio products are available.",
                    variant: "destructive",
                });
                return;
            }
            await addItem({
                id: `custom-${Date.now()}-${selectedProduct}-${productSize}`,
                name: `Custom ${product.name}`,
                price: product.price,
                quantity: productQuantity,
                size: productSize,
                color: selectedColorKey || productColor,
                image: viewImageUrl,
                isCustom: true,
            });
            toast({
                title: "Design added to cart",
                description: `Custom ${product.name} (Size: ${productSize}) - $${product.price}`,
            });
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to add design to cart. Please try again.",
                variant: "destructive",
            });
        }
    };
    const selectedElementData = designElements.find((el) => el.id === selectedElement);
    const filteredProducts = Object.entries(resolvedProductTemplates).filter(([key, product]) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" || product.category.toLowerCase() === activeTab.toLowerCase();
        return matchesSearch && matchesTab;
    });
    if (!isLoadingProducts && studioProducts.length === 0) {
        return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white flex flex-col pt-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-20">
          <Card className="max-w-2xl mx-auto p-8 bg-white border border-gray-200 shadow-xl text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Studio is not available</h1>
            <p className="text-gray-600">
              No active studio products found. Please create and activate Studio Products in the admin dashboard.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                Back Home
              </Button>
              <Button onClick={() => router.push("/admin")}>Go to Admin</Button>
            </div>
          </Card>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white flex flex-col pt-20">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden flex flex-col shadow-xl flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 studio-theme font-tajawal">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Products</h3>
                <span className="text-xs text-muted-foreground">{filteredProducts.length}</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary/40"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map(([key, product]) => (<button key={key} onClick={() => setSelectedProduct(key)} className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${selectedProduct === key
                ? "border-primary ring-2 ring-primary/20 shadow-card"
                : "border-border hover:border-primary/50"}`}>
                    <div className="relative w-full h-full">
                      <Image src={product.image || "/placeholder-logo.png"} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw"/>
                    </div>
                  </button>))}
              </div>
            </div>

            <SizeSelector selectedSize={productSize} onSizeChange={setProductSize}/>

            <QuantitySelector quantity={productQuantity} onQuantityChange={setProductQuantity}/>

            <PositionSelector selectedPosition={selectedPosition} onPositionChange={setSelectedPosition}/>

            <ColorPicker selectedColor={productColor} onColorChange={(color) => {
            setProductColor(color);
            setHasPickedColor(true);
        }} colors={colorOptions}/>

            <ImageUploader onImageUpload={handleImageUpload} uploadedImage={getActiveImageElement()?.data?.src || null} imageSize={imageSize} onImageSizeChange={handleImageSizeChange}/>

            <TextEditor text={textValue} onTextChange={handleTextChange} fontSize={textFontSize} onFontSizeChange={handleFontSizeChange} textAlign={textAlign} onTextAlignChange={handleTextAlignChange} fontFamily={textFontFamily}/>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-muted/30 min-w-0 overflow-hidden">
          <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-sm flex-shrink-0 gap-4 h-[48px]">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Button variant={showGrid ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setShowGrid(!showGrid)} title="Toggle Grid">
                  <Grid3x3 className="h-3.5 w-3.5"/>
                </Button>
                <Button variant={snapToGrid ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setSnapToGrid(!snapToGrid)} title="Snap to Grid">
                  <Move className="h-3.5 w-3.5"/>
                </Button>
              </div>
              <div className="w-px h-6 bg-border"/>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
                  <Undo className="h-3.5 w-3.5"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= historyLength - 1} title="Redo (Ctrl+Shift+Z)">
                  <Redo className="h-3.5 w-3.5"/>
                </Button>
              </div>
              <div className="w-px h-6 bg-border"/>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 10))} title="Zoom Out">
                  <ZoomOut className="h-3.5 w-3.5"/>
                </Button>
                <span className="text-xs font-medium px-2 min-w-[52px] text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 10))} title="Zoom In">
                  <ZoomIn className="h-3.5 w-3.5"/>
                </Button>
                {zoom !== 100 && (<Button variant="ghost" size="sm" className="h-8 px-2 text-[10px]" onClick={() => setZoom(100)} title="Reset Zoom">
                    Reset
                  </Button>)}
              </div>
              {selectedElement && designElements.length > 1 && (<>
                  <div className="w-px h-6 bg-border"/>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alignElements("left")} title="Align Left">
                      <AlignLeft className="h-3.5 w-3.5"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alignElements("center")} title="Align Center">
                      <AlignCenter className="h-3.5 w-3.5"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alignElements("right")} title="Align Right">
                      <AlignRight className="h-3.5 w-3.5"/>
                    </Button>
                  </div>
                </>)}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" onClick={generateAIVariations} disabled={isGeneratingAI || designElements.length === 0} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-gray-900 shadow-lg hover:shadow-xl transition-all text-xs h-8 px-3 font-medium">
                {isGeneratingAI ? (<>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/>
                    Generating...
                  </>) : (<>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5"/>
                    AI Enhance
                  </>)}
              </Button>
              <Button size="sm" variant="outline" onClick={exportDesign} disabled={designElements.length === 0} className="text-xs h-8 px-3 font-medium border-2">
                <Download className="mr-1.5 h-3.5 w-3.5"/>
                Export
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 min-h-0">
            <div className="max-w-4xl mx-auto pt-6">
              <div className="relative mx-auto max-h-[650px] shadow-2xl rounded-lg overflow-hidden bg-background" style={{
            backgroundImage: showGrid
                ? `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`
                : "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
            backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            backgroundColor: "#f9fafb",
        }}>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div ref={canvasWrapperRef} className="relative w-full h-full rounded-lg overflow-hidden" style={{ aspectRatio: `${viewImageSize.width} / ${viewImageSize.height}` }}>
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 w-full max-w-3xl mx-auto">
              <TextStyleControls fontFamily={textFontFamily} onFontFamilyChange={handleFontFamilyChange} textColor={textColor} onTextColorChange={handleTextColorChange}/>
            </div>
            {showAIResults && (<div className="mt-6 bg-background border border-border rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600"/>
                      AI Enhanced Variations
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowAIResults(false)}>
                      <X className="h-4 w-4"/>
                    </Button>
                  </div>

                  {isGeneratingAI ? (<div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (<div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"/>))}
                    </div>) : (<>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {aiVariations.map((variation) => (<button key={variation.id} onClick={() => selectAIVariation(variation.id)} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${variation.selected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"}`}>
                            <div className="relative w-full h-full">
                              <Image src={variation.imageUrl || "/placeholder-logo.png"} alt={variation.prompt} fill className="object-cover" sizes="(max-width: 768px) 25vw, 20vw"/>
                            </div>
                            {variation.selected && (<div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="w-4 h-4"/>
                              </div>)}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-xs text-gray-900 font-medium">{variation.prompt}</p>
                            </div>
                          </button>))}
                      </div>
                      <Button className="w-full" onClick={addAIDesignToCart} disabled={!aiVariations.some((v) => v.selected)}>
                        <ShoppingBag className="mr-2 h-4 w-4"/>
                        Add Selected AI Design to Cart
                      </Button>
                    </>)}
                </div>)}
            </div>
          </div>
        <div className="w-96 border-l border-border bg-background overflow-hidden flex flex-col shadow-sm flex-shrink-0">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 space-y-4 overflow-y-auto bg-muted/20 flex-1 min-h-0">
            <Card className="p-4 bg-background shadow-sm">
              <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4"/>
                Product Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-2 block text-muted-foreground font-medium">Product</Label>
                  <p className="text-sm font-semibold">{activeProduct?.name || "Studio Product"}</p>
                </div>

                <div>
                  <Label className="text-xs mb-2 block text-muted-foreground font-medium">Size</Label>
                  <Select value={productSize} onValueChange={setProductSize}>
                    <SelectTrigger className="h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS - Extra Small</SelectItem>
                      <SelectItem value="S">S - Small</SelectItem>
                      <SelectItem value="M">M - Medium</SelectItem>
                      <SelectItem value="L">L - Large</SelectItem>
                      <SelectItem value="XL">XL - Extra Large</SelectItem>
                      <SelectItem value="XXL">XXL - 2X Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 border-t">
                  <Label className="text-xs mb-2 block text-muted-foreground font-medium">Price</Label>
                  <p className="text-3xl font-bold text-primary">${activeProduct?.price ?? 0}</p>
                </div>
              </div>
            </Card>

            {selectedElementData && (<Card className="p-4 bg-background shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MousePointer className="h-4 w-4"/>
                    Selected Element
                  </h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateElement(selectedElement)} title="Duplicate (Ctrl+D)">
                      <Copy className="h-4 w-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" onClick={() => deleteElement(selectedElement)} title="Delete (Delete)">
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium text-muted-foreground">Rotation</Label>
                      <span className="text-xs font-semibold">{selectedElementData.rotation || 0}deg</span>
                    </div>
                    <Slider value={[selectedElementData.rotation || 0]} onValueChange={([value]) => updateElement(selectedElement, { rotation: value })} min={0} max={360} step={1}/>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium text-muted-foreground">Opacity</Label>
                      <span className="text-xs font-semibold">{Math.round((selectedElementData.opacity || 1) * 100)}%</span>
                    </div>
                    <Slider value={[(selectedElementData.opacity || 1) * 100]} onValueChange={([value]) => updateElement(selectedElement, { opacity: value / 100 })} min={0} max={100} step={1}/>
                  </div>

                  {selectedElementData.type === "image" && (<>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-muted-foreground">Width</Label>
                          <span className="text-xs font-semibold">{Math.round(selectedElementData.width || 200)}px</span>
                        </div>
                        <Slider value={[selectedElementData.width || 200]} onValueChange={([value]) => updateElement(selectedElement, { width: value })} min={50} max={500} step={10}/>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-muted-foreground">Height</Label>
                          <span className="text-xs font-semibold">{Math.round(selectedElementData.height || 200)}px</span>
                        </div>
                        <Slider value={[selectedElementData.height || 200]} onValueChange={([value]) => updateElement(selectedElement, { height: value })} min={50} max={500} step={10}/>
                      </div>
                    </>)}
                </div>
              </Card>)}

            <Card className="p-4 bg-background shadow-sm">
              <Label htmlFor="design-name" className="text-xs mb-2 block text-muted-foreground font-medium">
                Design Name
              </Label>
              <Input id="design-name" placeholder="Enter design name..." value={designName} onChange={(e) => setDesignName(e.target.value)} className="h-9 bg-background"/>
            </Card>

            </div>
            <div className="space-y-3 pt-4 px-4 pb-4 border-t border-border bg-gradient-to-b from-background/95 to-background backdrop-blur-sm shadow-lg sticky bottom-0 z-20 flex-shrink-0">
              <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-11 font-semibold shadow-md hover:shadow-lg transition-all border-2 hover:border-primary/50">
                    <FolderOpen className="mr-2 h-4 w-4"/>
                    Load Design
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Load Saved Design</DialogTitle>
                    <DialogDescription>Choose a design to load and continue editing</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {savedDesigns.map((design) => (<button key={design._id} onClick={() => loadDesign(design)} className="relative aspect-square rounded-lg border-2 border-border hover:border-primary overflow-hidden transition-all hover:scale-105">
                        {design.thumbnail ? (<Image src={design.thumbnail} alt={design.name} fill className="object-cover"/>) : (<div className="w-full h-full bg-muted flex items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground"/>
                          </div>)}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-sm font-medium text-gray-900">{design.name}</p>
                          <p className="text-xs text-gray-300">{new Date(design.createdAt).toLocaleDateString()}</p>
                        </div>
                      </button>))}
                    {savedDesigns.length === 0 && (<div className="col-span-2 text-center py-8 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                        <p>No saved designs yet</p>
                      </div>)}
                  </div>
                </DialogContent>
              </Dialog>

              <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-gray-900 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]" onClick={handleAddToCart}>
                <ShoppingBag className="mr-2 h-5 w-5"/>
                Add to Cart x{productQuantity} - ${activeProduct?.price ?? 0}
              </Button>
              <Button variant="outline" className="w-full h-11 bg-background hover:bg-primary hover:text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all border-2" onClick={saveDesign} disabled={isSaving}>
                {isSaving ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Saving...
                  </>) : (<>
                    <Save className="mr-2 h-4 w-4"/>
                    Save Design (Ctrl+S)
                  </>)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
