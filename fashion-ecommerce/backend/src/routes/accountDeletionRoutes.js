"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountDeletionController_1 = require("../controllers/accountDeletionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.post("/", accountDeletionController_1.createAccountDeletionRequest);
router.get("/my", accountDeletionController_1.getMyAccountDeletionRequest);
router.get("/", (0, auth_1.authorize)("admin", "employee"), accountDeletionController_1.getAccountDeletionRequests);
router.put("/:id/status", (0, auth_1.authorize)("admin"), accountDeletionController_1.updateAccountDeletionStatus);
exports.default = router;
