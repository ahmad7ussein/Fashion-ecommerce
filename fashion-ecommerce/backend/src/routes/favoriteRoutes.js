"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favoriteController_1 = require("../controllers/favoriteController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.get('/', favoriteController_1.getFavorites);
router.get('/check/:productId', favoriteController_1.checkFavorite);
router.post('/toggle/:productId', favoriteController_1.toggleFavorite);
router.post('/:productId', favoriteController_1.addFavorite);
router.delete('/:productId', favoriteController_1.removeFavorite);
exports.default = router;
