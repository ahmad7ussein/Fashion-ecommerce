import { designsApi } from "@/lib/api/designs";
import { studioProductsApi } from "@/lib/api/studioProducts";

const LOCAL_DESIGNS_KEY = "fashionhub_simple_studio_designs";

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ""));

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const resolveStudioProduct = (design, studioProducts) => {
  if (!design || !Array.isArray(studioProducts) || studioProducts.length === 0) {
    return null;
  }
  const selectedProduct = design?.data?.selectedProduct;
  if (selectedProduct) {
    const normalized = normalizeKey(selectedProduct);
    const directMatch = studioProducts.find((product) => {
      const id = normalizeKey(product?._id || product?.id);
      const name = normalizeKey(product?.name);
      const type = normalizeKey(product?.type);
      return [id, name, type].includes(normalized);
    });
    if (directMatch) {
      return directMatch;
    }
  }
  return studioProducts[0] || null;
};

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
  const uploaded = await Promise.all(
    entries.map(async ([sideKey, sideData]) => {
      if (!sideData || typeof sideData !== "object") {
        return [sideKey, sideData];
      }
      const uploadedImage = await uploadDataUrl(
        sideData.uploadedImage,
        `studio-sync-${sideKey}`
      );
      return [sideKey, { ...sideData, uploadedImage }];
    })
  );
  return Object.fromEntries(uploaded);
};

export const syncLocalDesignsToAccount = async (user) => {
  if (typeof window === "undefined" || !user) {
    return { synced: 0, failed: 0 };
  }
  const userKey = user?._id || user?.id || user?.email || "guest";
  const localDesignsKey = `${LOCAL_DESIGNS_KEY}:${userKey}`;
  let parsed = [];
  try {
    const raw = localStorage.getItem(localDesignsKey);
    if (!raw) {
      return { synced: 0, failed: 0 };
    }
    const local = JSON.parse(raw);
    if (Array.isArray(local)) {
      parsed = local;
    }
  } catch {
    return { synced: 0, failed: 0 };
  }
  if (!parsed.length) {
    return { synced: 0, failed: 0 };
  }
  const studioProducts = await studioProductsApi.getActive().catch(() => []);
  const remaining = [];
  let synced = 0;
  for (const design of parsed) {
    try {
      const product = resolveStudioProduct(design, studioProducts);
      const baseProductId = product?._id || product?.id;
      if (!isValidObjectId(baseProductId)) {
        remaining.push(design);
        continue;
      }
      const data = design?.data || {};
      const storedThumbnail = await uploadDataUrl(design?.thumbnail, "studio-sync-thumb");
      const normalizedBySide = await normalizeDesignBySide(data.designBySide || null);
      const baseProduct = {
        type: product?.type || product?.name || data.selectedProduct || "Product",
        color: data.productColor || product?.colors?.[0] || "white",
        size: data.productSize || product?.sizes?.[0] || "M",
      };
      await designsApi.createDesign({
        name: design?.name || "My design",
        baseProductId,
        baseProduct,
        thumbnail: storedThumbnail || design?.thumbnail || "",
        elements: [],
        views: [],
        designMetadata: {
          studio: {
            data: {
              ...data,
              designBySide: normalizedBySide || data.designBySide,
            },
            version: 1,
          },
        },
      });
      synced += 1;
    } catch {
      remaining.push(design);
    }
  }
  if (remaining.length) {
    localStorage.setItem(localDesignsKey, JSON.stringify(remaining));
  } else {
    localStorage.removeItem(localDesignsKey);
  }
  return { synced, failed: remaining.length };
};
