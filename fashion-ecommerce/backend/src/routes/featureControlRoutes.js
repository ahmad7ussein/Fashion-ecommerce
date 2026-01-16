"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const featureControlController_1 = require("../controllers/featureControlController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.get('/home-slider', featureControlController_1.getHomeSliderSettings);
router.use(auth_1.protect);
router.get('/virtual-experience', (0, auth_1.authorize)('admin'), featureControlController_1.getVirtualExperienceSettings);
router.put('/virtual-experience', (0, auth_1.authorize)('admin'), featureControlController_1.updateVirtualExperienceSettings);
router.post('/virtual-experience/usage', featureControlController_1.logVirtualExperienceUsage);
router.post('/virtual-experience/conversion', featureControlController_1.logVirtualExperienceConversion);
router.post('/home-slider/upload', (0, auth_1.authorize)('admin'), upload_1.uploadSingle, featureControlController_1.uploadHomeSliderImage);
router.put('/home-slider', (0, auth_1.authorize)('admin'), featureControlController_1.updateHomeSliderSettings);
exports.default = router;
