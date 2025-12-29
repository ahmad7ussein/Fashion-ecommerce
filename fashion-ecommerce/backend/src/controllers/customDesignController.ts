import { Response } from 'express';
import mongoose from 'mongoose';
import CustomDesignRequest from '../models/CustomDesignRequest';
import { AuthRequest } from '../middleware/auth';

const isValidObjectId = (id?: string) => !!id && mongoose.Types.ObjectId.isValid(id);

export const createCustomDesignRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { designName, textContent, imageUrl, printArea, size, additionalPrice, totalPrice } = req.body;

    if (!designName) {
      return res.status(400).json({ success: false, message: 'Design name is required' });
    }

    const request = await CustomDesignRequest.create({
      user: req.user?._id,
      requesterName: req.body.requesterName,
      requesterEmail: req.body.requesterEmail,
      designName,
      textContent,
      imageUrl,
      printArea,
      size,
      additionalPrice,
      totalPrice,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getCustomDesignRequests = async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await CustomDesignRequest.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateCustomDesignRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const request = await CustomDesignRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        reviewNotes: req.body.reviewNotes,
        reviewedBy: req.user?._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
