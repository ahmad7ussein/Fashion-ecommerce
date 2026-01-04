"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
router.post('/register', validator_1.registerValidation, validator_1.validate, authController_1.register);
router.post('/login', validator_1.loginValidation, validator_1.validate, authController_1.login);
router.post('/google', authController_1.googleAuth);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.get('/me', auth_1.protect, authController_1.getMe);
router.put('/profile', auth_1.protect, authController_1.updateProfile);
exports.default = router;
