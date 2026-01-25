"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./studio.css";
import { ColorPicker } from "@/components/ColorPicker";
import { ImageUploader } from "@/components/ImageUploader";
import { PositionSelector } from "@/components/PositionSelector";
import { QuantitySelector } from "@/components/QuantitySelector";
import { textColors, textFontGroups } from "@/components/TextEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Heart,
  Minus,
  Move,
  Plus,
  ShoppingBag,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { sanitizeExternalUrl } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import { studioProductsApi } from "@/lib/api/studioProducts";
import { designsApi } from "@/lib/api/designs";
import { syncLocalDesignsToAccount } from "@/lib/localDesignSync";

const products = [
  {
    id: "hoodie",
    name: "Hoodie",
    image: "/black-hoodie-streetwear.png",
    price: 24,
    category: "Studio",
    colors: ["white", "black", "navy", "gray", "blue", "charcoal", "green", "peach", "pink"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    viewMockups: { front: "/black-hoodie-streetwear.png" },
  },
];

const LOCAL_DESIGNS_KEY = "fashionhub_simple_studio_designs";
const LOCAL_FAVORITES_KEY = "fashionhub_simple_studio_favorites";
const getLocalDesignsKey = (user) => {
  const userKey = user?._id || user?.id || user?.email || "guest";
  return `${LOCAL_DESIGNS_KEY}:${userKey}`;
};
const getLocalFavoritesKey = (user) => {
  const userKey = user?._id || user?.id || user?.email || "guest";
  return `${LOCAL_FAVORITES_KEY}:${userKey}`;
};
const mergeUniqueDesigns = (primary, incoming) => {
  const seen = new Set(primary.map((design) => String(design.id)));
  const merged = [...primary];
  incoming.forEach((design) => {
    const key = String(design.id);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(design);
    }
  });
  return merged;
};

const defaultDesignAreas = {
  front: { top: "30%", left: "30%", width: "40%", height: "22%" },
  chest: { top: "30%", left: "30%", width: "40%", height: "22%" },
  back: { top: "30%", left: "30%", width: "40%", height: "22%" },
};

const colorHexMap = {
  white: "#ffffff",
  black: "#111111",
  navy: "#1f2a44",
  gray: "#b6b6b6",
  blue: "#5aa7e0",
  charcoal: "#4a4a4a",
  green: "#4fa884",
  peach: "#f2b6a0",
  pink: "#f2a8c7",
  burgundy: "#722f37",
  olive: "#556b2f",
  cream: "#fffdd0",
  lavender: "#e6e6fa",
  beige: "#f5f5dc",
  brown: "#8b5e3c",
  red: "#ef4444",
  yellow: "#facc15",
  orange: "#f97316",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  cyan: "#06b6d4",
};

const colorImageMap = {
  white: "/hoodies/hoodie-1.avif",
  black: "/hoodies/hoodie-2.avif",
  navy: "/hoodies/hoodie-3.avif",
  gray: "/hoodies/hoodie-4.avif",
  blue: "/hoodies/hoodie-5.avif",
  charcoal: "/hoodies/hoodie-6.avif",
  green: "/hoodies/hoodie-7.avif",
  peach: "/hoodies/hoodie-8.avif",
  pink: "/hoodies/hoodie-9.avif",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const isColorValue = (value) =>
  value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl");

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ""));

const normalizeColorKey = (value) => String(value || "").trim().toLowerCase();

const uploadDataUrl = async (dataUrl, label) => {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return dataUrl;
  }
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${label}-${Date.now()}.png`, {
      type: blob.type || "image/png",
    });
    const uploadResult = await designsApi.uploadAsset(file);
    if (uploadResult?.url) {
      return uploadResult.url;
    }
  } catch {
    /* ignore upload errors */
  }
  return dataUrl;
};

const normalizeDesignBySide = async (designBySide) => {
  if (!designBySide || typeof designBySide !== "object") {
    return designBySide;
  }
  const entries = Object.entries(designBySide);
  const uploadedEntries = await Promise.all(
    entries.map(async ([sideKey, sideData]) => {
      if (!sideData || typeof sideData !== "object") {
        return [sideKey, sideData];
      }
      const uploadedImage = await uploadDataUrl(
        sideData.uploadedImage,
        `studio-${sideKey}`
      );
      return [sideKey, { ...sideData, uploadedImage }];
    })
  );
  return Object.fromEntries(uploadedEntries);
};

const resolveImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return sanitizeExternalUrl(value);
  if (value && typeof value === "object") {
    const candidate = value.url || value.secure_url || value.path;
    return typeof candidate === "string" ? sanitizeExternalUrl(candidate) : "";
  }
  return "";
};

const createEmptySideState = () => ({
  textValue: "",
  textFontSize: 16,
  textAlign: "center",
  textColor: "#000000",
  textFontFamily: "Tajawal",
  uploadedImage: null,
  imagePosition: { x: 50, y: 50 },
  imageSize: 120,
});

const resolveColorValue = (value) => {
  if (!value) return "#ffffff";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "#ffffff";
  if (isColorValue(normalized)) return value;
  return colorHexMap[normalized] || value;
};

const normalizeViewKey = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const getViewEntry = (viewMap, viewKey) => {
  if (!viewMap || !viewKey) return null;
  const normalized = normalizeViewKey(viewKey);
  if (!normalized) return null;
  if (Object.prototype.hasOwnProperty.call(viewMap, normalized)) {
    return viewMap[normalized];
  }
  const fallbackKey = Object.keys(viewMap).find(
    (key) => normalizeViewKey(key) === normalized
  );
  return fallbackKey ? viewMap[fallbackKey] : null;
};

const resolveProductColorKey = (value, product) => {
  if (!value) return "black";
  const normalized = normalizeColorKey(value);
  const productColors = Array.isArray(product?.colors)
    ? product.colors.map((color) => color.trim().toLowerCase()).filter(Boolean)
    : [];
  if (productColors.includes(normalized)) return normalized;
  const byHex = Object.entries(colorHexMap).find(
    ([, hex]) => hex.toLowerCase() === normalized
  );
  if (byHex) {
    const key = byHex[0];
    return productColors.includes(key) ? key : key;
  }
  return normalized;
};

const getColorKeys = (source) => {
  if (!source) return [];
  if (source instanceof Map) return Array.from(source.keys());
  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (typeof item === "object" && item.color) return String(item.color);
        return "";
      })
      .filter(Boolean);
  }
  if (typeof source === "object") {
    return Object.keys(source)
      .map((key) => normalizeColorKey(key))
      .filter(Boolean);
  }
  return [];
};

const getColorEntry = (source, colorKey) => {
  if (!source || !colorKey) return null;
  const normalizedColorKey = normalizeColorKey(colorKey);
  if (!normalizedColorKey) return null;
  if (source instanceof Map) {
    return source.get(colorKey) || source.get(normalizedColorKey) || null;
  }
  if (typeof source !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(source, colorKey)) {
    return source[colorKey];
  }
  if (Object.prototype.hasOwnProperty.call(source, normalizedColorKey)) {
    return source[normalizedColorKey];
  }
  const fallbackKey = Object.keys(source).find(
    (key) => normalizeColorKey(key) === normalizedColorKey
  );
  return fallbackKey ? source[fallbackKey] : null;
};

const toPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `${value * 100}%`;
};

const resolveDesignArea = (product, position) => {
  const fallback = defaultDesignAreas[position] || defaultDesignAreas.front;
  const area = product?.designAreas?.[position] || product?.designAreas?.front;
  if (!area || typeof area !== "object") return fallback;
  const next = {
    top: toPercent(area.y),
    left: toPercent(area.x),
    width: toPercent(area.width),
    height: toPercent(area.height),
  };
  if (Object.values(next).some((value) => value == null)) {
    return fallback;
  }
  return next;
};

const resolveProductImage = (product, viewKey, colorKey) => {
  if (!product) return null;
  const normalizedColor = colorKey ? colorKey.toLowerCase() : "";
  const normalizedViewKey = normalizeViewKey(viewKey) || "front";
  const colorViews = product.colorViews || {};
  const colorView = normalizedColor ? getColorEntry(colorViews, normalizedColor) : null;
  const colorMockups = product.colorMockups || {};
  const colorMockup = normalizedColor ? getColorEntry(colorMockups, normalizedColor) : null;
  const colorViewImage = resolveImageUrl(
    colorView ? getViewEntry(colorView, normalizedViewKey) : null
  );
  if (colorViewImage) return colorViewImage;
  const productViewImage = resolveImageUrl(
    getViewEntry(product.viewMockups || {}, normalizedViewKey)
  );
  if (productViewImage) return productViewImage;
  if (normalizedViewKey !== "front") {
    return (
      resolveImageUrl(colorView?.front) ||
      resolveImageUrl(product.viewMockups?.front) ||
      resolveImageUrl(colorMockup) ||
      resolveImageUrl(product.baseMockupUrl) ||
      resolveImageUrl(product.image) ||
      (colorImageMap[normalizedColor] || null)
    );
  }
  if (colorView?.front) return resolveImageUrl(colorView.front);
  if (colorMockup) return resolveImageUrl(colorMockup);
  if (product.viewMockups?.front) return resolveImageUrl(product.viewMockups.front);
  if (colorImageMap[normalizedColor]) return colorImageMap[normalizedColor];
  return resolveImageUrl(product.baseMockupUrl) || resolveImageUrl(product.image);
};

export default function DesignStudioPage() {
  const { toast } = useToast();
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewRef = useRef(null);
  const skipSideSyncRef = useRef(false);
  const isPositionSwitchRef = useRef(false);
  const localDesignsKey = useMemo(() => getLocalDesignsKey(user), [user]);
  const localFavoritesKey = useMemo(() => getLocalFavoritesKey(user), [user]);

  const [selectedProduct, setSelectedProduct] = useState(products[0].id);
  const [productColor, setProductColor] = useState("#ffffff");
  const [productSize, setProductSize] = useState("M");
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState("front");

  const [textValue, setTextValue] = useState("");
  const [textFontSize, setTextFontSize] = useState(16);
  const [textAlign, setTextAlign] = useState("center");
  const [textColor, setTextColor] = useState("#000000");
  const [textFontFamily, setTextFontFamily] = useState("Tajawal");
  const [orderNotes, setOrderNotes] = useState("");
  const [isCopyActive, setIsCopyActive] = useState(false);
  const copyFlashRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageSize, setImageSize] = useState(120);
  const [designBySide, setDesignBySide] = useState(() => ({
    front: createEmptySideState(),
    back: createEmptySideState(),
  }));

  const zoom = 100;
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize] = useState(10);
  const [designName, setDesignName] = useState("");
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [favoriteDesignIds, setFavoriteDesignIds] = useState([]);
  const [studioProducts, setStudioProducts] = useState([]);
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioReady, setStudioReady] = useState(false);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [loadingDesignId, setLoadingDesignId] = useState("");
  const [loadingLocalDesignId, setLoadingLocalDesignId] = useState("");
  const [currentDesignId, setCurrentDesignId] = useState("");
  const [savedBaseImages, setSavedBaseImages] = useState({ front: "", back: "" });

  const handlePositionChange = (nextPosition) => {
    if (!nextPosition || nextPosition === selectedPosition) return;
    isPositionSwitchRef.current = true;
    setDesignBySide((prev) => ({
      ...prev,
      [selectedPosition]: {
        ...(prev[selectedPosition] || createEmptySideState()),
        textValue,
        textFontSize,
        textAlign,
        textColor,
        textFontFamily,
        uploadedImage,
        imagePosition,
        imageSize,
      },
    }));
    setSelectedPosition(nextPosition);
  };

  const mergedStudioProducts = useMemo(() => {
    if (!studioProducts.length) return [];
    const merged = new Map();
    studioProducts.forEach((product) => {
      const nameKey = product?.name ? product.name.trim().toLowerCase() : "studio-product";
      const typeKey = product?.type ? product.type.trim().toLowerCase() : "";
      const key = `${nameKey}:${typeKey}`;
      const colors = Array.isArray(product.colors) ? product.colors : [];
      const colorViews =
        product.colorViews && typeof product.colorViews === "object" ? product.colorViews : {};
      const colorMockups =
        product.colorMockups && typeof product.colorMockups === "object" ? product.colorMockups : {};
      const viewMockups = product.viewMockups || {};
      const previewUrl = viewMockups.front || product.baseMockupUrl || product.image || "";
      const singleColorKey =
        colors.length === 1 && typeof colors[0] === "string"
          ? colors[0].trim().toLowerCase()
          : "";
      const viewPayload =
        viewMockups && typeof viewMockups === "object" ? { ...viewMockups } : {};
      if (!merged.has(key)) {
        const next = {
          ...product,
          colors: [...colors],
          colorViews: { ...colorViews },
          colorMockups: { ...colorMockups },
        };
        if (singleColorKey && Object.keys(viewPayload).length) {
          next.colorViews = {
            ...next.colorViews,
            [singleColorKey]: {
              ...(next.colorViews?.[singleColorKey] || {}),
              ...viewPayload,
            },
          };
        }
        merged.set(key, next);
        return;
      }
      const existing = merged.get(key);
      const mergedColors = new Set([
        ...((existing.colors || []).map((c) => String(c))),
        ...colors.map((c) => String(c)),
      ]);
      existing.colors = Array.from(mergedColors);
      existing.colorViews = { ...(existing.colorViews || {}), ...colorViews };
      existing.colorMockups = { ...(existing.colorMockups || {}), ...colorMockups };
      if (singleColorKey && Object.keys(viewPayload).length) {
        existing.colorViews = {
          ...(existing.colorViews || {}),
          [singleColorKey]: {
            ...(existing.colorViews?.[singleColorKey] || {}),
            ...viewPayload,
          },
        };
      }
      merged.set(key, existing);
    });
    return Array.from(merged.values());
  }, [studioProducts]);

  const availableProducts = useMemo(
    () => (studioReady ? (mergedStudioProducts.length ? mergedStudioProducts : products) : []),
    [mergedStudioProducts, studioReady]
  );

  const activeProduct = useMemo(() => {
    return (
      availableProducts.find((product) => product.id === selectedProduct) ||
      availableProducts[0]
    );
  }, [availableProducts, selectedProduct]);

  useEffect(() => {
    const studioProductId = searchParams?.get("product");
    if (!studioProductId || !availableProducts.length) return;
    const match = availableProducts.find((product) => String(product.id) === String(studioProductId));
    if (match && match.id !== selectedProduct) {
      setSelectedProduct(match.id);
    }
  }, [availableProducts, searchParams, selectedProduct]);
  const activeColorKey = useMemo(
    () => resolveProductColorKey(productColor, activeProduct),
    [productColor, activeProduct]
  );
  const activeProductImage = useMemo(
    () =>
      savedBaseImages?.[selectedPosition] ||
      resolveProductImage(activeProduct, selectedPosition, activeColorKey),
    [activeProduct, selectedPosition, activeColorKey, savedBaseImages]
  );
  const productColorOptions = useMemo(() => {
    if (!activeProduct) return undefined;
    const colorViews = getColorKeys(activeProduct.colorViews);
    const colorMockups = getColorKeys(activeProduct.colorMockups);
    const colors = Array.isArray(activeProduct.colors) ? activeProduct.colors : [];
    const merged = Array.from(
      new Set(
        [...colorViews, ...colorMockups, ...colors]
          .map((color) => color.trim())
          .filter(Boolean)
      )
    );
    return merged.length ? merged : undefined;
  }, [activeProduct]);
  const productPreviewImage = useMemo(
    () =>
      savedBaseImages?.front ||
      resolveProductImage(activeProduct, "front", activeColorKey),
    [activeProduct, activeColorKey, savedBaseImages]
  );

  useEffect(() => {
    try {
      const oldRaw = localStorage.getItem(LOCAL_DESIGNS_KEY);
      if (!oldRaw) return;
      const oldParsed = JSON.parse(oldRaw);
      if (!Array.isArray(oldParsed) || oldParsed.length === 0) {
        localStorage.removeItem(LOCAL_DESIGNS_KEY);
        return;
      }
      const newRaw = localStorage.getItem(localDesignsKey);
      const newParsed = newRaw ? JSON.parse(newRaw) : [];
      const next = Array.isArray(newParsed)
        ? mergeUniqueDesigns(newParsed, oldParsed)
        : oldParsed;
      localStorage.setItem(localDesignsKey, JSON.stringify(next));
      localStorage.removeItem(LOCAL_DESIGNS_KEY);
    } catch {
      /* ignore */
    }
  }, [localDesignsKey]);

  useEffect(() => {
    try {
      const oldRaw = localStorage.getItem(LOCAL_FAVORITES_KEY);
      if (!oldRaw) return;
      const oldParsed = JSON.parse(oldRaw);
      if (!Array.isArray(oldParsed) || oldParsed.length === 0) {
        localStorage.removeItem(LOCAL_FAVORITES_KEY);
        return;
      }
      const newRaw = localStorage.getItem(localFavoritesKey);
      const newParsed = newRaw ? JSON.parse(newRaw) : [];
      const merged = Array.isArray(newParsed)
        ? Array.from(new Set([...newParsed, ...oldParsed].map((id) => String(id))))
        : oldParsed.map((id) => String(id));
      localStorage.setItem(localFavoritesKey, JSON.stringify(merged));
      localStorage.removeItem(LOCAL_FAVORITES_KEY);
    } catch {
      /* ignore */
    }
  }, [localFavoritesKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(localDesignsKey);
      if (!raw) {
        setSavedDesigns([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((design) => ({
          ...design,
          isFavorite: Boolean(design.isFavorite),
        }));
        setSavedDesigns(normalized);
      }
    } catch {
      setSavedDesigns([]);
    }
  }, [localDesignsKey]);

  useEffect(() => () => {
    if (copyFlashRef.current) {
      clearTimeout(copyFlashRef.current);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(localFavoritesKey);
      if (!raw) {
        setFavoriteDesignIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFavoriteDesignIds(parsed.map((id) => String(id)));
      }
    } catch {
      setFavoriteDesignIds([]);
    }
  }, [localFavoritesKey]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const runSync = async () => {
      const result = await syncLocalDesignsToAccount(user);
      if (!isMounted || !result.synced) return;
      try {
        const raw = localStorage.getItem(localDesignsKey);
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedDesigns(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSavedDesigns([]);
      }
    };
    runSync();
    return () => {
      isMounted = false;
    };
  }, [user, localDesignsKey]);

  useEffect(() => {
    const designId = searchParams?.get("design") || searchParams?.get("designId");
    console.log("[Studio] effect fired", {
      query: searchParams?.toString?.() || "",
      designId,
    });
    if (!designId) return;
    let isMounted = true;
    const loadRemoteDesign = async () => {
      setLoadingDesignId(designId);
      try {
        const design = await designsApi.getDesign(designId);
        if (!isMounted) return;
        const studioData = extractStudioData(design);
        if (!studioData) {
          toast({
            title: "Unable to load design",
            description: "This design doesn't include studio data yet.",
            variant: "destructive",
          });
          return;
        }
        console.log("[Studio] fetched design", {
          id: design?._id || design?.id,
          hasStudio: Boolean(design?.designMetadata),
        });
        setCurrentDesignId(design?._id || design?.id || "");
        loadDesign(design);
      } catch (error) {
        if (!isMounted) return;
        console.error("[Studio] fetch failed", error);
        toast({
          title: "Unable to load design",
          description: error?.message || String(error) || "Please try again.",
          variant: "destructive",
        });
      }
    };
    loadRemoteDesign();
    return () => {
      isMounted = false;
    };
  }, [searchParams, toast]);

  useEffect(() => {
    const designId = searchParams?.get("design");
    const localDesignId = searchParams?.get("localDesign");
    if (!designId && !localDesignId) {
      setCurrentDesignId("");
      setSavedBaseImages({ front: "", back: "" });
    }
  }, [searchParams]);

  useEffect(() => {
    const localDesignId = searchParams?.get("localDesign");
    if (!localDesignId || localDesignId === loadingLocalDesignId) return;
    setLoadingLocalDesignId(localDesignId);
    try {
      const raw = localStorage.getItem(localDesignsKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const match = Array.isArray(parsed)
        ? parsed.find((design) => String(design.id) === String(localDesignId))
        : null;
      if (match) {
        setCurrentDesignId("");
        loadDesign(match);
      } else {
        toast({
          title: "Unable to load design",
          description: "Local design not found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unable to load design",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast, loadingLocalDesignId, localDesignsKey]);

  useEffect(() => {
    let isMounted = true;
    const loadStudioProducts = async () => {
      setStudioLoading(true);
      try {
        const data = await studioProductsApi.getActive();
        if (!isMounted) return;
          const normalized = Array.isArray(data)
          ? data.map((product) => ({
              id: product._id || product.id || product.name,
              name: product.name || "Studio Product",
              image: product.viewMockups?.front || product.baseMockupUrl || "",
              price: product.price ?? 0,
              category: "Studio",
              colors: Array.isArray(product.colors) ? product.colors : [],
              sizes: Array.isArray(product.sizes) ? product.sizes : [],
              viewMockups: product.viewMockups || {},
              colorViews: product.colorViews || {},
              colorMockups: product.colorMockups || {},
              baseMockupUrl: product.baseMockupUrl || "",
              designAreas: product.designAreas || {},
            }))
          : [];
        setStudioProducts(normalized);
      } catch (error) {
        toast({
          title: "Failed to load studio products",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setStudioLoading(false);
          setStudioReady(true);
        }
      }
    };
    loadStudioProducts();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!availableProducts.length) return;
    const exists = availableProducts.some((product) => product.id === selectedProduct);
    if (!exists) {
      setSelectedProduct(availableProducts[0].id);
    }
  }, [availableProducts, selectedProduct]);

  useEffect(() => {
    if (!activeProduct) return;
    const colors = Array.isArray(activeProduct.colors) ? activeProduct.colors : [];
    const availableColors =
      Array.isArray(productColorOptions) && productColorOptions.length
        ? productColorOptions
        : colors;
    if (availableColors.length) {
      const normalizedColors = availableColors
        .map((color) => color.trim().toLowerCase())
        .filter(Boolean);
      const currentKey = resolveProductColorKey(productColor, activeProduct);
      if (!normalizedColors.includes(currentKey?.toLowerCase())) {
        setProductColor(resolveColorValue(availableColors[0]));
      }
    }
    const sizes = Array.isArray(activeProduct.sizes) ? activeProduct.sizes : [];
    if (sizes.length && !sizes.includes(productSize)) {
      setProductSize(sizes[0]);
    }
  }, [activeProduct, productColor, productSize, productColorOptions]);

  useEffect(() => {
    const sideData = designBySide[selectedPosition] || createEmptySideState();
    skipSideSyncRef.current = true;
    setTextValue(sideData.textValue || "");
    setTextFontSize(sideData.textFontSize || 16);
    setTextAlign(sideData.textAlign || "center");
    setTextColor(sideData.textColor || "#000000");
    setTextFontFamily(sideData.textFontFamily || "Tajawal");
    setUploadedImage(sideData.uploadedImage || null);
    setImagePosition(sideData.imagePosition || { x: 50, y: 50 });
    setImageSize(sideData.imageSize || 120);
    isPositionSwitchRef.current = false;
  }, [selectedPosition, designBySide]);

  useEffect(() => {
    if (skipSideSyncRef.current || isPositionSwitchRef.current) {
      if (skipSideSyncRef.current) {
        skipSideSyncRef.current = false;
      }
      return;
    }
    setDesignBySide((prev) => ({
      ...prev,
      [selectedPosition]: {
        ...(prev[selectedPosition] || createEmptySideState()),
        textValue,
        textFontSize,
        textAlign,
        textColor,
        textFontFamily,
        uploadedImage,
        imagePosition,
        imageSize,
      },
    }));
  }, [
    selectedPosition,
    textValue,
    textFontSize,
    textAlign,
    textColor,
    textFontFamily,
    uploadedImage,
    imagePosition,
    imageSize,
  ]);

  const persistSavedDesigns = (next) => {
    setSavedDesigns(next);
    if (!user) {
      try {
        localStorage.setItem(localDesignsKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  };

  const persistFavorites = (next) => {
    setFavoriteDesignIds(next);
    try {
      localStorage.setItem(localFavoritesKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toggleFavoriteDesign = (designId) => {
    if (!designId) return;
    const id = String(designId);
    const isFavorite = favoriteDesignIds.includes(id);
    const nextFavorites = isFavorite
      ? favoriteDesignIds.filter((item) => item !== id)
      : [id, ...favoriteDesignIds];
    persistFavorites(nextFavorites);
    const nextDesigns = savedDesigns.map((design) =>
      String(design.id) === id ? { ...design, isFavorite: !isFavorite } : design
    );
    persistSavedDesigns(nextDesigns);
  };

  const handleImageUpload = async (payload) => {
    if (!payload?.dataUrl) return;
    setUploadedImage(payload.dataUrl);
    toast({ title: "Image uploaded" });
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePosition({ x: 50, y: 50 });
    setImageSize(120);
    toast({ title: "Image removed" });
  };

  const handleDragStart = (event) => {
    const container = event.currentTarget.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent) => {
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      setImagePosition({
        x: clamp(x, 10, 90),
        y: clamp(y, 10, 90),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const awaitImagesLoaded = async (container) => {
    if (!container) return;
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          const onLoad = () => {
            img.removeEventListener("load", onLoad);
            img.removeEventListener("error", onLoad);
            resolve();
          };
          img.addEventListener("load", onLoad);
          img.addEventListener("error", onLoad);
        });
      })
    );
  };

  const prepareImagesForCapture = async (container) => {
    if (!container || typeof window === "undefined") {
      return { cleanup: () => {} };
    }
    const origin = window.location.origin;
    const images = Array.from(container.querySelectorAll("img"));
    const replacements = [];
    for (const img of images) {
      const src = img.currentSrc || img.src || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
        continue;
      }
      if (src.startsWith(origin)) {
        continue;
      }
      if (!src.startsWith("http")) {
        continue;
      }
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        replacements.push({ img, original: src, objectUrl });
        img.src = objectUrl;
      } catch {
        /* ignore fetch failures */
      }
    }
    return {
      cleanup: () => {
        replacements.forEach(({ img, original, objectUrl }) => {
          img.src = original;
          URL.revokeObjectURL(objectUrl);
        });
      },
    };
  };

  const capturePreview = async () => {
    if (!previewRef.current) return null;
    const borderElement = previewRef.current.querySelector(".design-area-border");
    if (borderElement) {
      borderElement.style.display = "none";
    }
    const { cleanup } = await prepareImagesForCapture(previewRef.current);
    try {
      await awaitImagesLoaded(previewRef.current);
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });
      return canvas.toDataURL("image/png");
    } finally {
      cleanup();
      if (borderElement) {
        borderElement.style.display = "";
      }
    }
  };

  const waitForPreviewPaint = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  const capturePreviewForSide = async (side) => {
    if (!side) return null;
    if (side === selectedPosition) {
      await waitForPreviewPaint();
      return capturePreview();
    }
    const previous = selectedPosition;
    handlePositionChange(side);
    await waitForPreviewPaint();
    const result = await capturePreview();
    handlePositionChange(previous);
    await waitForPreviewPaint();
    return result;
  };

  const handleAddToCart = async () => {
    try {
      if (!activeProduct) {
        toast({
          title: "Unable to add to cart",
          description: "Product data is still loading. Please try again.",
          variant: "destructive",
        });
        return;
      }
      let previewImage = null;
      try {
        previewImage = await capturePreview();
      } catch (error) {
        console.warn("Failed to capture design preview, using product image.", error);
      }
      const fallbackImage = previewImage || activeProductImage;
      const hasAuthToken =
        typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token"));
      const latestDesignBySide = {
        ...designBySide,
        [selectedPosition]: {
          ...(designBySide[selectedPosition] || createEmptySideState()),
          textValue,
          textFontSize,
          textAlign,
          textColor,
          textFontFamily,
          uploadedImage,
          imagePosition,
          imageSize,
        },
      };
      let storedThumbnail = fallbackImage;
      let normalizedBySide = latestDesignBySide;
      if (hasAuthToken) {
        storedThumbnail = await uploadDataUrl(fallbackImage, "studio-thumb");
        normalizedBySide = await normalizeDesignBySide(latestDesignBySide);
      }
      const designPayload = buildDesignPayload(storedThumbnail, {
        designBySide: normalizedBySide,
      });
      const designMetadata = {
        studio: {
          data: designPayload.data,
          version: 1,
        },
      };
      const baseProductId = activeProduct?._id || activeProduct?.id;
      if (process.env.NODE_ENV === "development") {
        const payloadSize = JSON.stringify(designMetadata).length;
        console.log("[Studio] Save payload", {
          baseProductId,
          hasAuthToken,
          hasDesignBySide: Boolean(designPayload.data?.designBySide),
          payloadSize,
        });
      }
        const colorKeyForSave = activeColorKey || productColor;
        const baseProduct = {
          type: activeProduct?.type || activeProduct?.name || "Product",
          color: colorKeyForSave,
          size: productSize,
        };
        const baseFrontUrl = resolveProductImage(activeProduct, "front", colorKeyForSave);
        const baseBackUrl = resolveProductImage(activeProduct, "back", colorKeyForSave);
        let designId = currentDesignId || null;
        if (hasAuthToken && isValidObjectId(baseProductId)) {
          const payload = {
            name: designPayload.name,
            baseProductId,
            baseProduct,
            thumbnail: storedThumbnail,
            productId: designPayload.data?.productId || "",
            variantId: designPayload.data?.variantId || "",
            colorKey: designPayload.data?.colorKey || "",
            colorName: designPayload.data?.colorName || "",
            baseFrontUrl,
            baseBackUrl,
            elements: [],
            views: [],
            designMetadata,
          };
        try {
          if (designId) {
            await designsApi.updateDesign(designId, payload);
          } else {
            const created = await designsApi.createDesign(payload);
            designId = created?._id || created?.id || null;
            if (designId) {
              setCurrentDesignId(designId);
            }
          }
          if (process.env.NODE_ENV === "development") {
            console.log("[Studio] Save response", { designId });
          }
        } catch (error) {
          console.warn("Failed to create design, adding to cart without design id.", error);
        }
      }
      if (hasAuthToken && isValidObjectId(baseProductId) && !designId) {
        toast({
          title: "Unable to add to cart",
          description: "Failed to save your design. Please try again.",
          variant: "destructive",
        });
        return;
      }
      const id = designPayload.id;
      await addItem({
        id,
        name: `${activeProduct.name} (Custom)`,
        price: activeProduct.price,
        quantity: productQuantity,
        size: productSize,
        color: activeColorKey || productColor,
        image: fallbackImage,
        isCustom: true,
        notes: orderNotes,
        design: designId || undefined,
        baseProductId: isValidObjectId(baseProductId) ? baseProductId : undefined,
        baseProduct,
        designMetadata,
        designKey: id,
      });
      toast({
        title: "Added to cart",
        description: `${activeProduct.name} - ${productSize} x${productQuantity}`,
      });
    } catch {
      toast({
        title: "Unable to add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/checkout");
  };

  const buildDesignPayload = (thumbnail, dataOverrides = {}) => ({
    id: `design-${Date.now()}`,
    name: designName || "My design",
    createdAt: new Date().toISOString(),
    thumbnail,
    isFavorite: false,
    data: {
      selectedProduct,
      productId: activeProduct?._id || activeProduct?.id || "",
      variantId: activeColorKey || productColor,
      colorKey: activeColorKey || productColor,
      colorName: activeColorKey || productColor,
      baseFrontUrl: resolveProductImage(activeProduct, "front", activeColorKey || productColor),
      baseBackUrl: resolveProductImage(activeProduct, "back", activeColorKey || productColor),
      productColor: activeColorKey || productColor,
      productSize,
      selectedPosition,
      textValue,
      textFontSize,
      textAlign,
      textColor,
      textFontFamily,
      orderNotes,
      uploadedImage,
      imagePosition,
      imageSize,
      designBySide,
      ...dataOverrides,
    },
  });

    const saveDesign = async () => {
      setIsSavingDesign(true);
      let thumbnail = null;
      let previewFront = null;
      let previewBack = null;
    let toastDescription = "";
    let savedToAccount = false;
    let shouldNotify = true;
    try {
      const isSideEmpty = (side) => {
        if (!side) return true;
        const hasText = typeof side.textValue === "string" && side.textValue.trim().length > 0;
        const hasImage = typeof side.uploadedImage === "string" && side.uploadedImage.trim().length > 0;
        const hasElements = Array.isArray(side.elements) && side.elements.length > 0;
        return !hasText && !hasImage && !hasElements;
      };
      const latestDesignBySide = {
        ...designBySide,
        [selectedPosition]: {
          ...(designBySide[selectedPosition] || createEmptySideState()),
          textValue,
          textFontSize,
          textAlign,
          textColor,
          textFontFamily,
          uploadedImage,
          imagePosition,
          imageSize,
        },
      };
      const frontEmpty = isSideEmpty(latestDesignBySide.front);
      const backEmpty = isSideEmpty(latestDesignBySide.back);
      if (frontEmpty && backEmpty) {
        toast({
          title: "Design is empty",
          description: "Add text or an image before saving.",
          variant: "destructive",
        });
        shouldNotify = false;
        return;
      }
      try {
        previewFront = await capturePreviewForSide("front");
        previewBack = await capturePreviewForSide("back");
        thumbnail = previewFront || previewBack;
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Preview] capture failed, saving without previews", error?.message || error);
        }
      }

      const hasAuthToken =
        typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token"));
      let finalDesignBySide = { ...latestDesignBySide };
      if (hasAuthToken) {
        finalDesignBySide = await normalizeDesignBySide(latestDesignBySide);
      }

      const currentSideData =
        finalDesignBySide[selectedPosition] || createEmptySideState();
        const payload = buildDesignPayload(thumbnail, {
          textValue: currentSideData.textValue,
          textFontSize: currentSideData.textFontSize,
          textAlign: currentSideData.textAlign,
          textColor: currentSideData.textColor,
          textFontFamily: currentSideData.textFontFamily,
          uploadedImage: currentSideData.uploadedImage,
          imagePosition: currentSideData.imagePosition,
          imageSize: currentSideData.imageSize,
          designBySide: finalDesignBySide,
        });
        const colorKeyForSave = activeColorKey || productColor;
        const baseFrontUrl = resolveProductImage(activeProduct, "front", colorKeyForSave);
        const baseBackUrl = resolveProductImage(activeProduct, "back", colorKeyForSave);

        const baseProductId = activeProduct?._id || activeProduct?.id;
        if (!hasAuthToken) {
        toastDescription = "Please sign in to save your design to your account.";
        toast({
          title: "Sign in required",
          description: toastDescription,
          variant: "destructive",
        });
        shouldNotify = false;
        router.push("/login");
        return;
      } else if (isValidObjectId(baseProductId)) {
        try {
          const storedThumbnail = thumbnail ? await uploadDataUrl(thumbnail, "studio-thumb") : "";
          const previewFrontUrl = previewFront ? await uploadDataUrl(previewFront, "studio-front") : "";
          const previewBackUrl = previewBack ? await uploadDataUrl(previewBack, "studio-back") : "";
            const designPayload = {
              name: payload.name,
              baseProductId,
              productId: payload.data?.productId || "",
              variantId: payload.data?.variantId || "",
              colorKey: payload.data?.colorKey || "",
              colorName: payload.data?.colorName || "",
              baseFrontUrl,
              baseBackUrl,
              baseProduct: {
                type: activeProduct?.type || activeProduct?.name || "Product",
                color: colorKeyForSave,
                size: productSize,
              },
              thumbnail: storedThumbnail,
              previewFrontUrl,
              previewBackUrl,
              elements: [],
              views: [],
              designMetadata: {
                studio: {
                  data: payload.data,
                  version: 1,
                },
              },
            };
            if (process.env.NODE_ENV === "development") {
              const payloadSize = JSON.stringify(designPayload.designMetadata).length;
              console.log("[Studio] Save design", {
                currentDesignId,
                baseProductId,
                variantId: payload.data?.variantId || "",
                baseFrontUrl,
                baseBackUrl,
                previewFrontUrl,
                previewBackUrl,
                payloadSize,
              });
            }
          if (currentDesignId) {
            await designsApi.updateDesign(currentDesignId, designPayload);
          } else {
            const created = await designsApi.createDesign(designPayload);
            const newId = created?._id || created?.id || "";
            if (newId) {
              setCurrentDesignId(newId);
            }
          }
          if (process.env.NODE_ENV === "development") {
            console.log("[Studio] Save design response", {
              designId: currentDesignId || "created",
            });
          }
          savedToAccount = true;
          router.refresh();
        } catch (error) {
          toastDescription = error?.message || "Failed to save design. Please try again.";
        }
      } else {
        toastDescription = "This product isn't synced to your account yet.";
      }
    } finally {
      if (shouldNotify) {
        toast({
          title: savedToAccount ? "Design saved to My Designs" : "Design not saved",
          ...(toastDescription ? { description: toastDescription } : {}),
        });
      }
      setIsSavingDesign(false);
    }
  };

  const extractStudioData = (design) => {
    if (!design) return null;
    return (
      design?.designMetadata?.studio?.data ||
      design?.designMetadata?.data ||
      design?.designMetadata ||
      design?.data ||
      null
    );
  };

  const loadDesign = (design) => {
    const data = extractStudioData(design);
    if (!data) return;
    const normalizedBySide = data.designBySide
      ? {
          front: { ...createEmptySideState(), ...(data.designBySide.front || {}) },
          back: { ...createEmptySideState(), ...(data.designBySide.back || {}) },
        }
      : {
          front: {
            ...createEmptySideState(),
            textValue: data.textValue || "",
            textFontSize: data.textFontSize || 16,
            textAlign: data.textAlign || "center",
            textColor: data.textColor || "#000000",
            textFontFamily: data.textFontFamily || "Tajawal",
            uploadedImage: data.uploadedImage || null,
            imagePosition: data.imagePosition || { x: 50, y: 50 },
            imageSize: data.imageSize || 120,
          },
          back: createEmptySideState(),
        };
    setSelectedProduct(data.productId || data.selectedProduct || availableProducts[0]?.id || products[0].id);
      setProductColor(data.colorKey || data.productColor || "#ffffff");
      setSavedBaseImages({
        front: data.baseFrontUrl || design?.baseFrontUrl || "",
        back: data.baseBackUrl || design?.baseBackUrl || "",
      });
    setProductSize(data.productSize || "M");
    const nextPosition = data.selectedPosition || "front";
    setDesignBySide(normalizedBySide);
    setSelectedPosition(nextPosition);
    const currentSideData = normalizedBySide[nextPosition] || createEmptySideState();
    skipSideSyncRef.current = true;
    setTextValue(currentSideData.textValue || "");
    setTextFontSize(currentSideData.textFontSize || 16);
    setTextAlign(currentSideData.textAlign || "center");
    setTextColor(currentSideData.textColor || "#000000");
    setTextFontFamily(currentSideData.textFontFamily || "Tajawal");
    setOrderNotes(data.orderNotes || "");
    setUploadedImage(currentSideData.uploadedImage || null);
    setImagePosition(currentSideData.imagePosition || { x: 50, y: 50 });
    setImageSize(currentSideData.imageSize || 120);
    setDesignName(design.name || "");
    toast({ title: "Design loaded" });
  };

  const area = resolveDesignArea(activeProduct, selectedPosition);
  const designShrinkFactor = 0.45;
  const adjustedArea = {
    ...area,
    top: `calc(${area.top} - 2% + (${area.height} * ${(1 - designShrinkFactor) / 2}))`,
    left: `calc(${area.left} - 0% + (${area.width} * ${(1 - designShrinkFactor) / 2}))`,
    width: `calc(${area.width} * ${designShrinkFactor})`,
    height: `calc(${area.height} * ${designShrinkFactor})`,
  };
  const sizeOptions = useMemo(() => {
    if (Array.isArray(activeProduct?.sizes) && activeProduct.sizes.length) {
      return activeProduct.sizes;
    }
    return ["XS", "S", "M", "L", "XL", "XXL"];
  }, [activeProduct]);
  const nudgeImage = (dx, dy) => {
    setImagePosition((prev) => ({
      x: clamp(prev.x + dx, 10, 90),
      y: clamp(prev.y + dy, 10, 90),
    }));
  };
  const previewThemeVars = {
    "--background": "#ffffff",
    "--foreground": "#111827",
    "--card": "#ffffff",
    "--card-foreground": "#111827",
    "--popover": "#ffffff",
    "--popover-foreground": "#111827",
    "--primary": "#111827",
    "--primary-foreground": "#ffffff",
    "--secondary": "#f3f4f6",
    "--secondary-foreground": "#111827",
    "--muted": "#f3f4f6",
    "--muted-foreground": "#6b7280",
    "--accent": "#f3f4f6",
    "--accent-foreground": "#111827",
    "--destructive": "#ef4444",
    "--destructive-foreground": "#ffffff",
    "--border": "#e5e7eb",
    "--input": "#e5e7eb",
    "--ring": "#93c5fd",
  };

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-white via-rose-50/30 to-white flex flex-col pt-16 sm:pt-20">
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        <div className="w-full xl:w-80 border-b border-gray-200 xl:border-b-0 xl:border-r bg-white overflow-hidden flex flex-col shadow-xl xl:flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 studio-theme font-tajawal">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Products</h3>
                <span className="text-xs text-muted-foreground">
                  {studioLoading ? "..." : availableProducts.length}
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-border bg-background/70 overflow-hidden">
                  {studioReady && activeProduct ? (
                    <>
                      <div className="aspect-square w-full bg-muted/30">
                        <img
                          src={sanitizeExternalUrl(productPreviewImage || activeProduct?.image || "") || "/placeholder-logo.png"}
                          alt={activeProduct?.name || "Product"}
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            if (e.currentTarget.dataset.fallbackApplied) return;
                            e.currentTarget.dataset.fallbackApplied = "true";
                            e.currentTarget.src = "/placeholder-logo.png";
                          }}
                        />
                      </div>
                      <div className="px-3 py-2 text-center space-y-2">
                        <p className="text-xs font-semibold text-foreground">
                          {activeProduct?.name || "Product"}
                        </p>
                        <ColorPicker
                          selectedColor={productColor}
                          onColorChange={(color) => {
                            setProductColor(color);
                          }}
                          colors={productColorOptions}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="aspect-square w-full bg-muted/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {studioLoading ? "Loading..." : "No products yet"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <PositionSelector
                selectedPosition={selectedPosition}
                onPositionChange={handlePositionChange}
              />
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-9 px-4 text-xs font-semibold transition-colors",
                  isCopyActive
                    ? "bg-rose-600 text-white border-rose-600 shadow-md"
                    : "text-muted-foreground border-border hover:text-foreground hover:bg-rose-50 hover:border-rose-300"
                )}
                onClick={() => {
                  setIsCopyActive(true);
                  if (copyFlashRef.current) {
                    clearTimeout(copyFlashRef.current);
                  }
                  copyFlashRef.current = setTimeout(() => {
                    setIsCopyActive(false);
                  }, 700);
                  setDesignBySide((prev) => {
                    const frontState = prev.front || createEmptySideState();
                    return {
                      ...prev,
                      back: {
                        ...createEmptySideState(),
                        ...frontState,
                      },
                    };
                  });
                }}
              >
                Copy Front to Back
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-muted/30 min-w-0 overflow-hidden">

          <div className="flex-1 overflow-auto overflow-x-auto p-4 lg:p-6 min-h-0">
            <div className="max-w-[1280px] mx-auto pt-4 lg:pt-6">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                <div className="w-full lg:w-[200px] space-y-5 order-2 lg:order-1">
                  <div className="rounded-xl border border-border bg-background/80 p-3 text-center space-y-3 shadow-sm">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground tracking-wide">Font Type</h3>
                      <Select value={textFontFamily} onValueChange={setTextFontFamily}>
                        <SelectTrigger className="w-full bg-background mt-2">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent className="text-left">
                          {textFontGroups.map((group) => (
                            <div key={group.id} className="pb-1">
                              <div className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                                {group.label}
                              </div>
                              {group.items.map((font) => (
                                <SelectItem key={font.id} value={font.family}>
                                  <span className="flex w-full items-center justify-between gap-2">
                                    <span className="text-sm" style={{ fontFamily: font.family }}>
                                      {font.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{font.style}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground tracking-wide">Font Color</h3>
                      <Select value={textColor} onValueChange={setTextColor}>
                        <SelectTrigger className="w-full bg-background mt-2">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent className="text-left">
                          {textColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-4 w-4 rounded-full border",
                                    color.value === "#ffffff" ? "border-border" : "border-transparent"
                                  )}
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

                  <div className="rounded-xl border border-border bg-background/80 p-3 text-center shadow-sm">
                    <ImageUploader
                      onImageUpload={handleImageUpload}
                      uploadedImage={uploadedImage}
                      imageSize={imageSize}
                      onImageSizeChange={setImageSize}
                    />
                    {uploadedImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 text-xs"
                        onClick={handleRemoveImage}
                      >
                        Remove image
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 order-1 lg:order-2">
                  <div className="relative mx-auto w-full min-w-[280px] sm:min-w-[320px] max-w-[1040px] 2xl:max-w-[1280px] shadow-2xl rounded-2xl overflow-hidden bg-background border border-border">
                    <div
                      style={{
                        backgroundImage: showGrid
                          ? `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`
                          : "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
                        backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                        backgroundColor: "#f9fafb",
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top center",
                      }}
                    >
                    <div className="flex items-center justify-center p-2 lg:p-3">
                      <div
                        ref={previewRef}
                        className="relative w-full max-w-4xl mx-auto"
                        style={previewThemeVars}
                      >
                        <div className="absolute inset-0 bg-muted/30 rounded-2xl" />
                        <div className="relative p-0">
                          <img
                            src={activeProductImage || "/placeholder-logo.png"}
                            alt={`${activeProduct?.name || "Product"} preview`}
                            className="w-full h-full rounded-2xl object-contain"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              if (e.currentTarget.dataset.fallbackApplied) return;
                              e.currentTarget.dataset.fallbackApplied = "true";
                              e.currentTarget.src = "/placeholder-logo.png";
                            }}
                          />

                          <div
                            className="absolute border-2 border-dashed border-foreground/30 rounded-sm pointer-events-none design-area-border"
                            style={{
                              top: adjustedArea.top,
                              left: adjustedArea.left,
                              width: adjustedArea.width,
                              height: adjustedArea.height,
                            }}
                          />

                          {uploadedImage && (
                            <div
                              className="absolute cursor-move group overflow-hidden"
                              style={{
                                left: adjustedArea.left,
                                top: adjustedArea.top,
                                width: adjustedArea.width,
                                height: adjustedArea.height,
                              }}
                            >
                              <div
                                className="absolute"
                                style={{
                                  left: `${imagePosition.x}%`,
                                  top: `${imagePosition.y}%`,
                                  transform: "translate(-50%, -50%)",
                                  width: `${imageSize}px`,
                                  height: `${imageSize}px`,
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                }}
                                onMouseDown={handleDragStart}
                              >
                                <img
                                  src={uploadedImage}
                                  alt="Uploaded design"
                                  className="w-full h-full object-contain"
                                  crossOrigin="anonymous"
                                  draggable={false}
                                />
                                <div className="absolute -left-7 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => nudgeImage(-2, 0)}
                                    className="h-6 w-6 rounded-full border border-border bg-background/90 shadow-sm hover:bg-muted"
                                    aria-label="Move image left"
                                  >
                                    <ArrowLeft className="h-3 w-3 mx-auto" />
                                  </button>
                                </div>
                                <div className="absolute -right-7 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => nudgeImage(0, -2)}
                                    className="h-6 w-6 rounded-full border border-border bg-background/90 shadow-sm hover:bg-muted"
                                    aria-label="Move image up"
                                  >
                                    <ArrowUp className="h-3 w-3 mx-auto" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => nudgeImage(0, 2)}
                                    className="h-6 w-6 rounded-full border border-border bg-background/90 shadow-sm hover:bg-muted"
                                    aria-label="Move image down"
                                  >
                                    <ArrowDown className="h-3 w-3 mx-auto" />
                                  </button>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <Move className="w-6 h-6 text-foreground/50" />
                                </div>
                              </div>
                            </div>
                          )}

                          {textValue && (
                            <div
                              className="absolute flex items-center justify-center p-2 overflow-hidden pointer-events-none"
                              style={{
                                top: adjustedArea.top,
                                left: adjustedArea.left,
                                width: adjustedArea.width,
                                height: adjustedArea.height,
                                textAlign,
                              }}
                            >
                              <span
                                className="font-bold leading-tight break-words w-full"
                                style={{
                                  color: textColor,
                                  fontSize: `${textFontSize}px`,
                                  textAlign,
                                  fontFamily: textFontFamily,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                }}
                              >
                                {textValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                <div className="w-full lg:w-[220px] space-y-5 order-3">
                  <div className="rounded-xl border border-border bg-background/80 p-4 text-center shadow-sm">
                    <h3 className="text-xs font-semibold text-foreground tracking-wide">Text</h3>
                    <div className="flex w-full flex-col gap-2 rounded-md border border-border bg-background px-2 py-2 mt-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setTextFontSize(clamp(textFontSize - 2, 12, 72))}
                          className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          aria-label="Decrease font size"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium min-w-[44px] text-center">
                          {textFontSize}px
                        </span>
                        <button
                          onClick={() => setTextFontSize(clamp(textFontSize + 2, 12, 72))}
                          className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          aria-label="Increase font size"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-1 border border-border rounded-md p-1">
                        <button
                          onClick={() => setTextAlign("right")}
                          className={cn(
                            "h-7 w-7 rounded flex items-center justify-center transition-colors",
                            textAlign === "right" ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          aria-label="Align right"
                        >
                          <AlignRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setTextAlign("center")}
                          className={cn(
                            "h-7 w-7 rounded flex items-center justify-center transition-colors",
                            textAlign === "center" ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          aria-label="Align center"
                        >
                          <AlignCenter className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setTextAlign("left")}
                          className={cn(
                            "h-7 w-7 rounded flex items-center justify-center transition-colors",
                            textAlign === "left" ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          aria-label="Align left"
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Textarea
                      value={textValue}
                      onChange={(event) => setTextValue(event.target.value)}
                      placeholder="Type your text here..."
                      dir="auto"
                      className="min-h-[96px] w-full resize-none bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 mt-3"
                      style={{ fontFamily: textFontFamily }}
                    />
                    <div className="mt-4 text-left">
                      <p className="text-xs font-semibold text-foreground tracking-wide">Order Notes</p>
                      <Textarea
                        value={orderNotes}
                        onChange={(event) => setOrderNotes(event.target.value)}
                        placeholder="Add any details for the team..."
                        dir="auto"
                        className="min-h-[96px] w-full resize-none bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 mt-2"
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-96 border-t border-border xl:border-t-0 xl:border-l bg-background overflow-hidden flex flex-col shadow-sm xl:flex-shrink-0">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 space-y-4 overflow-y-auto bg-muted/20 flex-1 min-h-0">
              <Card className="p-4 bg-background shadow-sm">
                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Product Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground font-medium">
                      Product
                    </Label>
                    <p className="text-sm font-semibold">{activeProduct?.name || "Product"}</p>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block text-muted-foreground font-medium">
                      Size
                    </Label>
                    <Select value={productSize} onValueChange={setProductSize}>
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <QuantitySelector
                      quantity={productQuantity}
                      onQuantityChange={setProductQuantity}
                    />
                  </div>

                  <div className="pt-2 border-t">
                    <Label className="text-xs mb-2 block text-muted-foreground font-medium">
                      Price
                    </Label>
                    <p className="text-3xl font-bold text-primary">
                      ${activeProduct?.price ?? 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-background shadow-sm">
                <Label
                  htmlFor="design-name"
                  className="text-xs mb-2 block text-muted-foreground font-medium"
                >
                  Design Name
                </Label>
                <Input
                  id="design-name"
                  placeholder="Enter design name..."
                  value={designName}
                  onChange={(event) => setDesignName(event.target.value)}
                  className="h-9 bg-background"
                />
              </Card>

              <Card className="p-4 bg-background shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Saved Designs</h3>
                  <span className="text-xs text-muted-foreground">{savedDesigns.length}</span>
                </div>
                {savedDesigns.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No saved designs yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {savedDesigns.map((design) => (
                      <div
                        key={design.id}
                        className="rounded-lg border border-border overflow-hidden text-left hover:border-primary/50 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => loadDesign(design)}
                          className="w-full text-left"
                        >
                          <div className="relative w-full h-20 bg-muted">
                            {design.thumbnail ? (
                              <img
                                src={sanitizeExternalUrl(design.thumbnail)}
                                alt={design.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{design.name}</p>
                          </div>
                        </button>
                        <div className="px-2 pb-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavoriteDesign(design.id);
                            }}
                            className={cn(
                              "flex items-center justify-center gap-1 w-full text-[11px] font-medium rounded-md border border-border py-1 transition-colors",
                              favoriteDesignIds.includes(String(design.id))
                                ? "text-rose-600 bg-rose-50 border-rose-200"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                            aria-label="Favorite design"
                          >
                            <Heart
                              className="h-3 w-3"
                              fill={
                                favoriteDesignIds.includes(String(design.id))
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            {favoriteDesignIds.includes(String(design.id))
                              ? "Favorited"
                              : "Favorite"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
            <div className="space-y-3 pt-4 px-4 pb-4 border-t border-border bg-gradient-to-b from-background/95 to-background backdrop-blur-sm shadow-lg sticky bottom-0 z-20 flex-shrink-0">
              <Button
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-gray-900 shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart x{productQuantity} - ${activeProduct?.price ?? 0}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 bg-background hover:bg-primary hover:text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all border-2"
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 bg-background font-semibold shadow-md hover:shadow-lg transition-all border-2"
                onClick={saveDesign}
                disabled={isSavingDesign}
              >
                {isSavingDesign ? "Saving..." : "Save Design"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
