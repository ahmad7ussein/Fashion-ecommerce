"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const designController_1 = require("../controllers/designController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
router.post('/', auth_1.protect, validator_1.designValidation, validator_1.validate, designController_1.createDesign);
router.get('/my-designs', auth_1.protect, designController_1.getMyDesigns);
router.post('/:id/add-to-cart', auth_1.protect, designController_1.addDesignToCart);
router.put('/:id/publish', auth_1.protect, designController_1.publishDesign);
router.get('/', auth_1.protect, (0, auth_1.authorize)('admin'), designController_1.getAllDesigns);
router.get('/:id', auth_1.protect, designController_1.getDesign);
router.put('/:id', auth_1.protect, designController_1.updateDesign);
router.delete('/:id', auth_1.protect, designController_1.deleteDesign);
exports.default = router;
