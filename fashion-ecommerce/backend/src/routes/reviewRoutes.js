"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', reviewController_1.getApprovedReviews);
router.post('/', auth_1.protect, reviewController_1.createReview);
router.get('/my-reviews', auth_1.protect, reviewController_1.getMyReviews);
router.delete('/:id', auth_1.protect, reviewController_1.deleteReview);
router.get('/all', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), reviewController_1.getAllReviews);
router.put('/:id/status', auth_1.protect, (0, auth_1.authorize)('admin', 'employee'), reviewController_1.updateReviewStatus);
exports.default = router;
