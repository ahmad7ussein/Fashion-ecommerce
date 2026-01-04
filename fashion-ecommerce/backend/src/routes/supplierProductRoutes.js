"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supplierController_1 = require("../controllers/supplierController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.get('/', (0, auth_1.authorize)('admin'), supplierController_1.getSupplierProducts);
router.post('/', (0, auth_1.authorize)('admin'), supplierController_1.createSupplierProduct);
router.put('/:id/approve', (0, auth_1.authorize)('admin'), supplierController_1.approveSupplierProduct);
router.put('/:id/reject', (0, auth_1.authorize)('admin'), supplierController_1.rejectSupplierProduct);
exports.default = router;
