import { Response } from 'express';
import mongoose from 'mongoose';
import RoleAssignment from '../models/RoleAssignment';
import PartnerStore from '../models/PartnerStore';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id?: string) => !!id && mongoose.Types.ObjectId.isValid(id);
const validRoles = ['service_provider', 'partner'];

export const getRoleAssignments = async (_req: AuthRequest, res: Response) => {
  try {
    const assignments = await RoleAssignment.find()
      .populate('user', 'firstName lastName email')
      .populate('partnerStore', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getMyRoleAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const assignments = await RoleAssignment.find({
      user: req.user?._id,
      status: 'active',
    }).populate('partnerStore', 'name slug');

    res.status(200).json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createRoleAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId, email, partnerStoreId, notes } = req.body;

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    let user = null;

    if (userId && isValidObjectId(userId)) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email: String(email).toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let partnerStore = null;
    if (role === 'partner') {
      if (!partnerStoreId || !isValidObjectId(partnerStoreId)) {
        return res.status(400).json({ success: false, message: 'Partner store is required for partner role' });
      }
      partnerStore = await PartnerStore.findById(partnerStoreId);
      if (!partnerStore) {
        return res.status(404).json({ success: false, message: 'Partner store not found' });
      }
    }

    const existing = await RoleAssignment.findOne({ user: user._id, role });

    if (existing) {
      existing.status = 'active';
      existing.partnerStore = partnerStore ? partnerStore._id : undefined;
      existing.notes = notes || existing.notes;
      await existing.save();
      return res.status(200).json({ success: true, data: existing });
    }

    const assignment = await RoleAssignment.create({
      user: user._id,
      role,
      status: 'active',
      partnerStore: partnerStore ? partnerStore._id : undefined,
      notes,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateRoleAssignmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid role assignment ID format' });
    }

    const assignment = await RoleAssignment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, notes: req.body.notes },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Role assignment not found' });
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
