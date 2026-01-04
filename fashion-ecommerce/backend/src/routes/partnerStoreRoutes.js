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
router.get('/', (0, auth_1.authorize)('admin'), partnerStoreController_1.getPartnerStores);
router.post('/', (0, auth_1.authorize)('admin'), partnerStoreController_1.createPartnerStore);
router.put('/:id', (0, auth_1.authorize)('admin'), partnerStoreController_1.updatePartnerStore);
router.put('/:id/status', (0, auth_1.authorize)('admin'), partnerStoreController_1.updatePartnerStoreStatus);
router.get('/:id/analytics', (0, auth_1.authorize)('admin'), partnerStoreController_1.getPartnerAnalytics);
router.post('/:id/track-click', (0, auth_1.authorize)('admin'), partnerStoreController_1.trackPartnerClick);
router.post('/:id/track-sale', (0, auth_1.authorize)('admin'), partnerStoreController_1.trackPartnerSale);
exports.default = router;
