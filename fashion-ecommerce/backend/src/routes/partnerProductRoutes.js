"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const partnerStoreController_1 = require("../controllers/partnerStoreController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.get('/', (0, auth_1.authorize)('admin'), partnerStoreController_1.getPartnerProducts);
router.post('/', (0, auth_1.authorize)('admin'), partnerStoreController_1.createPartnerProduct);
router.put('/:id/approve', (0, auth_1.authorize)('admin'), partnerStoreController_1.approvePartnerProduct);
router.put('/:id/reject', (0, auth_1.authorize)('admin'), partnerStoreController_1.rejectPartnerProduct);
exports.default = router;
