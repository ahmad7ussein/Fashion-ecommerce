import { Response } from 'express';
import StudioProduct from '../models/StudioProduct';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../config/cloudinary';

const normalizeImageString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    const candidate = (value as { url?: unknown; secure_url?: unknown; path?: unknown }).url
      || (value as { url?: unknown; secure_url?: unknown; path?: unknown }).secure_url
      || (value as { url?: unknown; secure_url?: unknown; path?: unknown }).path;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return null;
};

const resolveMockupUrl = async (value: unknown): Promise<string | null> => {
  const normalized = normalizeImageString(value);
  if (!normalized) return null;
  if (normalized.startsWith('data:image/')) {
    return uploadToCloudinary(normalized, 'stylecraft/studio-products');
  }
  return normalized;
};

const resolveColorMockups = async (value: unknown): Promise<Record<string, string>> => {
  if (!value || typeof value !== 'object') return {};

  const entries: Array<{ color: string; url: unknown }> = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === 'object') {
        const color = String((item as { color?: unknown }).color || '').trim();
        const url = (item as { url?: unknown }).url;
        if (color) {
          entries.push({ color, url });
        }
      }
    }
  } else {
    for (const [colorKey, url] of Object.entries(value as Record<string, unknown>)) {
      const color = colorKey.trim();
      if (color) {
        entries.push({ color, url });
      }
    }
  }

  const resolved: Record<string, string> = {};
  for (const entry of entries) {
    const key = entry.color.trim().toLowerCase();
    if (!key) continue;
    const resolvedUrl = await resolveMockupUrl(entry.url);
    if (resolvedUrl) {
      resolved[key] = resolvedUrl;
    }
  }

  return resolved;
};

// Create studio product (admin)
export const createStudioProduct = async (req: AuthRequest, res: Response) => {
  try {
    const payload: any = { ...req.body };
    if (!payload.baseMockupUrl) {
      return res.status(400).json({ success: false, message: 'Mockup image is required' });
    }

    let resolvedMockup: string | null = null;
    try {
      resolvedMockup = await resolveMockupUrl(payload.baseMockupUrl);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: `Failed to upload mockup image: ${error.message || 'Upload failed'}`,
      });
    }
    if (!resolvedMockup) {
      return res.status(400).json({ success: false, message: 'Invalid mockup image format' });
    }
    payload.baseMockupUrl = resolvedMockup;

    if (payload.colorMockups) {
      try {
        payload.colorMockups = await resolveColorMockups(payload.colorMockups);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload color mockups: ${error.message || 'Upload failed'}`,
        });
      }
    }

    const product = await StudioProduct.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Update studio product (admin)
export const updateStudioProduct = async (req: AuthRequest, res: Response) => {
  try {
    const payload: any = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(payload, 'baseMockupUrl')) {
      let resolvedMockup: string | null = null;
      try {
        resolvedMockup = await resolveMockupUrl(payload.baseMockupUrl);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload mockup image: ${error.message || 'Upload failed'}`,
        });
      }
      if (!resolvedMockup) {
        return res.status(400).json({ success: false, message: 'Invalid mockup image format' });
      }
      payload.baseMockupUrl = resolvedMockup;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'colorMockups')) {
      try {
        payload.colorMockups = await resolveColorMockups(payload.colorMockups);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: `Failed to upload color mockups: ${error.message || 'Upload failed'}`,
        });
      }
    }

    const product = await StudioProduct.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Studio product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Delete studio product (admin)
export const deleteStudioProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await StudioProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Studio product not found' });
    }
    res.status(200).json({ success: true, message: 'Studio product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get all (admin)
export const getAllStudioProducts = async (_req: AuthRequest, res: Response) => {
  try {
    const products = await StudioProduct.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get active (public)
export const getActiveStudioProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await StudioProduct.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get one (admin)
export const getStudioProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await StudioProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Studio product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
