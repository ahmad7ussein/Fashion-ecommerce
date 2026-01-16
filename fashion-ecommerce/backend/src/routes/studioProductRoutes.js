"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const studioProductController_1 = require("../controllers/studioProductController");
const router = express_1.default.Router();
router.get('/active', studioProductController_1.getActiveStudioProducts);
router.use(auth_1.protect, (0, auth_1.authorize)('admin', 'employee'));
router.get('/', studioProductController_1.getAllStudioProducts);
router.get('/:id', studioProductController_1.getStudioProduct);
router.post('/', studioProductController_1.createStudioProduct);
router.put('/:id', studioProductController_1.updateStudioProduct);
router.delete('/:id', studioProductController_1.deleteStudioProduct);
exports.default = router;
