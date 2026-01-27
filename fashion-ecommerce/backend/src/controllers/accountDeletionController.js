"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccountDeletionStatus = exports.getMyAccountDeletionRequest = exports.getAccountDeletionRequests = exports.createAccountDeletionRequest = void 0;
const crypto_1 = __importDefault(require("crypto"));
const AccountDeletionRequest_1 = __importDefault(require("../models/AccountDeletionRequest"));
const User_1 = __importDefault(require("../models/User"));
const Order_1 = __importDefault(require("../models/Order"));
const Design_1 = __importDefault(require("../models/Design"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Favorite_1 = __importDefault(require("../models/Favorite"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Review_1 = __importDefault(require("../models/Review"));
const UserPreferences_1 = __importDefault(require("../models/UserPreferences"));
const EmployeeActivity_1 = __importDefault(require("../models/EmployeeActivity"));
const StaffChatMessage_1 = __importDefault(require("../models/StaffChatMessage"));
const ContactMessage_1 = __importDefault(require("../models/ContactMessage"));
const anonymizeUserAccount = async (user) => {
    const userId = user._id;
    const anonymizedEmail = `deleted+${userId.toString()}@deleted.local`;
    await Promise.all([
        Cart_1.default.deleteMany({ user: userId }),
        Design_1.default.deleteMany({ user: userId }),
        Favorite_1.default.deleteMany({ user: userId }),
        Notification_1.default.deleteMany({ user: userId }),
        Review_1.default.deleteMany({ user: userId }),
        UserPreferences_1.default.deleteMany({ user: userId }),
        EmployeeActivity_1.default.deleteMany({ employee: userId }),
        StaffChatMessage_1.default.deleteMany({
            $or: [{ admin: userId }, { employee: userId }, { sender: userId }],
        }),
    ]);
    await Promise.all([
        ContactMessage_1.default.updateMany({ repliedBy: userId }, { $unset: { repliedBy: "" } }),
        Order_1.default.updateMany({ user: userId }, {
            $set: {
                "shippingAddress.firstName": "Deleted",
                "shippingAddress.lastName": "User",
                "shippingAddress.email": anonymizedEmail,
                "shippingAddress.phone": "",
                "shippingAddress.street": "",
                "shippingAddress.city": "",
                "shippingAddress.state": "",
                "shippingAddress.zip": "",
                "shippingAddress.country": "",
            },
        }),
        Order_1.default.updateMany({ "trackingHistory.updatedBy": userId }, {
            $set: { "trackingHistory.$[entry].updatedBy": null },
        }, { arrayFilters: [{ "entry.updatedBy": userId }] }),
    ]);
    user.firstName = "Deleted";
    user.lastName = "User";
    user.email = anonymizedEmail;
    user.phone = undefined;
    user.address = undefined;
    user.googleId = undefined;
    user.provider = "local";
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.role = "customer";
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.password = crypto_1.default.randomBytes(32).toString("hex");
    await user.save();
};
const createAccountDeletionRequest = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        const existingRequest = await AccountDeletionRequest_1.default.findOne({
            user: req.user._id,
            status: "pending",
        });
        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "An account deletion request is already pending review.",
            });
        }
        const { reason } = req.body || {};
        const request = await AccountDeletionRequest_1.default.create({
            user: req.user._id,
            reason: reason || undefined,
            status: "pending",
        });
        res.status(201).json({
            success: true,
            message: "Account deletion request submitted. It will be reviewed by an admin.",
            data: request,
        });
    }
    catch (error) {
        console.error(" Error creating account deletion request:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
exports.createAccountDeletionRequest = createAccountDeletionRequest;
const getMyAccountDeletionRequest = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }
        const request = await AccountDeletionRequest_1.default.findOne({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: request || null,
        });
    }
    catch (error) {
        console.error(" Error fetching account deletion request:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
exports.getMyAccountDeletionRequest = getMyAccountDeletionRequest;
const getAccountDeletionRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status && status !== "all") {
            query.status = status;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const requests = await AccountDeletionRequest_1.default.find(query)
            .populate("user", "firstName lastName email isDeleted")
            .populate("reviewedBy", "firstName lastName email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean()
            .maxTimeMS(10000);
        const total = await AccountDeletionRequest_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            count: requests.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: requests,
        });
    }
    catch (error) {
        console.error(" Error fetching account deletion requests:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
exports.getAccountDeletionRequests = getAccountDeletionRequests;
const updateAccountDeletionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID format",
            });
        }
        const { status, adminResponse } = req.body || {};
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be approved or rejected",
            });
        }
        const request = await AccountDeletionRequest_1.default.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Account deletion request not found",
            });
        }
        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "This request has already been processed",
            });
        }
        const user = await User_1.default.findById(request.user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        if (status === "approved") {
            if (req.user && user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot approve deletion of your own account",
                });
            }
            await anonymizeUserAccount(user);
        }
        request.status = status;
        request.adminResponse = adminResponse || undefined;
        request.reviewedBy = req.user?._id;
        request.reviewedAt = new Date();
        await request.save();
        res.status(200).json({
            success: true,
            message: `Account deletion request ${status === "approved" ? "approved" : "rejected"}`,
            data: request,
        });
    }
    catch (error) {
        console.error(" Error updating account deletion request:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
exports.updateAccountDeletionStatus = updateAccountDeletionStatus;
