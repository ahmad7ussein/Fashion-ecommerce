"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
router.post('/', auth_1.protect, validator_1.orderValidation, validator_1.validate, orderController_1.createOrder);
router.get('/my-orders', auth_1.protect, orderController_1.getMyOrders);
router.get('/', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), orderController_1.getAllOrders);
router.get('/stats/overview', auth_1.protect, (0, auth_1.authorize)('admin'), orderController_1.getOrderStats);
router.get('/:id', auth_1.protect, orderController_1.getOrder);
router.put('/:id/status', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), orderController_1.updateOrderStatus);
router.put('/:id/payment', auth_1.protect, (0, auth_1.authorize)('admin'), orderController_1.updatePaymentStatus);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), orderController_1.deleteOrder);
exports.default = router;
