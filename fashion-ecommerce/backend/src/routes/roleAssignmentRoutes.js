"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const roleAssignmentController_1 = require("../controllers/roleAssignmentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.get('/me', roleAssignmentController_1.getMyRoleAssignments);
router.get('/', (0, auth_1.authorize)('admin'), roleAssignmentController_1.getRoleAssignments);
router.post('/', (0, auth_1.authorize)('admin'), roleAssignmentController_1.createRoleAssignment);
router.put('/:id/status', (0, auth_1.authorize)('admin'), roleAssignmentController_1.updateRoleAssignmentStatus);
exports.default = router;
