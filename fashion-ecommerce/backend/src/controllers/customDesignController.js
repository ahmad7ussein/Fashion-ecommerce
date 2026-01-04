"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomDesignRequestStatus = exports.getCustomDesignRequests = exports.createCustomDesignRequest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const CustomDesignRequest_1 = __importDefault(require("../models/CustomDesignRequest"));
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
const createCustomDesignRequest = async (req, res) => {
    try {
        const { designName, textContent, imageUrl, printArea, size, additionalPrice, totalPrice } = req.body;
        if (!designName) {
            return res.status(400).json({ success: false, message: 'Design name is required' });
        }
        const request = await CustomDesignRequest_1.default.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createCustomDesignRequest = createCustomDesignRequest;
const getCustomDesignRequests = async (_req, res) => {
    try {
        const requests = await CustomDesignRequest_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: requests });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getCustomDesignRequests = getCustomDesignRequests;
const updateCustomDesignRequestStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid request ID format' });
        }
        const request = await CustomDesignRequest_1.default.findByIdAndUpdate(req.params.id, {
            status: req.body.status,
            reviewNotes: req.body.reviewNotes,
            reviewedBy: req.user?._id,
            reviewedAt: new Date(),
        }, { new: true });
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        res.status(200).json({ success: true, data: request });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateCustomDesignRequestStatus = updateCustomDesignRequestStatus;
