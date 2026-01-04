"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactController_1 = require("../controllers/contactController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/', contactController_1.createContactMessage);
router.get('/', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), contactController_1.getContactMessages);
router.get('/:id', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), contactController_1.getContactMessage);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), contactController_1.updateContactMessage);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('admin'), contactController_1.deleteContactMessage);
exports.default = router;
