"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.get('/meta/categories', productController_1.getCategories);
router.get('/meta/genders', productController_1.getGenders);
router.get('/', productController_1.getProducts);
router.get('/:id', productController_1.getProduct);
router.post('/', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), upload_1.uploadProductImages, validator_1.productValidation, validator_1.validate, productController_1.createProduct);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), upload_1.uploadProductImages, productController_1.updateProduct);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), productController_1.deleteProduct);
exports.default = router;
