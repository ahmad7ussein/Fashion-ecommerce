"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleAssignmentStatus = exports.createRoleAssignment = exports.getMyRoleAssignments = exports.getRoleAssignments = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const RoleAssignment_1 = __importDefault(require("../models/RoleAssignment"));
const PartnerStore_1 = __importDefault(require("../models/PartnerStore"));
const User_1 = __importDefault(require("../models/User"));
const isValidObjectId = (id) => !!id && mongoose_1.default.Types.ObjectId.isValid(id);
const validRoles = ['service_provider', 'partner'];
const getRoleAssignments = async (_req, res) => {
    try {
        const assignments = await RoleAssignment_1.default.find()
            .populate('user', 'firstName lastName email')
            .populate('partnerStore', 'name slug')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: assignments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getRoleAssignments = getRoleAssignments;
const getMyRoleAssignments = async (req, res) => {
    try {
        const assignments = await RoleAssignment_1.default.find({
            user: req.user?._id,
            status: 'active',
        }).populate('partnerStore', 'name slug');
        res.status(200).json({ success: true, data: assignments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.getMyRoleAssignments = getMyRoleAssignments;
const createRoleAssignment = async (req, res) => {
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
            user = await User_1.default.findById(userId);
        }
        else if (email) {
            user = await User_1.default.findOne({ email: String(email).toLowerCase().trim() });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let partnerStore = null;
        if (role === 'partner') {
            if (!partnerStoreId || !isValidObjectId(partnerStoreId)) {
                return res.status(400).json({ success: false, message: 'Partner store is required for partner role' });
            }
            partnerStore = await PartnerStore_1.default.findById(partnerStoreId);
            if (!partnerStore) {
                return res.status(404).json({ success: false, message: 'Partner store not found' });
            }
        }
        const existing = await RoleAssignment_1.default.findOne({ user: user._id, role });
        if (existing) {
            existing.status = 'active';
            existing.partnerStore = partnerStore ? partnerStore._id : undefined;
            existing.notes = notes || existing.notes;
            await existing.save();
            return res.status(200).json({ success: true, data: existing });
        }
        const assignment = await RoleAssignment_1.default.create({
            user: user._id,
            role,
            status: 'active',
            partnerStore: partnerStore ? partnerStore._id : undefined,
            notes,
        });
        res.status(201).json({ success: true, data: assignment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.createRoleAssignment = createRoleAssignment;
const updateRoleAssignmentStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid role assignment ID format' });
        }
        const assignment = await RoleAssignment_1.default.findByIdAndUpdate(req.params.id, { status: req.body.status, notes: req.body.notes }, { new: true });
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Role assignment not found' });
        }
        res.status(200).json({ success: true, data: assignment });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};
exports.updateRoleAssignmentStatus = updateRoleAssignmentStatus;
