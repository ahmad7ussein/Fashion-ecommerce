"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const partnerPanelController_1 = require("../controllers/partnerPanelController");
const auth_1 = require("../middleware/auth");
const roleAssignments_1 = require("../middleware/roleAssignments");
const router = express_1.default.Router();
router.use(auth_1.protect, (0, roleAssignments_1.requireRoleAssignment)('partner'));
router.get('/store', partnerPanelController_1.getPartnerStoreForUser);
router.get('/products', partnerPanelController_1.getPartnerStoreProductsForUser);
router.post('/products', partnerPanelController_1.createPartnerProductForUser);
router.put('/products/:id', partnerPanelController_1.updatePartnerProductForUser);
router.get('/analytics', partnerPanelController_1.getPartnerAnalyticsForUser);
exports.default = router;
