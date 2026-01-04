"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoleAssignment = void 0;
const RoleAssignment_1 = __importDefault(require("../models/RoleAssignment"));
const requireRoleAssignment = (role) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        if (req.user.role === 'admin') {
            return next();
        }
        const assignment = await RoleAssignment_1.default.findOne({
            user: req.user._id,
            role,
            status: 'active',
        });
        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'Access denied for this role',
            });
        }
        req.roleAssignment = assignment;
        next();
    };
};
exports.requireRoleAssignment = requireRoleAssignment;
