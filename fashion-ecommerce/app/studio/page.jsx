"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
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
const defaultProductTemplates = {};
const clipartLibrary = [];
const backgroundPatterns = [];
const fontFamilies = [
    { value: "Arial", label: "Arial", category: "Sans-serif" },
    { value: "Helvetica", label: "Helvetica", category: "Sans-serif" },
    { value: "Times New Roman", label: "Times New Roman", category: "Serif" },
    { value: "Georgia", label: "Georgia", category: "Serif" },
    { value: "Verdana", label: "Verdana", category: "Sans-serif" },
    { value: "Courier New", label: "Courier New", category: "Monospace" },
    { value: "Impact", label: "Impact", category: "Display" },
    { value: "Comic Sans MS", label: "Comic Sans MS", category: "Casual" },
    { value: "Trebuchet MS", label: "Trebuchet MS", category: "Sans-serif" },
    { value: "Palatino", label: "Palatino", category: "Serif" },
    { value: "Garamond", label: "Garamond", category: "Serif" },
    { value: "Baskerville", label: "Baskerville", category: "Serif" },
];
const designTemplates = [];
const SAFE_AREA_INSET = 60;
const MIN_SAFE_AREA_SIZE = 40;
const SAFE_AREA_OFFSET_X = 30;
const SAFE_AREA_OFFSET_Y = 80;
const getOptimizedCloudinaryUrl = (url, width = 1600) => {
    if (!url.includes("res.cloudinary.com") || !url.includes("/upload/"))
        return url;
    if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto") || url.includes("/upload/w_"))
        return url;
    const [prefix, rest] = url.split("/upload/");
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
    const [currentSide, setCurrentSide] = useState("front");
    const [designElements, setDesignElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiVariations, setAiVariations] = useState([]);
    const [showAIResults, setShowAIResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const activeTab = "all";
    const { toast } = useToast();
    const [zoom, setZoom] = useState(100);
    const [showGrid, setShowGrid] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [canvasBackground, setCanvasBackground] = useState(null);
    const { addItem } = useCart();
    const [isSaving, setIsSaving] = useState(false);
    const [designName, setDesignName] = useState("");
    const [savedDesigns, setSavedDesigns] = useState([]);
    const [studioProducts, setStudioProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
    const [gridSize, setGridSize] = useState(10);
    const [dragState, setDragState] = useState(null);
    const currentSideElements = designElements.filter((el) => (el.side || "front") === currentSide && (el.visible !== false));
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
    const productColorHex = resolveColorHex(selectedColorKey || productColor);
    const colorMockupUrl = selectedColorKey ? activeStudioProduct?.colorMockups?.[selectedColorKey] : undefined;
    const rawMockupUrl = colorMockupUrl || activeStudioProduct?.baseMockupUrl || activeProduct?.image || "/placeholder-logo.png";
    const mockupUrl = getOptimizedCloudinaryUrl(rawMockupUrl);
    useEffect(() => {
        if (studioProducts.length === 0)
            return;
        const allowed = new Set(studioProducts.map((p) => p.type));
        if (!allowed.has(selectedProduct)) {
            setSelectedProduct(studioProducts[0].type);
        }
    }, [studioProducts, selectedProduct]);
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
        const desiredSide = selectedPosition === "back" ? "back" : "front";
        if (currentSide !== desiredSide) {
            setCurrentSide(desiredSide);
        }
    }, [currentSide, selectedPosition]);
    useEffect(() => {
        if (currentSide === "back" && selectedPosition !== "back") {
            setSelectedPosition("back");
            return;
        }
        if (currentSide !== "back" && selectedPosition === "back") {
            setSelectedPosition("front");
        }
    }, [currentSide, selectedPosition]);
    const getSafeArea = useCallback(() => {
        const sa = (currentStudioProduct || studioProducts[0])?.safeArea;
        const base = sa && sa.width && sa.height ? sa : { x: 60, y: 80, width: 280, height: 300 };
        const width = Math.max(MIN_SAFE_AREA_SIZE, base.height - SAFE_AREA_INSET * 2);
        const height = Math.max(MIN_SAFE_AREA_SIZE, base.width - SAFE_AREA_INSET * 2);
        const offsetX = Math.max(0, (base.width - width) / 2);
        const offsetY = Math.max(0, (base.height - height) / 2);
        return {
            x: base.x + offsetX + SAFE_AREA_OFFSET_X,
            y: base.y + offsetY + SAFE_AREA_OFFSET_Y,
            width,
            height,
        };
    }, [currentStudioProduct, studioProducts]);
    const clampElementToSafeArea = useCallback((element) => {
        const safe = getSafeArea();
        const baseWidth = element.width || (element.type === "text" ? 180 : 200);
        const baseHeight = element.height || (element.type === "text" ? 60 : 200);
        const width = Math.min(Math.max(baseWidth, 20), safe.width);
        const height = Math.min(Math.max(baseHeight, 20), safe.height);
        const x = Math.min(Math.max(element.x, safe.x), safe.x + safe.width - width);
        const y = Math.min(Math.max(element.y, safe.y), safe.y + safe.height - height);
        return { ...element, x, y, width, height };
    }, [getSafeArea]);
    const snapPosition = useCallback((value, axis, size) => {
        const safe = getSafeArea();
        const threshold = 8;
        const grid = snapToGrid ? gridSize : 0;
        let snapped = value;
        if (grid > 0) {
            snapped = Math.round(snapped / grid) * grid;
        }
        const start = axis === "x" ? safe.x : safe.y;
        const end = (axis === "x" ? safe.x + safe.width : safe.y + safe.height) - size;
        if (Math.abs(snapped - start) < threshold)
            snapped = start;
        if (Math.abs(snapped - end) < threshold)
            snapped = end;
        return snapped;
    }, [getSafeArea, gridSize, snapToGrid]);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "z":
                        e.preventDefault();
                        if (e.shiftKey) {
                            if (historyIndex < history.length - 1) {
                                setHistoryIndex(historyIndex + 1);
                                setDesignElements([...history[historyIndex + 1]]);
                            }
                        }
                        else {
                            if (historyIndex > 0) {
                                setHistoryIndex(historyIndex - 1);
                                setDesignElements([...history[historyIndex - 1]]);
                            }
                        }
                        break;
                    case "s":
                        e.preventDefault();
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
                        const name = designName.trim() || `My Design ${new Date().toLocaleDateString()}`;
                        setIsSaving(true);
                        designsApi.createDesign({
                            name,
                            baseProduct: {
                                type: selectedProduct,
                                color: selectedColorKey || productColor,
                                size: productSize,
                            },
                            elements: designElements.map(el => ({
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
                            thumbnail: undefined,
                            price: activeProduct?.price || activeStudioProduct?.price || 0,
                            status: "draft",
                        }).then(() => {
                            toast({
                                title: "Design saved successfully!",
                                description: "Your design has been saved to My Designs",
                            });
                            setTimeout(() => {
                                router.push("/my-designs");
                            }, 1500);
                        }).catch((error) => {
                            toast({
                                title: "Save Failed",
                                description: error.message || "Failed to save design. Please try again.",
                                variant: "destructive",
                            });
                        }).finally(() => {
                            setIsSaving(false);
                        });
                        break;
                    case "d":
                        e.preventDefault();
                        if (selectedElement) {
                            const element = designElements.find((el) => el.id === selectedElement);
                            if (element) {
                                const newElement = {
                                    ...element,
                                    id: Date.now().toString(),
                                    x: element.x + 20,
                                    y: element.y + 20,
                                };
                                const newElements = [...designElements, newElement];
                                const newHistory = history.slice(0, historyIndex + 1);
                                newHistory.push([...newElements]);
                                setHistory(newHistory);
                                setHistoryIndex(newHistory.length - 1);
                                setDesignElements(newElements);
                                setSelectedElement(newElement.id);
                            }
                        }
                        break;
                }
            }
            else if (e.key === "Delete" && selectedElement) {
                const newElements = designElements.filter((el) => el.id !== selectedElement);
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push([...newElements]);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
                setDesignElements(newElements);
                setSelectedElement(null);
            }
            else if (e.key === "Escape") {
                setSelectedElement(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedElement, historyIndex, history.length, designElements, user, designName, selectedProduct, productColor, productSize]);
    const generateAIVariations = async () => {
        if (designElements.length === 0) {
            toast({
                title: "┘ä╪º ┘è┘ê╪¼╪» ╪¬╪╡┘à┘è┘à ┘ä╪¬╪¡╪│┘è┘å┘ç",
                description: "╪º┘ä╪▒╪¼╪º╪í ╪Ñ╪╢╪º┘ü╪⌐ ╪╣┘å╪º╪╡╪▒ ┘ä┘ä╪¬╪╡┘à┘è┘à ╪ú┘ê┘ä╪º┘ï",
                variant: "destructive",
            });
            return;
        }
        setIsGeneratingAI(true);
        setShowAIResults(true);
        const hasText = designElements.some((el) => el.type === "text");
        const hasImage = designElements.some((el) => el.type === "image");
        const textContent = designElements.filter((el) => el.type === "text").map((el) => el.content).join(" ");
        toast({
            title: "≡ƒÄ¿ ╪¼╪º╪▒┘è ╪¬╪¡╪│┘è┘å ╪º┘ä╪¬╪╡┘à┘è┘à...",
            description: "╪º┘ä╪░┘â╪º╪í ╪º┘ä╪º╪╡╪╖┘å╪º╪╣┘è ┘è┘é┘ê┘à ╪¿╪Ñ┘å╪┤╪º╪í ╪¬┘å╪│┘è┘é╪º╪¬ ╪ú┘ü╪╢┘ä ┘ä╪¬╪╡┘à┘è┘à┘â",
        });
        setTimeout(() => {
            const variations = [];
            if (hasText && hasImage) {
                variations.push({
                    id: "1",
                    imageUrl: "/enhanced-modern-graphic-design-on-white-tshirt.jpg",
                    prompt: "╪¬┘å╪│┘è┘é ╪╣╪╡╪▒┘è ┘à╪¬┘ê╪º╪▓┘å - ┘å┘ü╪│ ╪º┘ä┘à╪¡╪¬┘ê┘ë ╪¿╪¬╪╡┘à┘è┘à ╪ú┘å┘è┘é",
                    selected: false,
                }, {
                    id: "2",
                    imageUrl: "/artistic-colorful-design-on-white-tshirt.jpg",
                    prompt: "╪¬┘å╪│┘è┘é ┘ü┘å┘è ┘à┘ä┘ê┘å - ┘å┘ü╪│ ╪º┘ä╪╣┘å╪º╪╡╪▒ ╪¿╪ú┘ä┘ê╪º┘å ┘à╪¬┘å╪º╪│┘é╪⌐",
                    selected: false,
                }, {
                    id: "3",
                    imageUrl: "/bold-typography-design-on-white-tshirt.jpg",
                    prompt: "╪¬┘å╪│┘è┘é ╪¼╪▒┘è╪í - ┘å┘ü╪│ ╪º┘ä┘å╪╡ ╪¿╪«╪╖ ╪ú┘é┘ê┘ë ┘ê╪ú┘ê╪╢╪¡",
                    selected: false,
                }, {
                    id: "4",
                    imageUrl: "/abstract-geometric-design-on-white-tshirt.jpg",
                    prompt: "╪¬┘å╪│┘è┘é ┘ç┘å╪»╪│┘è - ┘å┘ü╪│ ╪º┘ä╪¬╪╡┘à┘è┘à ╪¿╪¬╪▒╪¬┘è╪¿ ╪º╪¡╪¬╪▒╪º┘ü┘è",
                    selected: false,
                });
            }
            else if (hasText) {
                variations.push({
                    id: "1",
                    imageUrl: "/bold-typography-design-on-white-tshirt.jpg",
                    prompt: `"${textContent}" - ╪«╪╖ ╪╣╪▒┘è╪╢ ╪º╪¡╪¬╪▒╪º┘ü┘è`,
                    selected: false,
                }, {
                    id: "2",
                    imageUrl: "/enhanced-modern-graphic-design-on-white-tshirt.jpg",
                    prompt: `"${textContent}" - ╪¬┘å╪│┘è┘é ╪╣╪╡╪▒┘è ╪ú┘å┘è┘é`,
                    selected: false,
                }, {
                    id: "3",
                    imageUrl: "/artistic-colorful-design-on-white-tshirt.jpg",
                    prompt: `"${textContent}" - ╪ú┘ä┘ê╪º┘å ┘à╪¬╪»╪▒╪¼╪⌐ ╪¼┘à┘è┘ä╪⌐`,
                    selected: false,
                });
            }
            else if (hasImage) {
                variations.push({
                    id: "1",
                    imageUrl: "/enhanced-modern-graphic-design-on-white-tshirt.jpg",
                    prompt: "┘å┘ü╪│ ╪º┘ä╪╡┘ê╪▒╪⌐ - ┘à┘ê╪╢╪╣╪⌐ ╪º╪¡╪¬╪▒╪º┘ü┘è╪⌐",
                    selected: false,
                }, {
                    id: "2",
                    imageUrl: "/artistic-colorful-design-on-white-tshirt.jpg",
                    prompt: "┘å┘ü╪│ ╪º┘ä╪╡┘ê╪▒╪⌐ - ╪¬╪ú╪½┘è╪▒╪º╪¬ ┘ü┘å┘è╪⌐",
                    selected: false,
                });
            }
            setAiVariations(variations);
            setIsGeneratingAI(false);
            toast({
                title: "Γ£¿ ╪¬┘à ╪Ñ┘å╪┤╪º╪í ╪º┘ä╪¬╪╡╪º┘à┘è┘à ╪º┘ä┘à╪¡╪│┘æ┘å╪⌐!",
                description: `${variations.length} ╪¬┘å╪│┘è┘é ╪º╪¡╪¬╪▒╪º┘ü┘è ┘ä┘å┘ü╪│ ╪¬╪╡┘à┘è┘à┘â - ╪º╪«╪¬╪▒ ╪º┘ä┘à┘ü╪╢┘ä ┘ä╪»┘è┘â`,
            });
        }, 3000);
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
            if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
                toast({
                    title: "Sign in required",
                    description: "Please sign in or create an account to add designs to your cart",
                    variant: "default",
                });
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to add design to cart. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };
    const addTextElement = (content) => {
        const safe = getSafeArea();
        const defaultWidth = 180;
        const defaultHeight = 60;
        const newElement = {
            id: Date.now().toString(),
            type: "text",
            content: content?.trim() ? content : "Your Text Here",
            x: safe.x + safe.width / 2 - defaultWidth / 2,
            y: safe.y + safe.height / 2 - defaultHeight / 2,
            fontSize: textFontSize,
            color: textColor,
            fontFamily: textFontFamily,
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            textAlign,
            rotation: 0,
            opacity: 1,
            layer: designElements.length,
            side: currentSide,
            visible: true,
            locked: false,
            width: defaultWidth,
            height: defaultHeight,
        };
        const newElements = [...designElements, clampElementToSafeArea(newElement)];
        setDesignElements(newElements);
        saveToHistory(newElements);
        setSelectedElement(newElement.id);
        setActiveTextId(newElement.id);
        return newElement.id;
    };
    const addImageElement = (imageUrl) => {
        const safe = getSafeArea();
        const defaultWidth = Math.min(200, safe.width);
        const defaultHeight = Math.min(200, safe.height);
        const newElement = {
            id: Date.now().toString(),
            type: "image",
            content: imageUrl,
            x: safe.x + safe.width / 2 - defaultWidth / 2,
            y: safe.y + safe.height / 2 - defaultHeight / 2,
            width: defaultWidth,
            height: defaultHeight,
            rotation: 0,
            opacity: 1,
            layer: designElements.length,
            side: currentSide,
            visible: true,
            locked: false,
        };
        const newElements = [...designElements, clampElementToSafeArea(newElement)];
        setDesignElements(newElements);
        saveToHistory(newElements);
        setSelectedElement(newElement.id);
        setActiveImageId(newElement.id);
        return newElement.id;
    };
    const handleImageUpload = (file) => {
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload an image smaller than 10MB",
                variant: "destructive",
            });
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target?.result;
            addImageElement(imageUrl);
        };
        reader.readAsDataURL(file);
    };
    function updateElement(id, updates) {
        const newElements = designElements.map((el) => {
            if (el.id !== id)
                return el;
            const merged = { ...el, ...updates };
            const safeClamped = clampElementToSafeArea(merged);
            return {
                ...safeClamped,
                x: snapPosition(safeClamped.x, "x", safeClamped.width || 0),
                y: snapPosition(safeClamped.y, "y", safeClamped.height || 0),
            };
        });
        setDesignElements(newElements);
        saveToHistory(newElements);
    }
    const getActiveTextElement = () => {
        const selected = designElements.find((el) => el.id === selectedElement && el.type === "text");
        if (selected)
            return selected;
        if (!activeTextId)
            return null;
        return designElements.find((el) => el.id === activeTextId && el.type === "text") || null;
    };
    const getActiveImageElement = () => {
        const selected = designElements.find((el) => el.id === selectedElement && el.type === "image");
        if (selected)
            return selected;
        if (!activeImageId)
            return null;
        return designElements.find((el) => el.id === activeImageId && el.type === "image") || null;
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
        updateElement(target.id, { content: value });
    };
    const handleFontSizeChange = (size) => {
        setTextFontSize(size);
        const target = getActiveTextElement();
        if (!target)
            return;
        updateElement(target.id, { fontSize: size });
    };
    const handleTextAlignChange = (align) => {
        setTextAlign(align);
        const target = getActiveTextElement();
        if (!target)
            return;
        updateElement(target.id, { textAlign: align });
    };
    const handleTextColorChange = (color) => {
        setTextColor(color);
        const target = getActiveTextElement();
        if (!target)
            return;
        updateElement(target.id, { color });
    };
    const handleFontFamilyChange = (font) => {
        setTextFontFamily(font);
        const target = getActiveTextElement();
        if (!target)
            return;
        updateElement(target.id, { fontFamily: font });
    };
    const handleImageSizeChange = (size) => {
        setImageSize(size);
        const target = getActiveImageElement();
        if (!target)
            return;
        updateElement(target.id, { width: size, height: size });
    };
    useEffect(() => {
        const handleMove = (e) => {
            if (!dragState)
                return;
            e.preventDefault();
            const deltaX = e.clientX - dragState.startX;
            const deltaY = e.clientY - dragState.startY;
            const target = designElements.find((el) => el.id === dragState.id);
            if (!target)
                return;
            if (dragState.mode === "move") {
                updateElement(dragState.id, {
                    x: dragState.initX + deltaX,
                    y: dragState.initY + deltaY,
                });
            }
            else if (dragState.mode === "resize") {
                const newW = Math.max(20, dragState.initW + deltaX);
                const newH = Math.max(20, dragState.initH + deltaY);
                updateElement(dragState.id, {
                    width: newW,
                    height: newH,
                });
            }
            else if (dragState.mode === "rotate") {
                const rotationDelta = deltaX * 0.3;
                updateElement(dragState.id, {
                    rotation: (dragState.initRotation || 0) + rotationDelta,
                });
            }
        };
        const handleUp = () => setDragState(null);
        if (dragState) {
            window.addEventListener("pointermove", handleMove);
            window.addEventListener("pointerup", handleUp, { once: true });
        }
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
        };
    }, [dragState, designElements, updateElement]);
    const deleteElement = (id) => {
        const newElements = designElements.filter((el) => el.id !== id);
        setDesignElements(newElements);
        saveToHistory(newElements);
        setSelectedElement(null);
    };
    const saveToHistory = (elements) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...elements]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setDesignElements([...history[historyIndex - 1]]);
        }
    };
    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setDesignElements([...history[historyIndex + 1]]);
        }
    };
    const moveLayerUp = (id) => {
        const index = designElements.findIndex((el) => el.id === id);
        if (index < designElements.length - 1) {
            const newElements = [...designElements];
            [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
            setDesignElements(newElements);
            saveToHistory(newElements);
        }
    };
    const moveLayerDown = (id) => {
        const index = designElements.findIndex((el) => el.id === id);
        if (index > 0) {
            const newElements = [...designElements];
            [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
            setDesignElements(newElements);
            saveToHistory(newElements);
        }
    };
    const alignElements = (alignment) => {
        if (currentSideElements.length < 2) {
            toast({
                title: "Not enough elements",
                description: "You need at least 2 elements on this side to align them",
                variant: "destructive",
            });
            return;
        }
        const elementsToAlign = [...currentSideElements];
        const newElements = [...designElements];
        if (alignment === "left") {
            const minX = Math.min(...elementsToAlign.map((el) => el.x));
            elementsToAlign.forEach((el) => {
                const index = newElements.findIndex((e) => e.id === el.id);
                if (index !== -1)
                    newElements[index].x = minX;
            });
        }
        else if (alignment === "right") {
            const maxX = Math.max(...elementsToAlign.map((el) => {
                const width = el.type === "text" ? 100 : (el.width || 200);
                return el.x + width;
            }));
            elementsToAlign.forEach((el) => {
                const index = newElements.findIndex((e) => e.id === el.id);
                if (index !== -1) {
                    const width = el.type === "text" ? 100 : (el.width || 200);
                    newElements[index].x = maxX - width;
                }
            });
        }
        else if (alignment === "center") {
            const avgX = elementsToAlign.reduce((sum, el) => {
                const width = el.type === "text" ? 100 : (el.width || 200);
                return sum + el.x + width / 2;
            }, 0) / elementsToAlign.length;
            elementsToAlign.forEach((el) => {
                const index = newElements.findIndex((e) => e.id === el.id);
                if (index !== -1) {
                    const width = el.type === "text" ? 100 : (el.width || 200);
                    newElements[index].x = avgX - width / 2;
                }
            });
        }
        else if (alignment === "top") {
            const minY = Math.min(...elementsToAlign.map((el) => el.y));
            elementsToAlign.forEach((el) => {
                const index = newElements.findIndex((e) => e.id === el.id);
                if (index !== -1)
                    newElements[index].y = minY;
            });
        }
        else if (alignment === "bottom") {
            const maxY = Math.max(...elementsToAlign.map((el) => {
                const height = el.type === "text" ? 50 : (el.height || 200);
                return el.y + height;
            }));
            elementsToAlign.forEach((el) => {
                const index = newElements.findIndex((e) => e.id === el.id);
                if (index !== -1) {
                    const height = el.type === "text" ? 50 : (el.height || 200);
                    newElements[index].y = maxY - height;
                }
            });
        }
        else if (alignment === "middle") {
            const avgY = elementsToAlign.reduce((sum, el) => {
                const height = el.type === "text" ? 50 : (el.height || 200);
                return sum + el.y + height / 2;
            }, 0) / elementsToAlign.length;
            elementsToAlign.forEach((el) => {
                const index = newElements.findIndex((e) => e.id === el.id);
                if (index !== -1) {
                    const height = el.type === "text" ? 50 : (el.height || 200);
                    newElements[index].y = avgY - height / 2;
                }
            });
        }
        setDesignElements(newElements);
        saveToHistory(newElements);
        toast({
            title: "Elements aligned",
            description: `All elements aligned to ${alignment}`,
        });
    };
    const duplicateElement = (id) => {
        const element = designElements.find((el) => el.id === id);
        if (element) {
            const newElement = {
                ...element,
                id: Date.now().toString(),
                x: element.x + 20,
                y: element.y + 20,
            };
            const newElements = [...designElements, newElement];
            setDesignElements(newElements);
            saveToHistory(newElements);
            setSelectedElement(newElement.id);
        }
    };
    const loadTemplate = (template) => {
        const newElements = template.elements.map((el, index) => ({
            id: `${Date.now()}-${index}`,
            type: el.type,
            content: el.content,
            x: el.x,
            y: el.y,
            fontSize: el.fontSize,
            color: el.color,
            fontFamily: el.fontFamily,
            fontWeight: el.type === "text" ? (el.fontWeight || "normal") : undefined,
            fontStyle: el.type === "text" ? (el.fontStyle || "normal") : undefined,
            textDecoration: el.type === "text" ? (el.textDecoration || "none") : undefined,
            textAlign: el.type === "text" ? (el.textAlign || "left") : undefined,
            rotation: 0,
            opacity: 1,
            layer: index,
            side: currentSide,
            visible: true,
            width: el.width || 200,
            height: el.height || 200,
        }));
        setDesignElements([...designElements, ...newElements]);
        saveToHistory([...designElements, ...newElements]);
        setShowTemplatesDialog(false);
        toast({
            title: "Template loaded",
            description: `${template.name} template has been added to your design`,
        });
    };
    const loadDesign = async (design) => {
        try {
            const fullDesign = await designsApi.getDesign(design._id);
            const loadedElements = fullDesign.elements.map((el, index) => ({
                id: `${Date.now()}-${index}`,
                type: el.type,
                content: el.content,
                x: el.x,
                y: el.y,
                fontSize: el.fontSize,
                color: el.color,
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                rotation: el.rotation || 0,
                opacity: 1,
                layer: index,
                side: currentSide,
                visible: true,
                locked: false,
                width: el.width,
                height: el.height,
            }));
            setDesignElements(loadedElements);
            setDesignName(fullDesign.name);
            setSelectedProduct(fullDesign.baseProduct.type);
            setProductColor(fullDesign.baseProduct.color);
            setProductSize(fullDesign.baseProduct.size);
            saveToHistory(loadedElements);
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
                image: rawMockupUrl,
                isCustom: true,
            });
            toast({
                title: "Design added to cart",
                description: `Custom ${product.name} (Size: ${productSize}) - $${product.price}`,
            });
        }
        catch (error) {
            if (error.name === "AuthenticationRequired" || error.message === "AUTHENTICATION_REQUIRED") {
                toast({
                    title: "Sign in required",
                    description: "Please sign in or create an account to add designs to your cart",
                    variant: "default",
                });
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to add design to cart. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };
    const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
    const generateNormalizedPreview = async () => {
        const baseUrl = mockupUrl;
        const baseImg = await loadImage(baseUrl);
        const canvas = document.createElement("canvas");
        const baseWidth = baseImg.naturalWidth || 1000;
        const baseHeight = baseImg.naturalHeight || 1200;
        canvas.width = baseWidth;
        canvas.height = baseHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Canvas context unavailable");
        ctx.drawImage(baseImg, 0, 0, baseWidth, baseHeight);
        const editBaseWidth = 400;
        const scaleX = baseWidth / editBaseWidth;
        const scaleY = baseHeight / editBaseWidth;
        const safe = getSafeArea();
        const safeScaled = {
            x: safe.x * scaleX,
            y: safe.y * scaleY,
            width: safe.width * scaleX,
            height: safe.height * scaleY,
        };
        const elementsToRender = designElements
            .filter((el) => (el.side || "front") === currentSide && el.visible !== false)
            .map((el) => clampElementToSafeArea(el));
        for (const el of elementsToRender) {
            const width = (el.width || (el.type === "text" ? 180 : 200)) * scaleX;
            const height = (el.height || (el.type === "text" ? 60 : 200)) * scaleY;
            const x = el.x * scaleX;
            const y = el.y * scaleY;
            ctx.save();
            ctx.beginPath();
            ctx.rect(safeScaled.x, safeScaled.y, safeScaled.width, safeScaled.height);
            ctx.clip();
            ctx.globalAlpha = el.opacity ?? 0.92;
            ctx.translate(x + width / 2, y + height / 2);
            if (el.rotation)
                ctx.rotate((el.rotation * Math.PI) / 180);
            if (el.type === "image") {
                try {
                    const img = await loadImage(el.content);
                    ctx.drawImage(img, -width / 2, -height / 2, width, height);
                }
                catch {
                }
            }
            else if (el.type === "text") {
                ctx.font = `${el.fontWeight || "600"} ${(el.fontSize || 32) * scaleX}px ${el.fontFamily || "Arial"}`;
                ctx.fillStyle = el.color || "#111111";
                ctx.textAlign = el.textAlign || "center";
                ctx.textBaseline = "middle";
                ctx.shadowColor = "rgba(0,0,0,0.12)";
                ctx.shadowBlur = 6;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                ctx.fillText(el.content, 0, 0);
            }
            ctx.restore();
        }
        return canvas.toDataURL("image/png");
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
            const normalizedPreview = await generateNormalizedPreview();
            const safe = getSafeArea();
            const designData = {
                name,
                baseProduct: {
                    type: selectedProduct,
                    color: selectedColorKey || productColor,
                    size: productSize,
                },
                baseProductId: activeStudioProduct._id,
                elements: designElements.map((el) => clampElementToSafeArea(el)),
                thumbnail: normalizedPreview,
                designImageURL: normalizedPreview,
                designMetadata: {
                    safeArea: safe,
                    elements: designElements.map((el) => clampElementToSafeArea(el)),
                    productType: selectedProduct,
                    productColor: selectedColorKey || productColor,
                    productSize,
                    side: currentSide,
                    mockup: rawMockupUrl,
                },
                price: activeProduct?.price || activeStudioProduct?.price || 0,
                status: "draft",
            };
            const savedDesign = await designsApi.createDesign(designData);
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
        if (currentSideElements.length === 0) {
            toast({
                title: "Nothing to export",
                description: "Please add some elements to your design first",
                variant: "destructive",
            });
            return;
        }
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 1000;
            canvas.height = 1200;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                toast({
                    title: "Export failed",
                    description: "Could not create canvas",
                    variant: "destructive",
                });
                return;
            }
            ctx.fillStyle = productColorHex;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const imagePromises = [];
            for (const element of currentSideElements) {
                if (element.visible === false)
                    continue;
                ctx.save();
                ctx.globalAlpha = element.opacity || 1;
                ctx.translate(element.x, element.y);
                ctx.rotate((element.rotation || 0) * Math.PI / 180);
                if (element.type === "text") {
                    ctx.font = `${element.fontWeight || "normal"} ${element.fontSize || 32}px ${element.fontFamily || "Arial"}`;
                    ctx.fillStyle = element.color || "#000000";
                    ctx.textAlign = element.textAlign || "left";
                    ctx.fillText(element.content || "", 0, 0);
                }
                else if (element.type === "image") {
                    const img = new window.Image();
                    img.crossOrigin = "anonymous";
                    const imagePromise = new Promise((resolve) => {
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0, element.width || 200, element.height || 200);
                            resolve();
                        };
                        img.onerror = () => resolve();
                        img.src = element.content;
                    });
                    imagePromises.push(imagePromise);
                }
                ctx.restore();
            }
            await Promise.all(imagePromises);
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${designName || "design"}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast({
                        title: "Design exported",
                        description: "Your design has been downloaded as PNG",
                    });
                }
                else {
                    toast({
                        title: "Export failed",
                        description: "Could not create image file",
                        variant: "destructive",
                    });
                }
            }, "image/png");
        }
        catch (error) {
            toast({
                title: "Export failed",
                description: error.message || "Could not export design",
                variant: "destructive",
            });
        }
    }, [currentSideElements, productColorHex, designName, toast]);
    const selectedElementData = designElements.find((el) => el.id === selectedElement);
    const filteredProducts = Object.entries(resolvedProductTemplates).filter(([key, product]) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" || product.category.toLowerCase() === activeTab.toLowerCase();
        return matchesSearch && matchesTab;
    });
    useEffect(() => {
        if (!selectedElementData)
            return;
        if (selectedElementData.type === "text") {
            setActiveTextId(selectedElementData.id);
            setTextValue(selectedElementData.content || "");
            setTextFontSize(selectedElementData.fontSize || 32);
            setTextAlign(selectedElementData.textAlign || "center");
            setTextColor(selectedElementData.color || "#000000");
            setTextFontFamily(selectedElementData.fontFamily || "Tajawal");
        }
        if (selectedElementData.type === "image") {
            setActiveImageId(selectedElementData.id);
            if (selectedElementData.width) {
                setImageSize(selectedElementData.width);
            }
        }
    }, [selectedElementData]);
    const snapValue = (value) => {
        if (!snapToGrid)
            return value;
        return Math.round(value / gridSize) * gridSize;
    };
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
                <h3 className="text-sm font-semibold text-foreground">المنتجات</h3>
                <span className="text-xs text-muted-foreground">{filteredProducts.length}</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="ابحث عن المنتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary/40"/>
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

            <ImageUploader onImageUpload={handleImageUpload} uploadedImage={getActiveImageElement()?.content || null} imageSize={imageSize} onImageSizeChange={handleImageSizeChange}/>

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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Shift+Z)">
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
              
              
              {selectedElement && currentSideElements.length > 1 && (<>
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
              <div className="relative mx-auto aspect-[3/4] max-h-[650px] shadow-2xl rounded-lg overflow-hidden bg-background" style={{
            backgroundImage: showGrid
                ? `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`
                : "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
            backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            backgroundColor: "#f9fafb",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center",
            transition: "transform 0.2s ease-in-out",
        }}>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="relative w-full h-full rounded-lg overflow-hidden" style={{
            backgroundColor: productColorHex,
            backgroundImage: canvasBackground ? `url(${canvasBackground})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}>
                    <img src={mockupUrl} alt={`${activeProduct?.name || "Studio Product"} ${currentSide}`} className="w-full h-full object-contain" style={{
            filter: productColorHex.toLowerCase() !== "#ffffff" ? "brightness(0.95)" : undefined,
        }} onError={(e) => {
            ;
            e.target.src = "/placeholder-logo.png";
        }}/>

                    <div className="absolute inset-0">
                      
                      <div className="absolute border-2 border-dashed border-primary/60 bg-primary/5 pointer-events-none" style={{
            left: getSafeArea().x,
            top: getSafeArea().y,
            width: getSafeArea().width,
            height: getSafeArea().height,
        }}/>

                      {currentSideElements.map((element) => {
            const width = element.width || (element.type === "text" ? 180 : 200);
            const height = element.height || (element.type === "text" ? 60 : 200);
            return (<div key={element.id} className={`absolute select-none transition-all group ${selectedElement === element.id
                    ? "ring-2 ring-primary ring-offset-2 shadow-lg z-20"
                    : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-1"} ${element.locked ? "cursor-not-allowed opacity-50" : "cursor-move"}`} style={{
                    left: `${snapValue(element.x)}px`,
                    top: `${snapValue(element.y)}px`,
                    width,
                    height,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    transformOrigin: "center",
                    opacity: element.opacity || 1,
                }} onPointerDown={(e) => {
                    if (element.locked)
                        return;
                    e.stopPropagation();
                    setSelectedElement(element.id);
                    setDragState({
                        id: element.id,
                        mode: "move",
                        startX: e.clientX,
                        startY: e.clientY,
                        initX: element.x,
                        initY: element.y,
                        initW: width,
                        initH: height,
                        initRotation: element.rotation || 0,
                    });
                }}>
                            <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{
                    fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
                    color: element.color,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textDecoration: element.textDecoration,
                    textAlign: element.textAlign,
                    textShadow: element.textShadow,
                    WebkitTextStroke: element.textOutline,
                }}>
                              {element.type === "text" ? (<span className="whitespace-nowrap">{element.content}</span>) : (<img src={element.content || "/placeholder-logo.png"} alt="Design element" className="max-w-full max-h-full object-contain pointer-events-none" draggable={false} style={{
                        width,
                        height,
                    }}/>)}
                            </div>

                            
                            {!element.locked && (<div className="absolute -bottom-2 -right-2 h-4 w-4 bg-white border border-primary rounded-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize" onPointerDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                            id: element.id,
                            mode: "resize",
                            startX: e.clientX,
                            startY: e.clientY,
                            initX: element.x,
                            initY: element.y,
                            initW: width,
                            initH: height,
                            initRotation: element.rotation || 0,
                        });
                    }}/>)}

                            
                            {!element.locked && (<div className="absolute -top-6 left-1/2 -translate-x-1/2 h-3 w-3 bg-primary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-alias" onPointerDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                            id: element.id,
                            mode: "rotate",
                            startX: e.clientX,
                            startY: e.clientY,
                            initX: element.x,
                            initY: element.y,
                            initW: width,
                            initH: height,
                            initRotation: element.rotation || 0,
                        });
                    }}/>)}
                          </div>);
        })}
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
                      <span className="text-xs font-semibold">{selectedElementData.rotation || 0}┬░</span>
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
                          <span className="text-xs font-semibold">{selectedElementData.width || 200}px</span>
                        </div>
                        <Slider value={[selectedElementData.width || 200]} onValueChange={([value]) => updateElement(selectedElement, { width: value })} min={50} max={500} step={10}/>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-muted-foreground">Height</Label>
                          <span className="text-xs font-semibold">{selectedElementData.height || 200}px</span>
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
