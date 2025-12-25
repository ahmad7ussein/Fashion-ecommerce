import { Response } from 'express';
import StudioProduct from '../models/StudioProduct';
import { AuthRequest } from '../middleware/auth';

// Create studio product (admin)
export const createStudioProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await StudioProduct.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Update studio product (admin)
export const updateStudioProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await StudioProduct.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
