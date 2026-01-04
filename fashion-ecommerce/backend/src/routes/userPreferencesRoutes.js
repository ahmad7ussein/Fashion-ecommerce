"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userPreferencesController_1 = require("../controllers/userPreferencesController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.get('/', userPreferencesController_1.getUserPreferences);
router.put('/', userPreferencesController_1.updateUserPreferences);
exports.default = router;
