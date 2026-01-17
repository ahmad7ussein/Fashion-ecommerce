"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/create-checkout-session", auth_1.protect, paymentController_1.createCheckoutSession);
router.get("/verify", auth_1.protect, paymentController_1.verifyCheckoutSession);
exports.default = router;
