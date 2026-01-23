"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/encoding', (_req, res) => {
    res.json({
        success: true,
        message: "Arabic encoding check",
        sample: "مرحبا بكم في لوحة التحكم",
        rtlSample: "هذا نص عربي للتحقق من الترميز والاتجاه",
        englishSample: "Arabic encoding check (UTF-8)",
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
