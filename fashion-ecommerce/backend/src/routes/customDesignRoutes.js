"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customDesignController_1 = require("../controllers/customDesignController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.post('/', customDesignController_1.createCustomDesignRequest);
router.get('/', (0, auth_1.authorize)('admin'), customDesignController_1.getCustomDesignRequests);
router.put('/:id/status', (0, auth_1.authorize)('admin'), customDesignController_1.updateCustomDesignRequestStatus);
exports.default = router;
