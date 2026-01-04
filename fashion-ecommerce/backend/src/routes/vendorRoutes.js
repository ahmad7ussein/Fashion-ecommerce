"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vendorController_1 = require("../controllers/vendorController");
const auth_1 = require("../middleware/auth");
const roleAssignments_1 = require("../middleware/roleAssignments");
const router = express_1.default.Router();
router.use(auth_1.protect, (0, roleAssignments_1.requireRoleAssignment)('service_provider'));
router.get('/products', vendorController_1.getVendorProducts);
router.post('/products', vendorController_1.createVendorProduct);
router.put('/products/:id', vendorController_1.updateVendorProduct);
router.get('/orders', vendorController_1.getVendorOrders);
router.get('/reports', vendorController_1.getVendorReport);
router.put('/products/:id/approve', (0, auth_1.authorize)('admin'), vendorController_1.approveVendorProduct);
router.put('/products/:id/reject', (0, auth_1.authorize)('admin'), vendorController_1.rejectVendorProduct);
exports.default = router;
